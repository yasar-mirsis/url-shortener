import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Rate limiter configuration options
 */
interface RateLimiterOptions {
  /** Time window in milliseconds (default: 15 minutes) */
  windowMs?: number;
  /** Maximum number of requests per window (default: 100) */
  maxRequests?: number;
  /** Message to return when rate limit is exceeded (default: 'Too many requests, please try again later.') */
  message?: string;
  /** Function to determine if rate limiting should be skipped for a request */
  skip?: (req: Request) => boolean;
}

/**
 * Store for tracking request timestamps per IP
 * Key: IP address, Value: Array of request timestamps
 */
const requestStore: Map<string, number[]> = new Map();

/**
 * Default rate limiter configuration
 */
const defaultOptions: Required<RateLimiterOptions> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  skip: () => false
};

/**
 * Get the client IP address from a request
 * Checks X-Forwarded-For header for proxied requests
 */
const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (typeof forwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  if (req.headers['x-real-ip']) {
    return Array.isArray(req.headers['x-real-ip'])
      ? req.headers['x-real-ip'][0]
      : req.headers['x-real-ip'];
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Clean up expired timestamps for a given IP
 * Removes timestamps older than the window
 */
const cleanExpiredTimestamps = (ip: string, windowMs: number): void => {
  const now = Date.now();
  const cutoff = now - windowMs;
  
  const timestamps = requestStore.get(ip);
  if (!timestamps) return;
  
  const validTimestamps = timestamps.filter(timestamp => timestamp > cutoff);
  
  if (validTimestamps.length === 0) {
    requestStore.delete(ip);
  } else {
    requestStore.set(ip, validTimestamps);
  }
};

/**
 * Calculate seconds until the rate limit window resets
 */
const getRetryAfterSeconds = (timestamps: number[], windowMs: number): number => {
  if (timestamps.length === 0) return 0;
  
  const oldestTimestamp = Math.min(...timestamps);
  const windowEnd = oldestTimestamp + windowMs;
  const retryAfter = Math.ceil((windowEnd - Date.now()) / 1000);
  
  return Math.max(0, retryAfter);
};

/**
 * Rate limiting middleware factory
 * 
 * Creates Express middleware that limits requests per IP address using
 * in-memory storage. Tracks request timestamps and returns 429 status
 * when the limit is exceeded.
 * 
 * @param options - Rate limiter configuration options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const limiter = createRateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 100,
 *   skip: (req) => req.path === '/health'
 * });
 * app.use(limiter);
 * ```
 */
export const createRateLimiter = (options: RateLimiterOptions = {}): RequestHandler => {
  const config: Required<RateLimiterOptions> = {
    ...defaultOptions,
    ...options
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if rate limiting should be skipped
    if (config.skip(req)) {
      next();
      return;
    }

    const ip = getClientIp(req);
    const now = Date.now();
    
    // Clean up expired timestamps
    cleanExpiredTimestamps(ip, config.windowMs);
    
    // Get current timestamps for this IP
    const timestamps = requestStore.get(ip) || [];
    
    // Check if limit is exceeded
    if (timestamps.length >= config.maxRequests) {
      const retryAfter = getRetryAfterSeconds(timestamps, config.windowMs);
      
      // Set Retry-After header (in seconds)
      res.setHeader('Retry-After', retryAfter.toString());
      
      // Return 429 Too Many Requests
      res.status(429).json({ error: config.message });
      return;
    }
    
    // Add current timestamp to the array
    timestamps.push(now);
    requestStore.set(ip, timestamps);
    
    // Continue to next middleware
    next();
  };
};

/**
 * Convenience function to get current rate limit stats for an IP
 * Useful for testing and debugging
 */
export const getRateLimitStats = (ip: string): { count: number; windowMs: number } => {
  const timestamps = requestStore.get(ip) || [];
  return {
    count: timestamps.length,
    windowMs: defaultOptions.windowMs
  };
};

/**
 * Clear rate limit data for a specific IP
 * Useful for testing or admin operations
 */
export const clearRateLimitForIp = (ip: string): void => {
  requestStore.delete(ip);
};

/**
 * Clear all rate limit data
 * Resets rate limiting for all IPs
 */
export const clearAllRateLimits = (): void => {
  requestStore.clear();
};

// Export the default rate limiter instance with standard configuration
export const rateLimiter = createRateLimiter();

export default rateLimiter;
