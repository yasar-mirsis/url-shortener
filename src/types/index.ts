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
 * Request body for creating a shortened URL
 */
export interface CreateUrlRequest {
  url: string;
  customAlias?: string;
}

/**
 * Response for a created shortened URL
 */
export interface CreateUrlResponse {
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

/**
 * Response for URL statistics
 */
export interface UrlStatsResponse {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
  lastClickedAt: string | null;
}
