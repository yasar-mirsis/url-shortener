/**
 * Represents a shortened URL with its metadata
 */
export interface URLData {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  lastClickedAt: string | null;
}

/**
 * Result of paginated query
 */
export interface PaginatedResult {
  data: URLData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parameters for paginated requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}
