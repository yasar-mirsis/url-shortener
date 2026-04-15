# URL Shortener REST API

A lightweight, TypeScript-based URL shortening service with analytics and link management capabilities.

## Overview

The URL Shortener is a RESTful API service that provides URL shortening, redirection, and analytics capabilities. The system accepts long URLs and generates compact 6-character short codes, handles redirects with click tracking, and exposes statistics and management endpoints for API consumers.

### Key Features

- Generate shortened URLs with random or custom codes
- Fast HTTP 302 redirects to original URLs
- Click analytics and link statistics
- Paginated link listing
- Link management (delete)
- Rate limiting for API protection
- CORS support for cross-origin requests

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript |
| Storage | In-memory (Map) |
| Validation | Built-in regex |
| Testing | Jest |
| Rate Limiting | express-rate-limit |

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd url-shortener
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Run the production server:
```bash
npm start
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port number |

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Create Shortened URL

**POST** `/api/shorten`

Creates a new shortened URL with either a random code or custom alias.

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url",
  "customAlias": "mylink"  // optional
}
```

**Response (201 Created):**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid URL format. URL must start with http:// or https://"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Custom alias 'mylink' is already taken"
}
```

**Custom Alias Validation:**
- Must be 3-20 characters long
- Alphanumeric characters only (a-z, A-Z, 0-9)
- No special characters or spaces

---

#### 2. Redirect to Original URL

**GET** `/api/:code`

Redirects to the original URL. Increments the click counter.

**Response (302 Found):**
- Location header contains the original URL
- Click count is incremented

**Response (404 Not Found):**
```json
{
  "error": "Short code not found"
}
```

**Example:**
```bash
curl -I http://localhost:3000/api/abc123
# Returns: HTTP/1.1 302 Found
# Location: https://example.com/very/long/url
```

---

#### 3. Get Link Statistics

**GET** `/api/stats/:code`

Retrieves statistics for a specific shortened URL.

**Response (200 OK):**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "abc123",
  "clicks": 42,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastClickedAt": "2024-01-16T14:22:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Short code 'xyz789' not found"
}
```

---

#### 4. List All Links

**GET** `/api/links`

Retrieves a paginated list of all shortened URLs.

**Query Parameters:**
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | number | 1 | - | Page number (1-indexed) |
| `limit` | number | 10 | 100 | Items per page |

**Response (200 OK):**
```json
{
  "data": [
    {
      "shortCode": "abc123",
      "originalUrl": "https://example.com",
      "clicks": 42,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastClickedAt": "2024-01-16T14:22:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### 5. Delete Shortened URL

**DELETE** `/api/:code`

Deletes a shortened URL.

**Response (200 OK):**
```json
{
  "message": "Short code 'abc123' deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Short code 'xyz789' not found"
}
```

---

#### 6. Health Check

**GET** `/health`

Checks if the API is running.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

## Rate Limiting

The API implements rate limiting to protect against abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| GET requests | 100 requests | 15 minutes |
| POST requests | 50 requests | 15 minutes |
| DELETE requests | 20 requests | 15 minutes |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created (new shortened URL) |
| 302 | Redirect (to original URL) |
| 400 | Bad Request (invalid input) |
| 404 | Not Found (code doesn't exist) |
| 409 | Conflict (custom alias taken) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

## Usage Examples

### Using cURL

```bash
# Create a shortened URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Create with custom alias
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customAlias": "example"}'

# Redirect (view headers)
curl -I http://localhost:3000/api/example

# Get statistics
curl http://localhost:3000/api/stats/example

# List all links
curl http://localhost:3000/api/links?page=1&limit=10

# Delete a link
curl -X DELETE http://localhost:3000/api/example
```

### Using JavaScript (fetch)

```javascript
// Create shortened URL
async function shortenUrl(url, customAlias = null) {
  const body = { url };
  if (customAlias) body.customAlias = customAlias;

  const response = await fetch('http://localhost:3000/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return response.json();
}

// Get statistics
async function getStats(code) {
  const response = await fetch(`http://localhost:3000/api/stats/${code}`);
  return response.json();
}

// Example usage
const result = await shortenUrl('https://example.com/very/long/url');
console.log(result.shortCode); // 'abc123'

const stats = await getStats(result.shortCode);
console.log(stats.clicks); // 0
```

### Using Python (requests)

```python
import requests

BASE_URL = 'http://localhost:3000/api'

def shorten_url(url, custom_alias=None):
    payload = {'url': url}
    if custom_alias:
        payload['customAlias'] = custom_alias
    
    response = requests.post(f'{BASE_URL}/shorten', json=payload)
    return response.json()

def get_stats(code):
    response = requests.get(f'{BASE_URL}/stats/{code}')
    return response.json()

# Example usage
result = shorten_url('https://example.com/very/long/url')
print(result['shortCode'])  # 'abc123'

stats = get_stats(result['shortCode'])
print(stats['clicks'])  # 0
```

## Project Structure

```
url-shortener/
├── src/
│   ├── handlers/
│   │   └── redirectHandler.ts    # Redirect request handling
│   ├── middleware/
│   │   └── errorHandler.ts       # Error handling middleware
│   ├── routes/
│   │   └── index.ts              # Route definitions
│   ├── services/
│   │   └── urlService.ts         # URL business logic
│   ├── storage/
│   │   └── index.ts              # In-memory storage
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── utils/
│   │   ├── validation.ts         # Input validation utilities
│   │   └── logger.ts             # Request logging
│   ├── index.ts                  # Application entry point
│   └── types.ts                  # Shared type definitions
├── tests/                        # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Data Model

### URLData

| Field | Type | Description |
|-------|------|-------------|
| `shortCode` | string | Unique identifier (6 chars or custom alias) |
| `originalUrl` | string | Original long URL |
| `clicks` | number | Total number of redirects |
| `createdAt` | string | ISO timestamp of creation |
| `lastClickedAt` | string | ISO timestamp of last redirect (nullable) |

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## License

MIT
