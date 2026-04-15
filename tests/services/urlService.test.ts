import { 
  generateRandomCode, 
  createShortUrl, 
  getShortCode, 
  getShortCodeOrThrow,
  incrementClick,
  deleteUrl, 
  deleteUrlOrThrow,
  getAllLinks,
  UrlConflictError,
  UrlValidationError,
  UrlNotFoundError
} from '../../src/services/urlService';
import { storage } from '../../src/storage';
import { URLData } from '../../src/types';

// Mock storage to isolate unit tests
jest.mock('../../src/storage', () => ({
  storage: {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    deleteById: jest.fn(),
    incrementClicks: jest.fn()
  }
}));

describe('urlService', () => {
  const mockStorage = storage as jest.Mocked<typeof storage>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRandomCode', () => {
    it('should generate a 6-character code by default', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      const code = await generateRandomCode();
      
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate a code with specified length', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      const code = await generateRandomCode(8);
      
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate a 4-character code', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      const code = await generateRandomCode(4);
      
      expect(code).toHaveLength(4);
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should retry if generated code already exists', async () => {
      mockStorage.findById
        .mockResolvedValueOnce({ shortCode: 'abc123', originalUrl: 'http://example.com', clicks: 0, createdAt: '2024-01-01T00:00:00.000Z', lastClickedAt: null }) // collision
        .mockResolvedValue(null); // new code
      
      const code = await generateRandomCode();
      
      expect(mockStorage.findById).toHaveBeenCalledTimes(2);
      expect(code).toHaveLength(6);
    });

    it('should throw UrlValidationError after max attempts', async () => {
      mockStorage.findById.mockResolvedValue({ shortCode: 'existing', originalUrl: 'http://example.com', clicks: 0, createdAt: '2024-01-01T00:00:00.000Z', lastClickedAt: null });
      
      await expect(generateRandomCode()).rejects.toThrow(UrlValidationError);
      await expect(generateRandomCode()).rejects.toThrow('Unable to generate unique short code after multiple attempts');
    });
  });

  describe('createShortUrl', () => {
    describe('valid URLs', () => {
      it('should create a shortened URL with random code', async () => {
        mockStorage.findById.mockResolvedValue(null);
        mockStorage.save.mockResolvedValue();
        
        const result = await createShortUrl('https://example.com');
        
        expect(result).toHaveProperty('shortCode');
        expect(result.shortCode).toHaveLength(6);
        expect(result.originalUrl).toBe('https://example.com');
        expect(result.clicks).toBe(0);
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('lastClickedAt', null);
        expect(mockStorage.save).toHaveBeenCalledWith(expect.objectContaining({
          originalUrl: 'https://example.com'
        }));
      });

      it('should create a shortened URL with custom alias', async () => {
        mockStorage.findById.mockResolvedValue(null);
        mockStorage.save.mockResolvedValue();
        
        const result = await createShortUrl('https://example.com', 'mylink');
        
        expect(result.shortCode).toBe('mylink');
        expect(result.originalUrl).toBe('https://example.com');
        expect(mockStorage.save).toHaveBeenCalledWith(expect.objectContaining({
          shortCode: 'mylink'
        }));
      });

      it('should generate timestamp in ISO format', async () => {
        mockStorage.findById.mockResolvedValue(null);
        mockStorage.save.mockResolvedValue();
        
        const result = await createShortUrl('https://example.com');
        
        expect(() => new Date(result.createdAt)).not.toThrow();
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    describe('invalid URLs', () => {
      it('should throw UrlValidationError for invalid URL format', async () => {
        await expect(createShortUrl('not-a-url')).rejects.toThrow(UrlValidationError);
        await expect(createShortUrl('not-a-url')).rejects.toThrow('Invalid URL format');
        expect(mockStorage.save).not.toHaveBeenCalled();
      });

      it('should throw UrlValidationError for empty URL', async () => {
        await expect(createShortUrl('')).rejects.toThrow(UrlValidationError);
      });

      it('should throw UrlValidationError for ftp URL', async () => {
        await expect(createShortUrl('ftp://example.com')).rejects.toThrow(UrlValidationError);
      });
    });

    describe('custom alias validation', () => {
      it('should throw UrlValidationError for alias too short', async () => {
        await expect(createShortUrl('https://example.com', 'ab')).rejects.toThrow(UrlValidationError);
        await expect(createShortUrl('https://example.com', 'ab')).rejects.toThrow('Invalid custom alias');
      });

      it('should throw UrlValidationError for alias too long', async () => {
        await expect(createShortUrl('https://example.com', 'a'.repeat(21))).rejects.toThrow(UrlValidationError);
      });

      it('should throw UrlValidationError for alias with special characters', async () => {
        await expect(createShortUrl('https://example.com', 'my-link')).rejects.toThrow(UrlValidationError);
      });

      it('should throw UrlValidationError for alias with spaces', async () => {
        await expect(createShortUrl('https://example.com', 'my link')).rejects.toThrow(UrlValidationError);
      });
    });

    describe('alias collision detection', () => {
      it('should throw UrlConflictError for duplicate custom alias', async () => {
        mockStorage.findById.mockResolvedValue({ 
          shortCode: 'mylink', 
          originalUrl: 'https://other.com', 
          clicks: 5, 
          createdAt: '2024-01-01T00:00:00.000Z', 
          lastClickedAt: '2024-01-02T00:00:00.000Z' 
        });
        
        await expect(createShortUrl('https://example.com', 'mylink'))
          .rejects.toThrow(UrlConflictError);
        await expect(createShortUrl('https://example.com', 'mylink'))
          .rejects.toThrow("Custom alias 'mylink' is already taken");
        expect(mockStorage.save).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle URL with query parameters', async () => {
        mockStorage.findById.mockResolvedValue(null);
        mockStorage.save.mockResolvedValue();
        
        const result = await createShortUrl('https://example.com?foo=bar&baz=qux');
        
        expect(result.originalUrl).toBe('https://example.com?foo=bar&baz=qux');
      });

      it('should handle URL with path', async () => {
        mockStorage.findById.mockResolvedValue(null);
        mockStorage.save.mockResolvedValue();
        
        const result = await createShortUrl('https://example.com/path/to/resource');
        
        expect(result.originalUrl).toBe('https://example.com/path/to/resource');
      });
    });
  });

  describe('getShortCode', () => {
    it('should return URL data for existing code', async () => {
      const mockUrlData: URLData = {
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        clicks: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: '2024-01-02T00:00:00.000Z'
      };
      mockStorage.findById.mockResolvedValue(mockUrlData);
      
      const result = await getShortCode('abc123');
      
      expect(result).toEqual(mockUrlData);
      expect(mockStorage.findById).toHaveBeenCalledWith('abc123');
    });

    it('should return null for non-existent code', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      const result = await getShortCode('nonexistent');
      
      expect(result).toBeNull();
      expect(mockStorage.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle empty code', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      const result = await getShortCode('');
      
      expect(result).toBeNull();
    });
  });

  describe('getShortCodeOrThrow', () => {
    it('should return URL data for existing code', async () => {
      const mockUrlData: URLData = {
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        clicks: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: '2024-01-02T00:00:00.000Z'
      };
      mockStorage.findById.mockResolvedValue(mockUrlData);
      
      const result = await getShortCodeOrThrow('abc123');
      
      expect(result).toEqual(mockUrlData);
    });

    it('should throw UrlNotFoundError for non-existent code', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      await expect(getShortCodeOrThrow('nonexistent'))
        .rejects.toThrow(UrlNotFoundError);
      await expect(getShortCodeOrThrow('nonexistent'))
        .rejects.toThrow("Short code 'nonexistent' not found");
    });
  });

  describe('incrementClick', () => {
    it('should increment click count for existing code', async () => {
      mockStorage.findById.mockResolvedValue({ 
        shortCode: 'abc123', 
        originalUrl: 'https://example.com', 
        clicks: 5, 
        createdAt: '2024-01-01T00:00:00.000Z', 
        lastClickedAt: null 
      });
      mockStorage.incrementClicks.mockResolvedValue();
      
      await expect(incrementClick('abc123')).resolves.not.toThrow();
      expect(mockStorage.incrementClicks).toHaveBeenCalledWith('abc123');
    });

    it('should throw UrlNotFoundError for non-existent code', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      await expect(incrementClick('nonexistent'))
        .rejects.toThrow(UrlNotFoundError);
      await expect(incrementClick('nonexistent'))
        .rejects.toThrow("Short code 'nonexistent' not found");
      expect(mockStorage.incrementClicks).not.toHaveBeenCalled();
    });
  });

  describe('deleteUrl', () => {
    it('should return true when URL is deleted', async () => {
      mockStorage.deleteById.mockResolvedValue(true);
      
      const result = await deleteUrl('abc123');
      
      expect(result).toBe(true);
      expect(mockStorage.deleteById).toHaveBeenCalledWith('abc123');
    });

    it('should return false when URL does not exist', async () => {
      mockStorage.deleteById.mockResolvedValue(false);
      
      const result = await deleteUrl('nonexistent');
      
      expect(result).toBe(false);
      expect(mockStorage.deleteById).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('deleteUrlOrThrow', () => {
    it('should delete URL when it exists', async () => {
      mockStorage.findById.mockResolvedValue({ 
        shortCode: 'abc123', 
        originalUrl: 'https://example.com', 
        clicks: 5, 
        createdAt: '2024-01-01T00:00:00.000Z', 
        lastClickedAt: null 
      });
      mockStorage.deleteById.mockResolvedValue(true);
      
      await expect(deleteUrlOrThrow('abc123')).resolves.not.toThrow();
      expect(mockStorage.deleteById).toHaveBeenCalledWith('abc123');
    });

    it('should throw UrlNotFoundError when URL does not exist', async () => {
      mockStorage.findById.mockResolvedValue(null);
      
      await expect(deleteUrlOrThrow('nonexistent'))
        .rejects.toThrow(UrlNotFoundError);
      await expect(deleteUrlOrThrow('nonexistent'))
        .rejects.toThrow("Short code 'nonexistent' not found");
      expect(mockStorage.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('getAllLinks', () => {
    it('should return paginated results with default params', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
      mockStorage.findAll.mockResolvedValue(mockResult);
      
      const result = await getAllLinks();
      
      expect(result).toEqual(mockResult);
      expect(mockStorage.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should return paginated results with custom params', async () => {
      const mockResult = {
        data: [{ shortCode: 'abc123', originalUrl: 'https://example.com', clicks: 5, createdAt: '2024-01-01T00:00:00.000Z', lastClickedAt: null }],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1
      };
      mockStorage.findAll.mockResolvedValue(mockResult);
      
      const result = await getAllLinks(2, 5);
      
      expect(result).toEqual(mockResult);
      expect(mockStorage.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should normalize negative page to 1', async () => {
      mockStorage.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      
      // @ts-expect-error Testing invalid input
      await getAllLinks(-1, 10);
      
      expect(mockStorage.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should normalize limit over 100 to 10', async () => {
      mockStorage.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      
      // @ts-expect-error Testing invalid input
      await getAllLinks(1, 101);
      
      expect(mockStorage.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle zero page', async () => {
      mockStorage.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      
      // @ts-expect-error Testing invalid input
      await getAllLinks(0, 10);
      
      expect(mockStorage.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle zero limit', async () => {
      mockStorage.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      
      // @ts-expect-error Testing invalid input
      await getAllLinks(1, 0);
      
      expect(mockStorage.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle empty result set', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
      mockStorage.findAll.mockResolvedValue(mockResult);
      
      const result = await getAllLinks(1, 10);
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle large result set', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        shortCode: `code${i}`,
        originalUrl: `https://example${i}.com`,
        clicks: i,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastClickedAt: null
      }));
      
      const mockResult = {
        data: mockData.slice(0, 10),
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      };
      mockStorage.findAll.mockResolvedValue(mockResult);
      
      const result = await getAllLinks(1, 10);
      
      expect(result.data).toHaveLength(10);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
    });
  });

  describe('error classes', () => {
    it('UrlConflictError should have correct name', () => {
      const error = new UrlConflictError('test conflict');
      expect(error.name).toBe('UrlConflictError');
    });

    it('UrlValidationError should have correct name', () => {
      const error = new UrlValidationError('test validation');
      expect(error.name).toBe('UrlValidationError');
    });

    it('UrlNotFoundError should have correct name', () => {
      const error = new UrlNotFoundError('test not found');
      expect(error.name).toBe('UrlNotFoundError');
    });

    it('UrlConflictError should preserve message', () => {
      const error = new UrlConflictError('Custom alias already taken');
      expect(error.message).toBe('Custom alias already taken');
    });

    it('UrlValidationError should preserve message', () => {
      const error = new UrlValidationError('Invalid URL format');
      expect(error.message).toBe('Invalid URL format');
    });

    it('UrlNotFoundError should preserve message', () => {
      const error = new UrlNotFoundError('Code not found');
      expect(error.message).toBe('Code not found');
    });
  });
});
