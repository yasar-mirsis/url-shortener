# AGENTS.md — url-shortener

This file describes the project for AI agents working on implementation issues.

## Project Context

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
- The clicks 

[... truncated for brevity ...]

## Architecture

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
| `clicks` | number | Total redirect co

[... truncated for brevity ...]

## Working Guidelines

- Read this file and README.md before starting any work
- Follow existing code patterns and conventions
- Write clean, production-quality code with proper error handling
- Create or update tests if a testing setup exists
- Do NOT run git commands — the pipeline handles commits and pushes
- Do NOT ask questions — you are running in an automated pipeline