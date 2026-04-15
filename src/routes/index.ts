import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createShortUrl,
  getShortCodeOrThrow,
  deleteUrlOrThrow,
  getAllLinks,
  UrlValidationError,
  UrlConflictError,
  UrlNotFoundError
} from '../services/urlService';
import { handleRedirect } from '../handlers/redirectHandler';
import { validatePagination } from '../utils/validation';

// Create routers for different route groups
const urlRouter = express.Router();
const statsRouter = express.Router();
const linksRouter = express.Router();

// Rate limiter for POST/DELETE endpoints (stricter limits)
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for POST
  message: { error: 'Too many requests, please try again later.' }
});

const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for DELETE
  message: { error: 'Too many requests, please try again later.' }
});

// Rate limiter for GET endpoints
const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for GET
  message: { error: 'Too many requests, please try again later.' }
});

/**
 * POST /api/shorten - Create a shortened URL
 * Body: { url: string, customAlias?: string }
 * Returns: { shortCode: string, originalUrl: string, createdAt: string }
 * Status codes: 201 (created), 400 (validation error), 409 (conflict)
 */
urlRouter.post('/shorten', postLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, customAlias } = req.body;

    // Validate that URL is provided
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Create the shortened URL
    const urlData = await createShortUrl(url, customAlias);

    // Return 201 Created with the URL data
    res.status(201).json({
      shortCode: urlData.shortCode,
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof UrlValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof UrlConflictError) {
      return res.status(409).json({ error: error.message });
    }
    // Pass other errors to the global error handler
    next(error);
  }
});

/**
 * GET /api/:code - Redirect to original URL
 * Returns: 302 redirect with Location header
 * Status codes: 302 (redirect), 404 (not found)
 */
urlRouter.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    await handleRedirect(code, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/:code - Get statistics for a shortened URL
 * Returns: { originalUrl, shortCode, clicks, createdAt, lastClickedAt }
 * Status codes: 200 (success), 404 (not found)
 */
statsRouter.get('/:code', getLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const urlData = await getShortCodeOrThrow(code);

    res.json({
      originalUrl: urlData.originalUrl,
      shortCode: urlData.shortCode,
      clicks: urlData.clicks,
      createdAt: urlData.createdAt,
      lastClickedAt: urlData.lastClickedAt
    });
  } catch (error) {
    if (error instanceof UrlNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/links - List all shortened URLs with pagination
 * Query params: page (default 1), limit (default 10, max 100)
 * Returns: { data: URLData[], total: number, page: number, limit: number, totalPages: number }
 * Status codes: 200 (success)
 */
linksRouter.get('/', getLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    const result = await getAllLinks(validPage, validLimit);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/:code - Delete a shortened URL
 * Returns: { message: string }
 * Status codes: 200 (deleted), 404 (not found)
 */
urlRouter.delete('/:code', deleteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    await deleteUrlOrThrow(code);

    res.json({ message: `Short code '${code}' deleted successfully` });
  } catch (error) {
    if (error instanceof UrlNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * Register all routes with the Express app
 */
export const registerRoutes = (app: Application): void => {
  // Register route groups
  app.use('/api', urlRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/links', linksRouter);

  // Health check endpoint (excluded from rate limiting in index.ts)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });
};
