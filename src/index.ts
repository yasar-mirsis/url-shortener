import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes';
import { requestLogger } from './utils/logger';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// CORS middleware - allow all origins
app.use((req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// JSON body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Rate limiting middleware - 100 requests per 15 minutes per IP
// Exclude /health endpoint from rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request): boolean => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// Register all routes
registerRoutes(app);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON format' });
    return;
  }
  
  // Handle rate limit errors (express-rate-limit sets status code)
  if ('statusCode' in err && err.statusCode === 429) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }
  
  // Default error response
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for undefined routes
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
export const start = async (port: number = PORT): Promise<Server> => {
  const server: Server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  return server;
};

// Only start if this is the main module
if (require.main === module) {
  start()
    .then(() => {
      console.log(`URL Shortener API started on port ${PORT}`);
    })
    .catch((error: Error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

export default app;
