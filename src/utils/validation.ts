/**
 * Validate if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  if (typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate if a string is a valid custom alias
 * - Alphanumeric only
 * - Length between 3-20 characters
 */
export const isValidCustomAlias = (alias: string): boolean => {
  if (typeof alias !== 'string') {
    return false;
  }
  
  const trimmed = alias.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return false;
  }
  
  // Only alphanumeric characters allowed
  const aliasRegex = /^[a-zA-Z0-9]+$/;
  return aliasRegex.test(trimmed);
};

/**
 * Pagination parameters type
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Validate and normalize pagination parameters
 */
export const validatePagination = (
  page: unknown,
  limit: unknown
): PaginationParams => {
  const parsedPage = typeof page === 'number' ? page : parseInt(page as string, 10);
  const parsedLimit = typeof limit === 'number' ? limit : parseInt(limit as string, 10);
  
  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const validLimit = isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 ? 10 : parsedLimit;
  
  return {
    page: validPage,
    limit: validLimit
  };
};
