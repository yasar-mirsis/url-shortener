# URL Shortener REST API - Analysis Document

## Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| API Consumers | Developers/Integrators | Need reliable URL shortening service with predictable API behavior |
| End Users | Visitors clicking shortened links | Need fast redirects and working links |
| System Administrators | Operations team | Need monitoring, logging, and rate limiting for stability |
| QA Engineers | Testing team | Need comprehensive test coverage for reliability |
| Product Owner | Business side | Need feature delivery aligned with requirements |

## User Stories

### US1: Create Shortened URL with Random Code
**As an** API consumer  
**I want to** POST a URL to create a shortened link with a randomly generated 6-character code  
**So that** I can share long URLs in a compact format

**Acceptance Criteria:**
- Given a valid URL, when POST /shorten is called with { url: "https://example.com" }, then return { shortCode: "abc123", originalUrl: "https://example.com", createdAt: ISO timestamp }
- Given an invalid URL format, when POST /shorten is called, then return 400 with error message
- The generated short code must be exactly 6 characters
- The short code must be unique (no collisions)

**Priority:** Must

### US2: Create Shortened URL with Custom Alias
**As an** API consumer  
**I want to** specify a custom alias when creating a shortened link  
**So that** I can create memorable or branded short URLs

**Acceptance Criteria:**
- Given a valid URL and available custom alias, when POST /shorten is called with { url: "https://example.com", customAlias: "mylink" }, then return { shortCode: "mylink", originalUrl: "https://example.com", createdAt: ISO timestamp }
- Given a valid URL and duplicate custom alias, when POST /shorten is called, then return 409 Conflict with error message
- Custom alias must be validated (alphanumeric, no special characters)
- Custom alias length must be between 3-20 characters

**Priority:** Must

### US3: Redirect to Original URL
**As an** end user  
**I want to** be redirected to the original URL when visiting a short link  
**So that** I can access the content seamlessly

**Acceptance Criteria:**
- Given a valid short code exists, when GET /:code is called, then return 302 redirect with Location header pointing to original URL
- Given a non-existent short code, when GET /:code is called, then return 404 Not Found
- Each successful redirect must increment the click counter
- The lastClickedAt timestamp must be updated on each redirect

**Priority:** Must

### US4: Get Link Statistics
**As an** API consumer  
**I want to** retrieve statistics for a shortened link  
**So that** I can track engagement and usage

**Acceptance Criteria:**
- Given a valid short code, when GET /stats/:code is called, then return { originalUrl, shortCode, clicks, createdAt, lastClickedAt }
- Given a non-existent short code, when GET /stats/:code is called, then return 404 Not Found
- The clicks count must accurately reflect total redirects
- lastClickedAt should be null if link has never been clicked

**Priority:** Must

### US5: List All Shortened Links with Pagination
**As an** API consumer  
**I want to** list all shortened URLs with pagination  
**So that** I can browse and manage my links

**Acceptance Criteria:**
- When GET /links is called, then return paginated list with { links: [...], page, limit, total }
- Default page is 1, default limit is 10
- Query params page and limit must be respected
- Each link object must include { shortCode, originalUrl, createdAt, clicks }
- Invalid page/limit values should return 400 error

**Priority:** Must

### US6: Delete Shortened Link
**As an** API consumer  
**I want to** delete a shortened link  
**So that** I can remove unwanted or expired links

**Acceptance Criteria:**
- Given a valid short code, when DELETE /:code is called, then return 200 with success message
- Given a non-existent short code, when DELETE /:code is called, then return 404 Not Found
- After deletion, the short code cannot be used for redirect or stats

**Priority:** Must

### US7: Health Check
**As a** system administrator  
**I want to** check the API health status  
**So that** I can monitor service availability

**Acceptance Criteria:**
- When GET /health is called, then return 200 with { status: "healthy", timestamp }
- Health endpoint should not be affected by rate limiting

**Priority:** Must

### US8: Request Logging
**As a** system administrator  
**I want** all requests to be logged with method, path, status, and response time  
**So that** I can debug issues and monitor usage patterns

**Acceptance Criteria:**
- Every request must be logged with HTTP method, request path, response status code, and response time in milliseconds
- Logs must be written to stdout or a log file
- Log format must be consistent and parseable (JSON preferred)

**Priority:** Must

### US9: Rate Limiting
**As a** system administrator  
**I want** to limit requests to 100 per IP per 15 minutes  
**So that** I can prevent abuse and ensure fair usage

**Acceptance Criteria:**
- When an IP exceeds 100 requests in 15 minutes, subsequent requests return 429 Too Many Requests
- Rate limit response must include Retry-After header
- Rate limit counter must reset after 15-minute window
- Rate limit tracking must be in-memory (no external storage)

**Priority:** Must

### US10: Input Validation
**As an** API consumer  
**I want** clear error messages when input is invalid  
**So that** I can quickly fix my requests

**Acceptance Criteria:**
- Invalid URL format returns 400 with descriptive error message
- Missing required fields return 400 with field-specific error
- Duplicate alias returns 409 with clear message
- All error responses must follow consistent JSON structure

**Priority:** Must

## Functional Requirements

### FR1: URL Shortening Endpoint
- **ID:** FR1
- **Description:** POST /shorten endpoint to create shortened URLs
- **Priority:** Must
- **Input:** JSON body { url: string, customAlias?: string }
- **Output:** JSON { shortCode: string, originalUrl: string, createdAt: string }
- **Validation:** URL must be valid HTTP/HTTPS format
- **Error Handling:** 400 for invalid URL, 409 for duplicate custom alias

### FR2: URL Redirection Endpoint
- **ID:** FR2
- **Description:** GET /:code endpoint for 302 redirect
- **Priority:** Must
- **Input:** URL path parameter :code (6 characters)
- **Output:** HTTP 302 with Location header
- **Side Effects:** Increments click counter, updates lastClickedAt
- **Error Handling:** 404 for non-existent code

### FR3: Statistics Endpoint
- **ID:** FR3
- **Description:** GET /stats/:code endpoint for link analytics
- **Priority:** Must
- **Input:** URL path parameter :code
- **Output:** JSON { originalUrl, shortCode, clicks, createdAt, lastClickedAt }
- **Error Handling:** 404 for non-existent code

### FR4: List Links Endpoint
- **ID:** FR4
- **Description:** GET /links endpoint with pagination
- **Priority:** Must
- **Input:** Query params page (default 1), limit (default 10)
- **Output:** JSON { links: array, page: number, limit: number, total: number }
- **Error Handling:** 400 for invalid pagination params

### FR5: Delete Link Endpoint
- **ID:** FR5
- **Description:** DELETE /:code endpoint for link removal
- **Priority:** Must
- **Input:** URL path parameter :code
- **Output:** JSON { message: string }
- **Error Handling:** 404 for non-existent code

### FR6: Health Check Endpoint
- **ID:** FR6
- **Description:** GET /health endpoint for service monitoring
- **Priority:** Must
- **Input:** None
- **Output:** JSON { status: string, timestamp: string }

### FR7: In-Memory Storage
- **ID:** FR7
- **Description:** Use Map data structure for URL storage
- **Priority:** Must
- **Data Structure:** Map<shortCode, LinkObject>
- **LinkObject:** { originalUrl, shortCode, clicks, createdAt, lastClickedAt }

### FR8: URL Validation
- **ID:** FR8
- **Description:** Validate URL format before shortening
- **Priority:** Must
- **Rules:** Must be valid HTTP or HTTPS URL
- **Implementation:** Regex or URL parser validation

### FR9: Short Code Generation
- **ID:** FR9
- **Description:** Generate unique 6-character random codes
- **Priority:** Must
- **Character Set:** Alphanumeric (a-z, A-Z, 0-9)
- **Collision Handling:** Regenerate if collision detected

### FR10: Custom Alias Validation
- **ID:** FR10
- **Description:** Validate custom alias format and availability
- **Priority:** Must
- **Rules:** Alphanumeric only, 3-20 characters
- **Uniqueness:** Must not conflict with existing aliases

### FR11: Request Logging Middleware
- **ID:** FR11
- **Description:** Log all requests with method, path, status, response time
- **Priority:** Must
- **Log Fields:** method, path, statusCode, responseTime, timestamp, ip
- **Format:** JSON structured logs

### FR12: Rate Limiting Middleware
- **ID:** FR12
- **Description:** Limit requests to 100 per IP per 15 minutes
- **Priority:** Must
- **Storage:** In-memory tracker per IP
- **Window:** Sliding or fixed 15-minute window
- **Exclusions:** /health endpoint should be excluded

### FR13: Unit Tests
- **ID:** FR13
- **Description:** Unit tests for URL validation and short code generation
- **Priority:** Must
- **Coverage:** URL validation logic, short code generation logic
- **Framework:** Jest or similar

### FR14: Integration Tests
- **ID:** FR14
- **Description:** Integration tests for all endpoints
- **Priority:** Must
- **Coverage:** All CRUD operations, error cases, edge cases
- **Framework:** Jest with supertest or similar

## Non-Functional Requirements

### NFR1: Performance
- **ID:** NFR1
- **Description:** API response time under 100ms for 95th percentile
- **Priority:** Must
- **Metric:** p95 response time < 100ms

### NFR2: Memory Usage
- **ID:** NFR2
- **Description:** Memory-efficient in-memory storage
- **Priority:** Must
- **Constraint:** Store up to 10,000 links without significant memory pressure

### NFR3: Code Quality
- **ID:** NFR3
- **Description:** TypeScript strict mode enabled
- **Priority:** Must
- **Metric:** No TypeScript errors, ESLint clean

### NFR4: Test Coverage
- **ID:** NFR4
- **Description:** Minimum 80% code coverage
- **Priority:** Should
- **Metric:** Line coverage >= 80%

### NFR5: API Documentation
- **ID:** NFR5
- **Description:** OpenAPI/Swagger documentation
- **Priority:** Should
- **Format:** OpenAPI 3.0 specification

### NFR6: Error Response Consistency
- **ID:** NFR6
- **Description:** Consistent error response format across all endpoints
- **Priority:** Must
- **Format:** { error: { code, message, details? } }

### NFR7: Security
- **ID:** NFR7
- **Description:** Prevent open redirect vulnerabilities
- **Priority:** Must
- **Control:** Validate URL scheme (http/https only)

### NFR8: Scalability
- **ID:** NFR8
- **Description:** Design allows future migration to persistent storage
- **Priority:** Could
- **Control:** Abstract storage layer interface

### NFR9: Observability
- **ID:** NFR9
- **Description:** Structured logging for production monitoring
- **Priority:** Should
- **Format:** JSON logs with correlation IDs

## Edge Cases

### EC1: Empty or Malformed URL
- **Description:** User submits empty string or malformed URL
- **Handling:** Return 400 with specific validation error
- **Test Case:** url: "", url: "not-a-url", url: "ftp://example.com"

### EC2: Very Long URL
- **Description:** User submits URL exceeding typical length limits
- **Handling:** Accept any valid URL (no artificial length limit unless specified)
- **Consideration:** May impact memory usage with many long URLs

### EC3: Custom Alias Collision
- **Description:** User submits custom alias that already exists
- **Handling:** Return 409 Conflict with message indicating duplicate
- **Test Case:** Create same customAlias twice

### EC4: Custom Alias Validation Edge Cases
- **Description:** Custom alias with invalid characters or length
- **Handling:** Return 400 with validation error
- **Test Cases:** alias: "ab" (too short), alias: "abc123!@#" (special chars), alias: "a".repeat(21) (too long)

### EC5: Non-Existent Code Access
- **Description:** User tries to access/delete non-existent short code
- **Handling:** Return 404 Not Found
- **Test Case:** GET /xyz123 where xyz123 doesn't exist

### EC6: Case Sensitivity
- **Description:** Short codes may be case-sensitive or insensitive
- **Handling:** Treat short codes as case-sensitive (ABC123 != abc123)
- **Consideration:** Document this behavior clearly

### EC7: Rate Limit Boundary
- **Description:** User makes exactly 100 requests, then 101st request
- **Handling:** 100th request succeeds, 101st returns 429
- **Test Case:** Loop 101 requests, verify 101st is rate limited

### EC8: Rate Limit Window Reset
- **Description:** IP makes 50 requests, waits 16 minutes, makes more requests
- **Handling:** Counter resets after window expires
- **Test Case:** Wait for window expiration, verify requests allowed

### EC9: Delete Then Access
- **Description:** User deletes a link, then tries to access it
- **Handling:** First delete succeeds (200), subsequent access returns 404
- **Test Case:** DELETE /abc123, then GET /abc123

### EC10: Stats on Never-Clicked Link
- **Description:** User requests stats for link that has never been clicked
- **Handling:** Return stats with clicks: 0, lastClickedAt: null
- **Test Case:** Create link, immediately GET /stats/:code

### EC11: Pagination Edge Cases
- **Description:** Page number beyond available data, limit of 0 or negative
- **Handling:** Return empty array for page beyond data, 400 for invalid limit
- **Test Cases:** page: 1000, limit: 0, limit: -1, page: 0

### EC12: Concurrent Code Generation
- **Description:** Two requests generate same random code simultaneously
- **Handling:** Collision detection with retry logic
- **Consideration:** Race condition handling in in-memory store

### EC13: Special Characters in URL
- **Description:** URL contains query params, fragments, unicode
- **Handling:** Accept and store as-is, validate only scheme and format
- **Test Case:** url with ?query=value&foo=bar#fragment

### EC14: Empty Links List
- **Description:** GET /links when no links exist
- **Handling:** Return { links: [], page: 1, limit: 10, total: 0 }

## Assumptions

1. **A1:** The application will run as a single-instance service (no distributed rate limiting needed)
2. **A2:** In-memory storage is acceptable for the intended use case; data persistence is not required
3. **A3:** The short code character set is alphanumeric (a-z, A-Z, 0-9), providing 62^6 = 56.8 billion possible codes
4. **A4:** Custom aliases use the same character set as random codes
5. **A5:** The rate limit applies per client IP address, using X-Forwarded-For header if behind proxy
6. **A6:** Click counting happens on redirect (GET /:code), not on stats retrieval
7. **A7:** The API will be stateless; no session management required
8. **A8:** Node.js version 18+ will be used (LTS version)
9. **A9:** Express.js will be the web framework
10. **A10:** Jest will be used for testing (most common for Node.js/TypeScript)
11. **A11:** The /health endpoint is excluded from rate limiting to allow monitoring even under load
12. **A12:** Response time logging uses wall-clock time from request start to response end
13. **A13:** Error responses will use JSON format with HTTP status codes
14. **A14:** The application will listen on a configurable port (default 3000)
15. **A15:** CORS is not a requirement for this initial version (API-only, same-origin or server-side proxy)
16. **A16:** Short code uniqueness is checked synchronously during creation

## Open Questions

1. **OQ1:** Should custom aliases be case-insensitive (treat "MyLink" and "mylink" as same)?
2. **OQ2:** What is the expected maximum number of shortened links the system should handle?
3. **OQ3:** Should deleted short codes be reusable or permanently reserved?
4. **OQ4:** Is there a need for link expiration/ttl functionality?
5. **OQ5:** Should the API support bulk URL shortening endpoints?
6. **OQ6:** What logging destination is preferred (stdout, file, external service)?
7. **OQ7:** Should rate limiting be configurable per endpoint or global?
8. **OQ8:** Is there a need for authentication/authorization for certain endpoints?
9. **OQ9:** Should the stats endpoint be protected or public?
10. **OQ10:** What is the expected traffic pattern for capacity planning?
11. **OQ11:** Should we support URL preview/metadata extraction (title, description)?
12. **OQ12:** Is there a requirement for analytics beyond click count (geolocation, referrer, user agent)?
13. **OQ13:** Should the API include versioning in the path (e.g., /api/v1/shorten)?
14. **OQ14:** What is the deployment target (Docker, serverless, traditional server)?
15. **OQ15:** Are there compliance requirements (GDPR, data retention policies)?
