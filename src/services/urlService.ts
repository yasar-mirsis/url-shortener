import { storage } from '../storage';
import { URLData, PaginatedResult } from '../types';

/**
 * Generate a random 6-character short code
 */
export const generateRandomCode = async (length: number = 6): Promise<string> => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  
  do {
    code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (await storage.findById(code) !== null);
  
  return code;
};

/**
 * Create a new shortened URL
 */
export const createShortUrl = async (
  url: string,
  customAlias?: string
): Promise<URLData> => {
  const shortCode = customAlias || await generateRandomCode();
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
 */
export const getShortCode = async (code: string): Promise<URLData | null> => {
  return await storage.findById(code);
};

/**
 * Increment click count for a short code
 */
export const incrementClick = async (code: string): Promise<void> => {
  await storage.incrementClicks(code);
};

/**
 * Delete a URL by its code
 */
export const deleteUrl = async (code: string): Promise<boolean> => {
  return await storage.deleteById(code);
};

/**
 * Get all links with pagination
 */
export const getAllLinks = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult> => {
  return await storage.findAll(page, limit);
};
