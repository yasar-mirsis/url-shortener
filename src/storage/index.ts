import { URLData, PaginatedResult } from '../types';

// In-memory storage using Map
const urlStore: Map<string, URLData> = new Map();

/**
 * Save a URL data object to storage
 */
export const save = async (urlData: URLData): Promise<void> => {
  if (urlStore.has(urlData.shortCode)) {
    throw new Error(`Short code ${urlData.shortCode} already exists`);
  }
  urlStore.set(urlData.shortCode, urlData);
  return Promise.resolve();
};

/**
 * Find a URL by its short code
 */
export const findById = async (code: string): Promise<URLData | null> => {
  const urlData = urlStore.get(code);
  return Promise.resolve(urlData || null);
};

/**
 * Find all URLs with pagination
 */
export const findAll = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult> => {
  const allUrls = Array.from(urlStore.values());
  const total = allUrls.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = allUrls.slice(startIndex, endIndex);
  
  const result: PaginatedResult = {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
  
  return Promise.resolve(result);
};

/**
 * Delete a URL by its short code
 */
export const deleteById = async (code: string): Promise<boolean> => {
  return Promise.resolve(urlStore.delete(code));
};

/**
 * Increment click count for a short code
 */
export const incrementClicks = async (code: string): Promise<void> => {
  const urlData = urlStore.get(code);
  if (!urlData) {
    throw new Error(`Short code ${code} not found`);
  }
  
  urlData.clicks += 1;
  urlData.lastClickedAt = new Date().toISOString();
  urlStore.set(code, urlData);
  return Promise.resolve();
};

// Export as default object for easier importing
export const storage = {
  save,
  findById,
  findAll,
  deleteById,
  incrementClicks
};
