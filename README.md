# url-shortener

## Overview

The URL Shortener is a RESTful API service that provides URL shortening, redirection, and analytics capabilities. The system accepts long URLs and generates compact 6-character short codes, handles redirects with click tracking, and exposes statistics and management endpoints for API consumers.

**Key Capabilities:**
- Generate shortened URLs with random or custom codes
- Fast HTTP 302 redirects to original URLs
- Click analytics and link statistics
- Paginated link listing
- Link management (delete)

**Architecture Style:** Layered REST API with in-memory data store (expandable to persistent storage)

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


---

This project is managed by the SDLC Pipeline. Implementation tasks are tracked as GitHub/GitLab issues.
Each issue is solved by an autonomous agent on its own branch with a pull request.