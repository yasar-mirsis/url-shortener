import request from 'supertest';
import app from '../../src/index';
import { storage } from '../../src/storage';
import { URLData } from '../../src/types';

// Test port for integration tests
const TEST_PORT = 3457;
let testServer: ReturnType<typeof app.listen>;

beforeAll(async () => {
  testServer = app.listen(TEST_PORT);
});

afterAll(async () => {
  // Clean up storage
  const allKeys = Array.from((storage as any).urlStore.keys());
  for (const key of allKeys) {
    (storage as any).urlStore.delete(key);
  }

  // Close the test server
  if (testServer) {
    await new Promise((resolve) => {
      testServer.close(resolve);
    });
  }
});

// Clear storage before each test to ensure isolation
beforeEach(async () => {
  const allKeys = Array.from((storage as any).urlStore.keys());
  for (const key of allKeys) {
    (storage as any).urlStore.delete(key);
  }
});

// Helper function to create a test URL
const createTestUrl = async (url: string, customAlias?: string): Promise<URLData> => {
  const response = await request(app)
    .post('/api/shorten')
    .send({ url, customAlias })
    .expect(201);
  return response.body;
};

describe('Integration Tests - API Endpoints', () => {
  describe('POST /api/shorten', () => {
    describe('valid URLs', () => {
      it('should create a shortened URL with random 6-character code', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com' })
          .expect(201);

        expect(response.body).toHaveProperty('shortCode');
        expect(response.body.shortCode).toHaveLength(6);
        expect(response.body.shortCode).toMatch(/^[a-zA-Z0-9]+$/);
        expect(response.body).toHaveProperty('originalUrl', 'https://example.com');
        expect(response.body).toHaveProperty('createdAt');
        expect(() => new Date(response.body.createdAt)).not.toThrow();
      });

      it('should create a shortened URL with custom alias', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'mylink' })
          .expect(201);

        expect(response.body.shortCode).toBe('mylink');
        expect(response.body.originalUrl).toBe('https://example.com');
        expect(response.body).toHaveProperty('createdAt');
      });

      it('should handle URLs with query parameters', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com/path?foo=bar&baz=qux' })
          .expect(201);

        expect(response.body.originalUrl).toBe('https://example.com/path?foo=bar&baz=qux');
      });

      it('should handle URLs with fragments', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com/page#section' })
          .expect(201);

        expect(response.body.originalUrl).toBe('https://example.com/page#section');
      });

      it('should create with http protocol', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'http://example.com' })
          .expect(201);

        expect(response.body.originalUrl).toBe('http://example.com');
      });
    });

    describe('invalid URLs', () => {
      it('should return 400 for missing URL', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('URL is required');
      });

      it('should return 400 for empty URL', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: '' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid URL');
      });

      it('should return 400 for invalid URL format without protocol', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'example.com' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid URL');
      });

      it('should return 400 for ftp protocol', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'ftp://example.com' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid URL');
      });

      it('should return 400 for malformed URL', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'not-a-valid-url' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid URL');
      });
    });

    describe('custom alias validation', () => {
      it('should return 400 for alias too short (less than 3 chars)', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'ab' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid custom alias');
      });

      it('should return 400 for alias too long (more than 20 chars)', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'a'.repeat(21) })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid custom alias');
      });

      it('should return 400 for alias with special characters', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'my-link' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid custom alias');
      });

      it('should return 400 for alias with spaces', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'my link' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid custom alias');
      });

      it('should return 400 for alias with special symbols', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'my_link!' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Invalid custom alias');
      });
    });

    describe('duplicate alias handling', () => {
      it('should return 409 for duplicate custom alias', async () => {
        // First request - should succeed
        await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com', customAlias: 'duplicate' })
          .expect(201);

        // Second request with same alias - should fail
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://other.com', customAlias: 'duplicate' })
          .expect(409);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('already taken');
      });
    });

    describe('edge cases', () => {
      it('should handle very long URL', async () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(500);
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: longUrl })
          .expect(201);

        expect(response.body.originalUrl).toBe(longUrl);
      });

      it('should handle unicode in URL', async () => {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url: 'https://example.com/路径' })
          .expect(201);

        expect(response.body).toHaveProperty('shortCode');
      });

      it('should generate unique codes (no collisions)', async () => {
        const responses = await Promise.all([
          request(app).post('/api/shorten').send({ url: 'https://example1.com' }),
          request(app).post('/api/shorten').send({ url: 'https://example2.com' }),
          request(app).post('/api/shorten').send({ url: 'https://example3.com' }),
        ]);

        const codes = responses.map(r => r.body.shortCode);
        const uniqueCodes = new Set(codes);
        
        expect(uniqueCodes.size).toBe(3); // All codes should be unique
      });
    });
  });

  describe('GET /api/:code (redirect)', () => {
    beforeEach(async () => {
      await createTestUrl('https://example.com/target', 'testcode');
    });

    describe('valid short codes', () => {
      it('should return 302 redirect to original URL', async () => {
        const response = await request(app)
          .get('/api/testcode')
          .expect(302);

        expect(response.headers.location).toBe('https://example.com/target');
      });

      it('should increment click count on redirect', async () => {
        // First redirect
        await request(app).get('/api/testcode').expect(302);
        
        // Check stats
        const stats = await request(app)
          .get('/api/stats/testcode')
          .expect(200);

        expect(stats.body.clicks).toBe(1);

        // Second redirect
        await request(app).get('/api/testcode').expect(302);

        // Check stats again
        const stats2 = await request(app)
          .get('/api/stats/testcode')
          .expect(200);

        expect(stats2.body.clicks).toBe(2);
      });

      it('should update lastClickedAt on redirect', async () => {
        const beforeStats = await request(app)
          .get('/api/stats/testcode')
          .expect(200);

        const beforeTime = new Date(beforeStats.body.lastClickedAt || '2000-01-01').getTime();

        // Perform redirect
        await request(app).get('/api/testcode').expect(302);

        const afterStats = await request(app)
          .get('/api/stats/testcode')
          .expect(200);

        const afterTime = new Date(afterStats.body.lastClickedAt).getTime();
        expect(afterTime).toBeGreaterThan(beforeTime);
      });
    });

    describe('invalid short codes', () => {
      it('should return 404 for non-existent code', async () => {
        const response = await request(app)
          .get('/api/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 404 for empty code', async () => {
        const response = await request(app)
          .get('/api/')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 404 for code with special characters', async () => {
        const response = await request(app)
          .get('/api/invalid@code')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('GET /api/stats/:code', () => {
    beforeEach(async () => {
      await createTestUrl('https://example.com/stats-test', 'statscode');
    });

    describe('valid short codes', () => {
      it('should return statistics for existing code', async () => {
        const response = await request(app)
          .get('/api/stats/statscode')
          .expect(200);

        expect(response.body).toHaveProperty('originalUrl', 'https://example.com/stats-test');
        expect(response.body).toHaveProperty('shortCode', 'statscode');
        expect(response.body).toHaveProperty('clicks', 0);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('lastClickedAt', null);
      });

      it('should show updated click count after redirects', async () => {
        // Perform 3 redirects
        await request(app).get('/api/statscode').expect(302);
        await request(app).get('/api/statscode').expect(302);
        await request(app).get('/api/statscode').expect(302);

        const response = await request(app)
          .get('/api/stats/statscode')
          .expect(200);

        expect(response.body.clicks).toBe(3);
      });

      it('should update lastClickedAt after redirects', async () => {
        const before = await request(app)
          .get('/api/stats/statscode')
          .expect(200);

        await request(app).get('/api/statscode').expect(302);

        const after = await request(app)
          .get('/api/stats/statscode')
          .expect(200);

        expect(after.body.lastClickedAt).not.toBeNull();
        expect(new Date(after.body.lastClickedAt).getTime())
          .toBeGreaterThan(new Date(before.body.createdAt).getTime());
      });
    });

    describe('invalid short codes', () => {
      it('should return 404 for non-existent code', async () => {
        const response = await request(app)
          .get('/api/stats/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('not found');
      });

      it('should return 404 for empty code', async () => {
        const response = await request(app)
          .get('/api/stats/')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('GET /api/links (pagination)', () => {
    beforeEach(async () => {
      // Create multiple test URLs
      await createTestUrl('https://example.com/1', 'link1');
      await createTestUrl('https://example.com/2', 'link2');
      await createTestUrl('https://example.com/3', 'link3');
      await createTestUrl('https://example.com/4', 'link4');
      await createTestUrl('https://example.com/5', 'link5');
    });

    it('should return paginated list with default params', async () => {
      const response = await request(app)
        .get('/api/links')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should respect custom page and limit', async () => {
      const response = await request(app)
        .get('/api/links?page=2&limit=2')
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should calculate correct totalPages', async () => {
      const response = await request(app)
        .get('/api/links?limit=2')
        .expect(200);

      expect(response.body.totalPages).toBe(Math.ceil(response.body.total / 2));
    });

    it('should handle page 0 (normalize to 1)', async () => {
      const response = await request(app)
        .get('/api/links?page=0')
        .expect(200);

      expect(response.body.page).toBe(1);
    });

    it('should handle negative page (normalize to 1)', async () => {
      const response = await request(app)
        .get('/api/links?page=-5')
        .expect(200);

      expect(response.body.page).toBe(1);
    });

    it('should handle limit over 100 (normalize to 10)', async () => {
      const response = await request(app)
        .get('/api/links?limit=200')
        .expect(200);

      expect(response.body.limit).toBe(10);
    });

    it('should handle limit 0 (normalize to 10)', async () => {
      const response = await request(app)
        .get('/api/links?limit=0')
        .expect(200);

      expect(response.body.limit).toBe(10);
    });

    it('should return empty data for page beyond total', async () => {
      const response = await request(app)
        .get('/api/links?page=100')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should include full URL data in response', async () => {
      const response = await request(app)
        .get('/api/links?limit=1')
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('shortCode');
      expect(response.body.data[0]).toHaveProperty('originalUrl');
      expect(response.body.data[0]).toHaveProperty('clicks');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('lastClickedAt');
    });
  });

  describe('DELETE /api/:code', () => {
    beforeEach(async () => {
      await createTestUrl('https://example.com/to-delete', 'todelete');
    });

    describe('valid short codes', () => {
      it('should delete existing URL and return success', async () => {
        const response = await request(app)
          .delete('/api/todelete')
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should make deleted code return 404 on redirect', async () => {
        await request(app).delete('/api/todelete').expect(200);

        const response = await request(app)
          .get('/api/todelete')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should make deleted code return 404 on stats', async () => {
        await request(app).delete('/api/todelete').expect(200);

        const response = await request(app)
          .get('/api/stats/todelete')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should make deleted code not appear in links list', async () => {
        const beforeDelete = await request(app)
          .get('/api/links')
          .expect(200);

        await request(app).delete('/api/todelete').expect(200);

        const afterDelete = await request(app)
          .get('/api/links')
          .expect(200);

        expect(afterDelete.body.total).toBeLessThan(beforeDelete.body.total);
      });
    });

    describe('invalid short codes', () => {
      it('should return 404 for non-existent code', async () => {
        const response = await request(app)
          .delete('/api/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('not found');
      });

      it('should return 404 for empty code', async () => {
        const response = await request(app)
          .delete('/api/')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should not be rate limited', async () => {
      // Make multiple requests quickly
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health').expect(200)
      );

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.body.status).toBe('ok');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to POST /api/shorten', async () => {
      // Make many requests to trigger rate limit
      const responses = await Promise.all(
        Array.from({ length: 55 }, () =>
          request(app).post('/api/shorten').send({ url: 'https://example.com' })
        )
      );

      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should apply rate limiting to GET endpoints', async () => {
      // First create a URL
      await createTestUrl('https://example.com/ratelimit', 'ratelimit');

      // Make many requests
      const responses = await Promise.all(
        Array.from({ length: 105 }, () =>
          request(app).get('/api/stats/ratelimit')
        )
      );

      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON body', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/undefined-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for undefined POST route', async () => {
      const response = await request(app)
        .post('/api/undefined-post')
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-sensitive codes', async () => {
      await createTestUrl('https://example.com/lower', 'abc');
      await createTestUrl('https://example.com/upper', 'ABC');

      const lowerStats = await request(app)
        .get('/api/stats/abc')
        .expect(200);

      const upperStats = await request(app)
        .get('/api/stats/ABC')
        .expect(200);

      expect(lowerStats.body.originalUrl).toBe('https://example.com/lower');
      expect(upperStats.body.originalUrl).toBe('https://example.com/upper');
    });

    it('should handle codes with numbers', async () => {
      await createTestUrl('https://example.com', 'abc123');

      const response = await request(app)
        .get('/api/abc123')
        .expect(302);

      expect(response.headers.location).toBe('https://example.com');
    });

    it('should handle maximum length custom alias (20 chars)', async () => {
      const longAlias = 'a'.repeat(20);
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com', customAlias: longAlias })
        .expect(201);

      expect(response.body.shortCode).toBe(longAlias);
    });

    it('should handle minimum length custom alias (3 chars)', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com', customAlias: 'abc' })
        .expect(201);

      expect(response.body.shortCode).toBe('abc');
    });
  });
});
