/**
 * OpenAPI 3.0 Specification for URL Shortener API
 * 
 * This file contains the OpenAPI (Swagger) specification that can be used
 * to generate API documentation, client SDKs, and for API testing.
 * 
 * To view the documentation, you can:
 * 1. Use Swagger UI: https://editor.swagger.io/ and paste this spec
 * 2. Use Redoc: https://redocly.github.io/redoc/
 * 3. Install @apidevtools/swagger-parser to validate programmatically
 * 
 * Note: This spec is exported as a plain JavaScript object for easy consumption
 * without requiring additional type dependencies.
 */

/**
 * OpenAPI 3.0 Specification document
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'URL Shortener API',
    description: `
A lightweight RESTful API service for URL shortening, redirection, and analytics.

## Features
- Generate shortened URLs with random or custom codes
- Fast HTTP 302 redirects to original URLs
- Click analytics and link statistics
- Paginated link listing
- Link management (delete)
- Rate limiting for API protection
- CORS support for cross-origin requests
    `,
    version: '1.0.0',
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.urlshortener.com',
      description: 'Production server'
    }
  ],
  paths: {
    '/api/shorten': {
      post: {
        summary: 'Create a shortened URL',
        description: 'Creates a new shortened URL with either a randomly generated 6-character code or a custom alias.',
        operationId: 'createShortUrl',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://example.com/very/long/url',
                    description: 'The original URL to shorten (must start with http:// or https://)'
                  },
                  customAlias: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20,
                    pattern: '^[a-zA-Z0-9]+$',
                    example: 'mylink',
                    description: 'Optional custom alias (3-20 alphanumeric characters)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'URL successfully shortened',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLResponse'
                },
                example: {
                  shortCode: 'abc123',
                  originalUrl: 'https://example.com/very/long/url',
                  createdAt: '2024-01-15T10:30:00.000Z'
                }
              }
            }
          },
          '400': {
            description: 'Bad Request - Invalid URL format or custom alias',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Invalid URL format. URL must start with http:// or https://'
                }
              }
            }
          },
          '409': {
            description: 'Conflict - Custom alias already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: "Custom alias 'mylink' is already taken"
                }
              }
            }
          },
          '429': {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Too many requests, please try again later.'
                }
              }
            }
          }
        },
        tags: ['URL Management']
      }
    },
    '/api/{code}': {
      get: {
        summary: 'Redirect to original URL',
        description: 'Redirects to the original URL and increments the click counter.',
        operationId: 'redirect',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'The short code or custom alias'
          }
        ],
        responses: {
          '302': {
            description: 'Redirect to original URL',
            headers: {
              Location: {
                schema: {
                  type: 'string',
                  format: 'uri'
                },
                description: 'The original URL to redirect to'
              }
            }
          },
          '404': {
            description: 'Short code not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Short code not found'
                }
              }
            }
          }
        },
        tags: ['Redirect']
      },
      delete: {
        summary: 'Delete a shortened URL',
        description: 'Deletes a shortened URL by its short code.',
        operationId: 'deleteUrl',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'The short code or custom alias to delete'
          }
        ],
        responses: {
          '200': {
            description: 'URL successfully deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: "Short code 'abc123' deleted successfully"
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Short code not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: "Short code 'xyz789' not found"
                }
              }
            }
          },
          '429': {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Too many requests, please try again later.'
                }
              }
            }
          }
        },
        tags: ['URL Management']
      }
    },
    '/api/stats/{code}': {
      get: {
        summary: 'Get link statistics',
        description: 'Retrieves statistics for a specific shortened URL including click count and timestamps.',
        operationId: 'getStats',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'The short code or custom alias'
          }
        ],
        responses: {
          '200': {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/URLStats'
                },
                example: {
                  originalUrl: 'https://example.com/very/long/url',
                  shortCode: 'abc123',
                  clicks: 42,
                  createdAt: '2024-01-15T10:30:00.000Z',
                  lastClickedAt: '2024-01-16T14:22:00.000Z'
                }
              }
            }
          },
          '404': {
            description: 'Short code not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: "Short code 'xyz789' not found"
                }
              }
            }
          },
          '429': {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Too many requests, please try again later.'
                }
              }
            }
          }
        },
        tags: ['Analytics']
      }
    },
    '/api/links': {
      get: {
        summary: 'List all shortened URLs',
        description: 'Retrieves a paginated list of all shortened URLs in the system.',
        operationId: 'getAllLinks',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            description: 'Page number (1-indexed)'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10
            },
            description: 'Number of items per page (max 100)'
          }
        ],
        responses: {
          '200': {
            description: 'List of shortened URLs retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedResult'
                },
                example: {
                  data: [
                    {
                      shortCode: 'abc123',
                      originalUrl: 'https://example.com',
                      clicks: 42,
                      createdAt: '2024-01-15T10:30:00.000Z',
                      lastClickedAt: '2024-01-16T14:22:00.000Z'
                    }
                  ],
                  total: 1,
                  page: 1,
                  limit: 10,
                  totalPages: 1
                }
              }
            }
          },
          '429': {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                example: {
                  error: 'Too many requests, please try again later.'
                }
              }
            }
          }
        },
        tags: ['URL Management']
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Checks if the API is running. Not rate limited.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok'
                    }
                  }
                },
                example: {
                  status: 'ok'
                }
              }
            }
          }
        },
        tags: ['System']
      }
    }
  },
  components: {
    schemas: {
      URLResponse: {
        type: 'object',
        required: ['shortCode', 'originalUrl', 'createdAt'],
        properties: {
          shortCode: {
            type: 'string',
            description: 'The generated short code or custom alias',
            example: 'abc123'
          },
          originalUrl: {
            type: 'string',
            format: 'uri',
            description: 'The original long URL',
            example: 'https://example.com/very/long/url'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp when the URL was created',
            example: '2024-01-15T10:30:00.000Z'
          }
        }
      },
      URLStats: {
        type: 'object',
        required: ['originalUrl', 'shortCode', 'clicks', 'createdAt'],
        properties: {
          originalUrl: {
            type: 'string',
            format: 'uri',
            description: 'The original long URL'
          },
          shortCode: {
            type: 'string',
            description: 'The short code or custom alias'
          },
          clicks: {
            type: 'integer',
            description: 'Total number of redirects',
            minimum: 0
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp when the URL was created'
          },
          lastClickedAt: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'ISO timestamp of the last redirect (null if never clicked)'
          }
        }
      },
      URLData: {
        type: 'object',
        required: ['shortCode', 'originalUrl', 'clicks', 'createdAt', 'lastClickedAt'],
        properties: {
          shortCode: {
            type: 'string',
            description: 'The short code or custom alias'
          },
          originalUrl: {
            type: 'string',
            format: 'uri',
            description: 'The original long URL'
          },
          clicks: {
            type: 'integer',
            description: 'Total number of redirects',
            minimum: 0
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp when the URL was created'
          },
          lastClickedAt: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'ISO timestamp of the last redirect'
          }
        }
      },
      PaginatedResult: {
        type: 'object',
        required: ['data', 'total', 'page', 'limit', 'totalPages'],
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/URLData'
            }
          },
          total: {
            type: 'integer',
            description: 'Total number of URLs in the system',
            minimum: 0
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            minimum: 1
          },
          limit: {
            type: 'integer',
            description: 'Number of items per page',
            minimum: 1,
            maximum: 100
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
            minimum: 1
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message describing what went wrong'
          }
        }
      }
    },
    securitySchemes: {
      // No authentication required for this API
    }
  },
  tags: [
    {
      name: 'URL Management',
      description: 'Endpoints for creating, listing, and deleting shortened URLs'
    },
    {
      name: 'Redirect',
      description: 'Endpoints for redirecting to original URLs'
    },
    {
      name: 'Analytics',
      description: 'Endpoints for retrieving URL statistics and click data'
    },
    {
      name: 'System',
      description: 'System-related endpoints like health checks'
    }
  ]
};

export default openApiSpec;
