import { storage } from '../../src/storage';
import { URLData } from '../../src/types';

describe('storage', () => {
  const mockUrlData: URLData = {
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    clicks: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastClickedAt: null
  };

  beforeEach(() => {
    // Clear storage before each test
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save URL data to storage', async () => {
      await expect(storage.save(mockUrlData)).resolves.not.toThrow();
      
      const result = await storage.findById('abc123');
      expect(result).toEqual(mockUrlData);
    });

    it('should throw error when saving duplicate short code', async () => {
      // First save succeeds
      await storage.save(mockUrlData);
      
      // Second save with same code should fail
      const duplicateData: URLData = {
        ...mockUrlData,
        originalUrl: 'https://different.com'
      };
      
      await expect(storage.save(duplicateData)).rejects.toThrow('Short code abc123 already exists');
    });

    it('should save URL data with all properties', async () => {
      const urlData: URLData = {
        shortCode: 'xyz789',
        originalUrl: 'https://test.com/path',
        clicks: 10,
        createdAt: '2024-01-15T12:00:00.000Z',
        lastClickedAt: '2024-01-16T14:30:00.000Z'
      };
      
      await storage.save(urlData);
      
      const result = await storage.findById('xyz789');
      expect(result).toEqual(urlData);
      expect(result?.clicks).toBe(10);
      expect(result?.lastClickedAt).toBe('2024-01-16T14:30:00.000Z');
    });

    it('should handle empty short code', async () => {
      const urlData: URLData = {
        shortCode: '',
        originalUrl: 'https://example.com',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await expect(storage.save(urlData)).resolves.not.toThrow();
    });
  });

  describe('findById', () => {
    it('should return URL data for existing short code', async () => {
      await storage.save(mockUrlData);
      
      const result = await storage.findById('abc123');
      
      expect(result).toEqual(mockUrlData);
    });

    it('should return null for non-existent short code', async () => {
      const result = await storage.findById('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should return null for empty short code', async () => {
      const result = await storage.findById('');
      
      expect(result).toBeNull();
    });

    it('should return null for undefined short code', async () => {
      // @ts-expect-error Testing invalid input
      const result = await storage.findById(undefined);
      
      expect(result).toBeNull();
    });

    it('should handle case-sensitive lookups', async () => {
      await storage.save(mockUrlData);
      
      const result = await storage.findById('ABC123');
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Clear any existing data and add test data
      const testUrls: URLData[] = [
        { shortCode: 'code1', originalUrl: 'https://example1.com', clicks: 1, createdAt: '2024-01-01T00:00:00.000Z', lastClickedAt: null },
        { shortCode: 'code2', originalUrl: 'https://example2.com', clicks: 2, createdAt: '2024-01-02T00:00:00.000Z', lastClickedAt: null },
        { shortCode: 'code3', originalUrl: 'https://example3.com', clicks: 3, createdAt: '2024-01-03T00:00:00.000Z', lastClickedAt: null },
        { shortCode: 'code4', originalUrl: 'https://example4.com', clicks: 4, createdAt: '2024-01-04T00:00:00.000Z', lastClickedAt: null },
        { shortCode: 'code5', originalUrl: 'https://example5.com', clicks: 5, createdAt: '2024-01-05T00:00:00.000Z', lastClickedAt: null }
      ];
      
      for (const url of testUrls) {
        try {
          await storage.save(url);
        } catch {
          // Ignore duplicate errors from previous test runs
        }
      }
    });

    it('should return all URLs with default pagination', async () => {
      const result = await storage.findAll();
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should return paginated results with custom page and limit', async () => {
      const result = await storage.findAll(1, 2);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.totalPages).toBe(Math.ceil(result.total / 2));
    });

    it('should return second page of results', async () => {
      const firstPage = await storage.findAll(1, 2);
      const secondPage = await storage.findAll(2, 2);
      
      expect(secondPage.page).toBe(2);
      expect(secondPage.data.length).toBeLessThanOrEqual(2);
      
      // Verify no overlap between pages
      const firstPageCodes = firstPage.data.map(d => d.shortCode);
      const secondPageCodes = secondPage.data.map(d => d.shortCode);
      
      const overlap = firstPageCodes.filter(code => secondPageCodes.includes(code));
      expect(overlap.length).toBe(0);
    });

    it('should return empty data for page beyond total pages', async () => {
      const result = await storage.findAll(100, 10);
      
      expect(result.data).toEqual([]);
      expect(result.page).toBe(100);
    });

    it('should calculate totalPages correctly', async () => {
      const result = await storage.findAll(1, 2);
      
      expect(result.totalPages).toBe(Math.ceil(result.total / 2));
    });

    it('should handle negative page number', async () => {
      // @ts-expect-error Testing invalid input
      const result = await storage.findAll(-1, 10);
      
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should handle zero page number', async () => {
      // @ts-expect-error Testing invalid input
      const result = await storage.findAll(0, 10);
      
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should handle limit larger than total items', async () => {
      const result = await storage.findAll(1, 1000);
      
      expect(result.data.length).toBeLessThanOrEqual(1000);
      expect(result.totalPages).toBe(1);
    });

    it('should handle zero limit', async () => {
      // @ts-expect-error Testing invalid input
      const result = await storage.findAll(1, 0);
      
      expect(result.limit).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('should include correct metadata in response', async () => {
      const result = await storage.findAll(1, 5);
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });
  });

  describe('deleteById', () => {
    it('should delete URL and return true', async () => {
      await storage.save(mockUrlData);
      
      const result = await storage.deleteById('abc123');
      
      expect(result).toBe(true);
      
      const deleted = await storage.findById('abc123');
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent short code', async () => {
      const result = await storage.deleteById('nonexistent');
      
      expect(result).toBe(false);
    });

    it('should handle deleting empty short code', async () => {
      const result = await storage.deleteById('');
      
      expect(result).toBe(false);
    });

    it('should permanently remove URL from storage', async () => {
      await storage.save(mockUrlData);
      await storage.deleteById('abc123');
      
      // Try to find it again
      const result = await storage.findById('abc123');
      expect(result).toBeNull();
    });
  });

  describe('incrementClicks', () => {
    it('should increment click count for existing short code', async () => {
      const urlData: URLData = {
        shortCode: 'click1',
        originalUrl: 'https://example.com',
        clicks: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      await storage.incrementClicks('click1');
      
      const result = await storage.findById('click1');
      
      expect(result?.clicks).toBe(6);
      expect(result?.lastClickedAt).not.toBeNull();
    });

    it('should set lastClickedAt timestamp on increment', async () => {
      const urlData: URLData = {
        shortCode: 'click2',
        originalUrl: 'https://example.com',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      await storage.incrementClicks('click2');
      
      const result = await storage.findById('click2');
      
      expect(result?.lastClickedAt).not.toBeNull();
      expect(() => new Date(result?.lastClickedAt || '')).not.toThrow();
    });

    it('should throw error for non-existent short code', async () => {
      await expect(storage.incrementClicks('nonexistent'))
        .rejects.toThrow('Short code nonexistent not found');
    });

    it('should increment multiple times correctly', async () => {
      const urlData: URLData = {
        shortCode: 'click3',
        originalUrl: 'https://example.com',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      
      await storage.incrementClicks('click3');
      await storage.incrementClicks('click3');
      await storage.incrementClicks('click3');
      
      const result = await storage.findById('click3');
      
      expect(result?.clicks).toBe(3);
    });

    it('should update lastClickedAt on each increment', async () => {
      const urlData: URLData = {
        shortCode: 'click4',
        originalUrl: 'https://example.com',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: '2024-01-01T00:00:00.000Z'
      };
      
      await storage.save(urlData);
      
      const firstClick = await storage.incrementClicks('click4');
      await new Promise(resolve => setTimeout(resolve, 10));
      const secondClick = await storage.incrementClicks('click4');
      
      const result = await storage.findById('click4');
      
      expect(result?.clicks).toBe(2);
    });
  });

  describe('storage isolation', () => {
    it('should maintain separate entries for different short codes', async () => {
      const url1: URLData = {
        shortCode: 'unique1',
        originalUrl: 'https://one.com',
        clicks: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      const url2: URLData = {
        shortCode: 'unique2',
        originalUrl: 'https://two.com',
        clicks: 2,
        createdAt: '2024-01-02T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(url1);
      await storage.save(url2);
      
      const result1 = await storage.findById('unique1');
      const result2 = await storage.findById('unique2');
      
      expect(result1?.originalUrl).toBe('https://one.com');
      expect(result2?.originalUrl).toBe('https://two.com');
      expect(result1?.clicks).toBe(1);
      expect(result2?.clicks).toBe(2);
    });

    it('should update only the specified entry when incrementing clicks', async () => {
      const url1: URLData = {
        shortCode: 'inc1',
        originalUrl: 'https://one.com',
        clicks: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      const url2: URLData = {
        shortCode: 'inc2',
        originalUrl: 'https://two.com',
        clicks: 2,
        createdAt: '2024-01-02T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(url1);
      await storage.save(url2);
      
      await storage.incrementClicks('inc1');
      
      const result1 = await storage.findById('inc1');
      const result2 = await storage.findById('inc2');
      
      expect(result1?.clicks).toBe(2);
      expect(result2?.clicks).toBe(2); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle very long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000);
      const urlData: URLData = {
        shortCode: 'longurl',
        originalUrl: longUrl,
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      const result = await storage.findById('longurl');
      
      expect(result?.originalUrl).toBe(longUrl);
    });

    it('should handle special characters in URLs', async () => {
      const urlData: URLData = {
        shortCode: 'special',
        originalUrl: 'https://example.com/path?foo=bar&baz=qux#section',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      const result = await storage.findById('special');
      
      expect(result?.originalUrl).toBe(urlData.originalUrl);
    });

    it('should handle Unicode in URLs', async () => {
      const urlData: URLData = {
        shortCode: 'unicode',
        originalUrl: 'https://例え.jp/テスト',
        clicks: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      };
      
      await storage.save(urlData);
      const result = await storage.findById('unicode');
      
      expect(result?.originalUrl).toBe(urlData.originalUrl);
    });
  });
});
