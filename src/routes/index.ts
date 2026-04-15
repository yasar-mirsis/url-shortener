import { Application, Router } from 'express';
import rateLimit from 'express-rate-limit';

// Create routers for different routes
const urlRouter = Router();
const statsRouter = Router();

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to API routes
urlRouter.use(apiLimiter);
statsRouter.use(apiLimiter);

// Placeholder route handlers (to be implemented)
urlRouter.post('/shorten', (req, res) => {
  try {
    const { url, customAlias } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // TODO: Implement URL shortening logic
    res.json({ shortCode: 'abc123', originalUrl: url, createdAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

urlRouter.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    // TODO: Implement redirect logic
    res.status(404).json({ error: 'Short code not found' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

statsRouter.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    // TODO: Implement stats logic
    res.json({
      originalUrl: 'https://example.com',
      shortCode: code,
      clicks: 0,
      createdAt: new Date().toISOString(),
      lastClickedAt: null
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register all routes with the main app
export const registerRoutes = (app: Application): void => {
  app.use('/api', urlRouter);
  app.use('/api/stats', statsRouter);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
};

export { urlRouter, statsRouter };
