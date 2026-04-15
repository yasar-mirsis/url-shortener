import { Request, Response, NextFunction } from 'express';

/**
 * Log entry structure for structured JSON logging
 */
export interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ip: string;
}

/**
 * Custom simplified logger that outputs JSON to stdout
 */
export class Logger {
  /**
   * Format and output a log entry as JSON to stdout
   */
  static log(entry: LogEntry): void {
    const logLine = JSON.stringify({
      level: 'info',
      ...entry
    });
    console.log(logLine);
  }

  /**
   * Create a log entry from request/response data
   */
  static createLogEntry(
    req: Request,
    res: Response,
    responseTime: number
  ): LogEntry {
    return {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      ip: this.getClientIp(req)
    };
  }

  /**
   * Extract client IP address from request
   */
  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Log an error message
   */
  static error(message: string, meta?: Record<string, unknown>): void {
    const entry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };
    console.error(JSON.stringify(entry));
  }

  /**
   * Log a warning message
   */
  static warn(message: string, meta?: Record<string, unknown>): void {
    const entry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };
    console.log(JSON.stringify(entry));
  }
}

/**
 * Express middleware for request logging
 * Logs method, path, statusCode, responseTime, timestamp, and IP address
 * for every request in JSON format to stdout
 */
export const requestLogger = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Override res.end to capture response and log after response is sent
    const originalEnd = res.end;
    res.end = function (...args: unknown[]): unknown {
      const responseTime = Date.now() - startTime;
      const logEntry = Logger.createLogEntry(req, res, responseTime);
      Logger.log(logEntry);
      return originalEnd.apply(res, args as [data?: unknown, encoding?: string]);
    };

    next();
  };
};

export default Logger;
