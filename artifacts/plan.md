## Overview

This plan implements a URL Shortener REST API using TypeScript, Express.js, and an in-memory data store. The system provides endpoints for creating shortened URLs (with random or custom aliases), redirecting to original URLs with click tracking, retrieving link statistics, listing links with pagination, and deleting links. The implementation includes comprehensive input validation, rate limiting, request logging, and unit/integration tests to ensure reliability and performance.

## Tasks

### 1. Project Initialization and Configuration
**Description:** Set up the Node.js/TypeScript project with all necessary dependencies, configuration files, and folder structure. This includes package.json with all required dependencies (Express, TypeScript, Jest, etc.), tsconfig.json with strict mode enabled, ESLint configuration, and the basic folder structure (src/, src/routes/, src/services/, src/storage/, src/handlers/, src/utils/, tests/).

**Files to create:**
- package.json
- tsconfig.json
- .eslintrc.json
- .eslintignore
- .gitignore
- src/index.ts
- src/routes/index.ts
- src/services/urlService.ts
- src/storage/index.ts
- src/handlers/redirectHandler.ts
- src/utils/validation.ts
- tests/setup.ts
- jest.config.js

**Files to modify:**
- None

**Complexity:** Low
**Dependencies:** None

### 2. Data Models and Types
**Description:** Define all TypeScript interfaces and types for the URL shortener. Create src/types.ts with URLData interface (shortCode, originalUrl, clicks, createdAt, lastClickedAt), PaginatedResult interface, PaginationParams interface, and ErrorResponse interface. Ensure all types are properly exported for use across the codebase.

**Files to create:**
- src/types.ts

**Files to modify:**
- src/services/urlService.ts (import types)
- src/storage/index.ts (import types)
- src/handlers/redirectHandler.ts (import types)
- src/routes/index.ts (import types)

**Complexity:** Low
**Dependencies:** 1

### 3. URL and Alias Validation Utilities
**Description:** Implement input validation functions in src/utils/validation.ts. Create isValidUrl() using URL API to validate HTTP/HTTPS format, isValidCustomAlias() to check alphanumeric only and 3-20 character length, and validatePagination() to ensure page and limit are positive integers with defaults (page=1, limit=10). Export these functions for use by controllers and services.

**Files to create:**
- src/utils/validation.ts

**Files to modify:**
- src/routes/index.ts (import validation)
- src/services/urlService.ts (import validation)

**Complexity:** Low
**Dependencies:** 2

### 4. In-Memory Storage Implementation
**Description:** Implement the storage adapter in src/storage/index.ts using a Map data structure. Create Storage class with methods: save() to store URLData, findById() to retrieve by shortCode, findAll() with pagination support, deleteById() to remove links, incrementClicks() to update click count and lastClickedAt. Ensure thread-safe operations within Node.js single-threaded context.

**Files to create:**
- src/storage/index.ts

**Files to modify:**
- src/services/urlService.ts (import storage)
- src/handlers/redirectHandler.ts (import storage)
- src/routes/index.ts (import storage)

**Complexity:** Medium
**Dependencies:** 2

### 5. URL Service Business Logic
**Description:** Implement the core business logic in src/services/urlService.ts. Create functions: generateRandomCode() for 6-character alphanumeric codes with collision detection, createShortUrl() to handle both random and custom alias creation with validation, getShortCode() to retrieve link data, deleteUrl() to remove links, getAllLinks() for paginated listing. Ensure custom alias validation and collision checking.

**Files to create:**
- src/services/urlService.ts

**Files to modify:**
- src/storage/index.ts (use storage methods)
- src/utils/validation.ts (import validation)
- src/routes/index.ts (import service)
- src/handlers/redirectHandler.ts (import service)

**Complexity:** Medium
**Dependencies:** 2, 3, 4

### 6. HTTP Server and Middleware Setup
**Description:** Implement src/index.ts to bootstrap the Express application. Configure CORS (allow all), JSON body parsing, request logging middleware, rate limiting middleware (100 requests per 15 minutes per IP, excluding /health), and error handling middleware. Start the HTTP server on configurable port (default 3000).

**Files to create:**
- src/index.ts

**Files to modify:**
- src/routes/index.ts (register routes)
- src/utils/validation.ts (import for logging if needed)

**Complexity:** Medium
**Dependencies:** 1, 3

### 7. Request Logging Middleware
**Description:** Create middleware in src/utils/logger.ts for structured JSON logging. Log method, path, statusCode, responseTime, timestamp, and IP address for every request. Use winston or simplified custom logger. Ensure logs are written to stdout in JSON format for easy parsing.

**Files to create:**
- src/utils/logger.ts

**Files to modify:**
- src/index.ts (import and use logger)

**Complexity:** Low
**Dependencies:** 3

### 8. Rate Limiting Middleware
**Description:** Create rate limiting middleware in src/utils/rateLimiter.ts using in-memory storage. Implement 100 requests per 15-minute window per IP address. Track requests using Map with IP as key and timestamp array as value. Return 429 status with Retry-After header when limit exceeded. Exclude /health endpoint from rate limiting.

**Files to create:**
- src/utils/rateLimiter.ts

**Files to modify:**
- src/index.ts (import and use rate limiter)
- src/routes/index.ts (routes apply rate limiting)

**Complexity:** Medium
**Dependencies:** 3, 7

### 9. Routes Registration - Create, Stats, List, Delete Endpoints
**Description:** Implement src/routes/index.ts to register all API routes. Create POST /shorten (with rate limiting), GET /stats/:code, GET /links (with pagination), DELETE /:code (with rate limiting), and GET /health. Each route should call appropriate service functions and return properly formatted responses with correct HTTP status codes.

**Files to create:**
- src/routes/index.ts

**Files to modify:**
- src/services/urlService.ts (export functions)
- src/utils/validation.ts (import for validation)
- src/utils/rateLimiter.ts (import for rate limiting)
- src/index.ts (routes registered here)

**Complexity:** Medium
**Dependencies:** 4, 5, 7, 8

### 10. Redirect Handler and Wildcard Route
**Description:** Implement src/handlers/redirectHandler.ts for handling 302 redirects. Create handleRedirect() function that retrieves URL by code, increments click count, updates lastClickedAt, and returns 302 with Location header. Add wildcard route in src/routes/index.ts to catch GET /:code and invoke redirect handler. Handle 404 for non-existent codes.

**Files to create:**
- src/handlers/redirectHandler.ts

**Files to modify:**
- src/routes/index.ts (add wildcard route)
- src/services/urlService.ts (import incrementClick)
- src/storage/index.ts (incrementClicks method)

**Complexity:** Medium
**Dependencies:** 4, 5, 9

### 11. Error Handling and Response Formatting
**Description:** Create centralized error handling in src/middleware/errorHandler.ts. Implement error handler middleware that catches all errors and returns consistent JSON error format { error: { code, message, details? } }. Ensure proper HTTP status codes (400, 404, 409, 429, 500) are returned. Add 404 handler for unmatched routes.

**Files to create:**
- src/middleware/errorHandler.ts

**Files to modify:**
- src/index.ts (register error handler)
- src/routes/index.ts (add 404 handler)

**Complexity:** Low
**Dependencies:** 9, 10

### 12. Unit Tests - Validation and Service Logic
**Description:** Create unit tests in tests/utils/validation.test.ts for URL and alias validation functions. Create tests in tests/services/urlService.test.ts for generateRandomCode(), createShortUrl(), getShortCode(), deleteUrl(), getAllLinks(). Test valid/invalid inputs, edge cases, and collision detection. Achieve minimum 80% code coverage.

**Files to create:**
- tests/utils/validation.test.ts
- tests/services/urlService.test.ts
- tests/storage/storage.test.ts

**Files to modify:**
- package.json (add test scripts)
- jest.config.js (configure test setup)

**Complexity:** Medium
**Dependencies:** 2, 3, 4, 5

### 13. Integration Tests - API Endpoints
**Description:** Create integration tests in tests/integration/api.test.ts using supertest. Test all endpoints: POST /shorten (valid, invalid URL, duplicate alias), GET /:code (redirect, 404), GET /stats/:code, GET /links (pagination), DELETE /:code, GET /health. Test error cases, rate limiting, and edge cases.

**Files to create:**
- tests/integration/api.test.ts
- tests/integration/setup.ts

**Files to modify:**
- package.json (add test:integration script)
- src/index.ts (export for testing)

**Complexity:** High
**Dependencies:** 9, 10, 11

### 14. Documentation and API Specification
**Description:** Create README.md with project overview, setup instructions, API documentation (endpoints, request/response formats), and usage examples. Optionally create src/docs/openapi.ts with OpenAPI 3.0 specification for API documentation generation.

**Files to create:**
- README.md
- src/docs/openapi.ts (optional)

**Files to modify:**
- package.json (add docs script if OpenAPI generated)

**Complexity:** Low
**Dependencies:** 9, 10, 11

## File Structure

```
url-shortener/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .eslintignore
├── .gitignore
├── jest.config.js
├── README.md
├── src/
│   ├── index.ts                    # HTTP server bootstrap
│   ├── types.ts                    # TypeScript interfaces
│   ├── routes/
│   │   └── index.ts                # Route registration
│   ├── services/
│   │   └── urlService.ts           # Business logic
│   ├── storage/
│   │   └── index.ts                # In-memory storage adapter
│   ├── handlers/
│   │   └── redirectHandler.ts      # Redirect logic
│   ├── utils/
│   │   ├── validation.ts           # Input validation
│   │   ├── logger.ts               # Request logging
│   │   └── rateLimiter.ts          # Rate limiting
│   ├── middleware/
│   │   └── errorHandler.ts         # Error handling
│   └── docs/ (optional)
│       └── openapi.ts              # OpenAPI spec
└── tests/
    ├── setup.ts                    # Test setup
    ├── utils/
    │   └── validation.test.ts      # Validation unit tests
    ├── services/
    │   └── urlService.test.ts      # Service unit tests
    ├── storage/
    │   └── storage.test.ts         # Storage unit tests
    └── integration/
        ├── setup.ts                # Integration test setup
        └── api.test.ts             # API endpoint tests
```

## Testing Strategy

**Unit Testing:**
- Test validation functions: isValidUrl() with valid/invalid URLs, isValidCustomAlias() with edge cases (empty, too short, too long, special chars), validatePagination() with negative/zero values
- Test URL service: generateRandomCode() collision detection, createShortUrl() random vs custom alias, getShortCode() retrieval, deleteUrl() removal, getAllLinks() pagination
- Test storage: save/retrieve/delete operations, incrementClicks() updates, pagination logic in findAll()

**Integration Testing:**
- POST /shorten: valid URL returns 201 with shortCode, invalid URL returns 400, duplicate customAlias returns 409
- GET /:code: existing code returns 302 redirect with correct Location, non-existing returns 404, click counter increments
- GET /stats/:code: existing code returns full stats, non-existing returns 404, never-clicked link shows clicks: 0, lastClickedAt: null
- GET /links: returns paginated results with correct page/limit/total, empty list when no links, invalid params return 400
- DELETE /:code: existing code returns 200, non-existing returns 404, deleted code returns 404 on subsequent access
- GET /health: returns 200 with healthy status, excluded from rate limiting
- Rate limiting: 100 requests succeed, 101st returns 429 with Retry-After header
- Error handling: consistent JSON error format, proper HTTP status codes

**Test Coverage Requirements:**
- Minimum 80% line coverage
- All validation functions fully covered
- All service methods tested with valid and invalid inputs
- All endpoints tested with success and error cases
- Edge cases: empty links list, pagination beyond data, collision detection

**Test Execution:**
- npm run test: Run all tests (unit + integration)
- npm run test:unit: Run unit tests only
- npm run test:integration: Run integration tests only
- npm run test:coverage: Run tests with coverage report

## Risks

1. **Concurrency Issues:** In-memory Map operations are not truly thread-safe. Concurrent requests generating random codes could result in collisions. *Mitigation:* Implement collision detection with retry loop; accept that extremely rare race conditions may occur.

2. **Memory Leaks:** Long-running service with continuous link creation/deletion could cause memory pressure. *Mitigation:* Monitor memory usage; implement max link limit; consider periodic cleanup of inactive links.

3. **Rate Limiting Accuracy:** In-memory rate limiter may not accurately track across multiple server instances. *Mitigation:* This is a single-instance deployment; document limitation for future distributed deployment.

4. **URL Validation Edge Cases:** Complex URLs with Unicode, international domains, or unusual query parameters may fail validation. *Mitigation:* Use Node.js URL API for robust validation; test with diverse URL formats.

5. **Short Code Collisions:** 6-character alphanumeric codes provide 56.8 billion combinations, but collision probability increases with scale. *Mitigation:* Implement retry logic for code generation; consider increasing to 7-8 characters if scale requires.
