# URL Shortener REST API - Architecture Document

## System Overview

The URL Shortener is a RESTful API service that provides URL shortening, redirection, and analytics capabilities. The system accepts long URLs and generates compact 6-character short codes, handles redirects with click tracking, and exposes statistics and management endpoints for API consumers.

**Key Capabilities:**
- Generate shortened URLs with random or custom codes
- Fast HTTP 302 redirects to original URLs
- Click analytics and link statistics
- Paginated link listing
- Link management (delete)

**Architecture Style:** Layered REST API with in-memory data store (expandable to persistent storage)

---

## Components

### 1. API Gateway / Router (`src/routes/`)
**Responsibility:** Route incoming HTTP requests to appropriate handlers, enforce rate limiting, and handle CORS.

**Interfaces:**
- `registerRoutes(app: Express): void` - Registers all API endpoints

### 2. HTTP Server (`src/index.ts`)
**Responsibility:** Bootstraps Express application, configures middleware, starts HTTP listener.

**Interfaces:**
- `start(port: number): Promise<Server>` - Starts the server

### 3. URL Service (`src/services/urlService.ts`)
**Responsibility:** Business logic for URL shortening, alias validation, and link management.

**Interfaces:**
- `createShortUrl(url: string, customAlias?: string): Promise<URLData>`
- `getShortCode(code: string): Promise<URLData | null>`
- `incrementClick(code: string): Promise<void>`
- `deleteUrl(code: string): Promise<boolean>`
- `getAllLinks(page: number, limit: number): Promise<PaginatedResult>`
- `generateRandomCode(length: number): Promise<string>`

### 4. Storage Adapter (`src/storage/`)
**Responsibility:** Abstracts data persistence layer (in-memory implementation with interface for future DB swap).

**Interfaces:**
- `save(urlData: URLData): Promise<void>`
- `findById(code: string): Promise<URLData | null>`
- `findAll(page: number, limit: number): Promise<PaginatedResult>`
- `deleteById(code: string): Promise<boolean>`
- `incrementClicks(code: string): Promise<void>`

### 5. Redirect Handler (`src/handlers/redirectHandler.ts`)
**Responsibility:** Processes redirect requests, updates click statistics, returns 302 response.

**Interfaces:**
- `handleRedirect(code: string, res: Response): Promise<void>`

### 6. Validation Utils (`src/utils/validation.ts`)
**Responsibility:** Input validation for URLs, custom aliases, and pagination parameters.

**Interfaces:**
- `isValidUrl(url: string): boolean`
- `isValidCustomAlias(alias: string): boolean`
- `validatePagination(page: unknown, limit: unknown): PaginationParams`

---

## Data Model

### Entity: URLData

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `shortCode` | string | Unique identifier for shortened URL | Primary key, 6 chars or custom alias |
| `originalUrl` | string | Original long URL | Required, valid URL format |
| `clicks` | number | Total redirect count | Default: 0 |
| `createdAt` | Date | Link creation timestamp | Required, ISO 8601 |
| `lastClickedAt` | Date | Last redirect timestamp | Nullable, ISO 8601 |

### Relationships

```
URLData (no relationships - single entity store)
```

### In-Memory Store Structure

```typescript
interface Storage {
  links: Map<string, URLData>  // key = shortCode
}
```

---

## API Contracts

### POST /shorten
Create a new shortened URL.

**Request:**
```json
{
  "url": "https://example.com/very/long/path",
  "customAlias": "mylink"  // optional
}
```

**Response (200/201):**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/path",
  "createdAt": "2026-04-15T10:30:00.000Z"
}
```

**Response (400 - Invalid URL):**
```json
{
  "error": "Invalid URL format"
}
```

**Response (409 - Custom alias taken):**
```json
{
  "error": "Custom alias already exists"
}
```

---

### GET /:code
Redirect to original URL.

**Response (302):**
- Headers: `Location: <originalUrl>`
- Body: empty

**Response (404 - Not Found):**
```json
{
  "error": "Short code not found"
}
```

---

### GET /stats/:code
Retrieve statistics for a shortened URL.

**Response (200):**
```json
{
  "originalUrl": "https://example.com/very/long/path",
  "shortCode": "abc123",
  "clicks": 42,
  "createdAt": "2026-04-15T10:30:00.000Z",
  "lastClickedAt": "2026-04-15T12:00:00.000Z"
}
```

**Response (404 - Not Found):**
```json
{
  "error": "Short code not found"
}
```

---

### GET /links
List all shortened URLs with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response (200):**
```json
{
  "links": [
    {
      "shortCode": "abc123",
      "originalUrl": "https://example.com",
      "createdAt": "2026-04-15T10:30:00.000Z",
      "clicks": 42
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

**Response (400 - Invalid params):**
```json
{
  "error": "Invalid pagination parameters"
}
```

---

### DELETE /:code
Delete a shortened URL.

**Response (200):**
```json
{
  "message": "Link deleted successfully"
}
```

**Response (404 - Not Found):**
```json
{
  "error": "Short code not found"
}
```

---

## Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Runtime** | Node.js 20 LTS | Non-blocking I/O ideal for redirect-heavy workloads; large ecosystem |
| **Framework** | Express.js | Minimal, mature, excellent for REST APIs; easy middleware composition |
| **Language** | TypeScript | Type safety, better IDE support, compile-time error detection |
| **Storage** | In-memory (Map) | Meets current requirements; O(1) lookups; swapable via adapter pattern |
| **Validation** | Built-in regex | Lightweight; no external deps for simple URL/alias validation |
| **Testing** | Jest | Industry standard for Node.js; excellent TypeScript support |
| **HTTP Client** | Node native fetch | Built-in, no dependencies |
| **Rate Limiting** | Express-rate-limit | Lightweight, configurable, memory-based |

**Assumptions:**
- Single-server deployment initially
- No authentication required (public API)
- Click tracking is eventually consistent acceptable
- Link expiration not required per current requirements

---

## Data Flow

### Flow 1: Create Shortened URL (Random Code)

1. Client sends `POST /shorten` with `{ url: "https://example.com" }`
2. Express router matches route to `urlController.create()`
3. Validation middleware checks URL format
4. URLService calls `generateRandomCode(6)` to create unique code
5. URLService calls StorageAdapter.save() with URLData
6. Storage stores in memory Map
7. Response returns `{ shortCode, originalUrl, createdAt }`

### Flow 2: Create Shortened URL (Custom Alias)

1. Client sends `POST /shorten` with `{ url: "https://example.com", customAlias: "mylink" }`
2. Express router matches route to `urlController.create()`
3. Validation checks URL format AND custom alias (alphanumeric, 3-20 chars)
4. URLService checks if alias already exists in Storage
5. If exists → return 409 Conflict
6. If available → save with custom alias as shortCode
7. Response returns `{ shortCode, originalUrl, createdAt }`

### Flow 3: Redirect to Original URL

1. User/browser sends `GET /abc123`
2. Express router matches wildcard route to `redirectHandler.handle()`
3. StorageAdapter.findById("abc123") retrieves URLData
4. If not found → return 404 Not Found
5. StorageAdapter.incrementClicks("abc123") updates clicks counter
6. Update `lastClickedAt` to current timestamp
7. Response: `302 Found` with `Location: <originalUrl>` header

### Flow 4: Get Link Statistics

1. Client sends `GET /stats/abc123`
2. Express router matches to `urlController.getStats()`
3. StorageAdapter.findById("abc123") retrieves URLData
4. If not found → return 404
5. Response returns `{ originalUrl, shortCode, clicks, createdAt, lastClickedAt }`

### Flow 5: List Links with Pagination

1. Client sends `GET /links?page=1&limit=10`
2. Express router matches to `urlController.getLinks()`
3. Validation validates page/limit (positive integers)
4. StorageAdapter.findAll(page, limit) retrieves paginated results
5. Response returns `{ links: [...], page, limit, total }`

### Flow 6: Delete Link

1. Client sends `DELETE /abc123`
2. Express router matches to `urlController.delete()`
3. StorageAdapter.deleteById("abc123") removes from store
4. If deleted → return 200 success
5. If not found → return 404

---

## Security Considerations

### 1. Input Validation
- All URLs must be validated against RFC 3986 format
- Custom aliases restricted to alphanumeric only (regex: `^[a-zA-Z0-9]{3,20}$`)
- Pagination params sanitized to prevent negative/zero values

### 2. Rate Limiting
- Implement per-IP rate limiting to prevent abuse
- Suggested: 100 requests/minute for create endpoints
- Suggested: 1000 requests/minute for redirect endpoints

### 3. Open Redirect Prevention
- Validate that originalUrl uses http:// or https:// protocol
- Block javascript:, data:, and other dangerous schemes
- Consider URL allowlist/denylist for production

### 4. Denial of Service
- Padding oracle attacks not applicable (in-memory, no crypto)
- Memory exhaustion: implement max links limit (e.g., 1M links)
- Consider implementing TTL-based cleanup for inactive links

### 5. CORS
- Configure allowed origins for browser-based clients
- Default: allow all origins for public API (configurable)

### 6. Logging & Monitoring
- Log all creation and deletion events
- Track 4xx/5xx error rates
- Monitor redirect latency (p95, p99)

---

## Scalability Notes

### Current Limitations (Single-Node In-Memory)
- All state stored in process memory → not durable across restarts
- Not horizontally scalable (no shared state)
- Memory bounded by server RAM

### Horizontal Scaling Strategy

**Phase 1: Persistent Storage**
- Replace in-memory Map with PostgreSQL
- Add connection pooling
- Create indexes on `shortCode` for O(1) lookups

**Phase 2: Distributed Cache**
- Add Redis as primary store for hot data
- PostgreSQL as persistence layer (async replication)
- Use Redis TTL for automatic cleanup of inactive links

**Phase 3: Read Replicas**
- Redirect endpoints hit read replicas (high read volume)
- Write endpoints hit primary
- Eventual consistency acceptable for click counts

### Performance Optimizations

1. **Cache-Warming:** Pre-load frequently accessed links into cache
2. **CDN Integration:** Serve redirects from edge locations
3. **Batch Operations:** Support bulk URL shortening
4. **Async Click Tracking:** Decrement click counter asynchronously for redirect speed

### Resource Estimates
- 6-char alphanumeric codes: 62^6 = 56.8 billion unique codes
- Memory per link: ~200 bytes
- 1M links = ~200MB RAM
- 100M clicks/day at 50ms redirect = ~5M RPS capacity needed

### Monitoring Metrics
- `redirect_latency_ms` - p50, p95, p99
- `links_created_total` - counter
- `links_deleted_total` - counter
- `clicks_total` - counter
- `error_rate` - percentage of 4xx/5xx responses
