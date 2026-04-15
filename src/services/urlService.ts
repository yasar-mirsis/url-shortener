import { storage } from '../storage';
import { URLData, PaginatedResult } from '../types';
import { isValidUrl, isValidCustomAlias } from '../utils/validation';

/**
 * Error thrown when a URL already exists (conflict)
 */
export class UrlConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlConflictError';
  }
}

/**
 * Error thrown when URL format is invalid
 */
export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlValidationError';
  }
}

/**
 * Error thrown when a short code is not found
 */
export class UrlNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlNotFoundError';
  }
}

/**
 * Generate a random 6-character short code
 * Uses alphanumeric characters with collision detection
 */
export const generateRandomCode = async (length: number = 6): Promise<string> => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let attempts = 0;
  const maxAttempts = 1000;
  
  do {
    code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new UrlValidationError('Unable to generate unique short code after multiple attempts');
    }
  } while (await storage.findById(code) !== null);
  
  return code;
};

/**
 * Create a new shortened URL
 * Validates URL format and custom alias if provided
 * Throws UrlValidationError for invalid URL
 * Throws UrlConflictError for duplicate custom alias
 */
export const createShortUrl = async (
  url: string,
  customAlias?: string
): Promise<URLData> => {
  // Validate URL format
  if (!isValidUrl(url)) {
    throw new UrlValidationError('Invalid URL format. URL must start with http:// or https://');
  }
  
  let shortCode: string;
  
  if (customAlias) {
    // Validate custom alias format
    if (!isValidCustomAlias(customAlias)) {
      throw new UrlValidationError(
        'Invalid custom alias. Must be 3-20 alphanumeric characters only.'
      );
    }
    
    // Check for collision with existing alias
    const existingUrl = await storage.findById(customAlias);
    if (existingUrl !== null) {
      throw new UrlConflictError(`Custom alias '${customAlias}' is already taken`);
    }
    
    shortCode = customAlias;
  } else {
    // Generate random code
    shortCode = await generateRandomCode();
  }
  
  const now = new Date().toISOString();
  
  const urlData: URLData = {
    shortCode,
    originalUrl: url,
    clicks: 0,
    createdAt: now,
    lastClickedAt: null
  };
  
  await storage.save(urlData);
  return urlData;
};

/**
 * Get a short code by its code
 * Returns null if not found
 */
export const getShortCode = async (code: string): Promise<URLData | null> => {
  return await storage.findById(code);
};

/**
 * Get a short code by its code (throws if not found)
 * @throws UrlNotFoundError if the code does not exist
 */
export const getShortCodeOrThrow = async (code: string): Promise<URLData> => {
  const urlData = await storage.findById(code);
  if (!urlData) {
    throw new UrlNotFoundError(`Short code '${code}' not found`);
  }
  return urlData;
};

/**
 * Increment click count for a short code
 * @throws UrlNotFoundError if the code does not exist
 */
export const incrementClick = async (code: string): Promise<void> => {
  const urlData = await storage.findById(code);
  if (!urlData) {
    throw new UrlNotFoundError(`Short code '${code}' not found`);
  }
  await storage.incrementClicks(code);
};

/**
 * Delete a URL by its code
 * @returns true if deleted, false if not found
 */
export const deleteUrl = async (code: string): Promise<boolean> => {
  return await storage.deleteById(code);
};

/**
 * Delete a URL by its code (throws if not found)
 * @throws UrlNotFoundError if the code does not exist
 */
export const deleteUrlOrThrow = async (code: string): Promise<void> => {
  const urlData = await storage.findById(code);
  if (!urlData) {
    throw new UrlNotFoundError(`Short code '${code}' not found`);
  }
  await storage.deleteById(code);
};

/**
 * Get all links with pagination
 * Validates and normalizes pagination parameters
 */
export const getAllLinks = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult> => {
  // Validate and normalize pagination parameters
  const validPage = typeof page === 'number' && page >= 1 ? page : 1;
  const validLimit = typeof limit === 'number' && limit >= 1 && limit <= 100 ? limit : 10;
  
  return await storage.findAll(validPage, validLimit);
};

// Export all functions as a service object for easier importing
export const urlService = {
  generateRandomCode,
  createShortUrl,
  getShortCode,
  getShortCodeOrThrow,
  incrementClick,
  deleteUrl,
  deleteUrlOrThrow,
  getAllLinks,
  // Error classes
  UrlConflictError,
  UrlValidationError,
  UrlNotFoundError
};
