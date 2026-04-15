import { isValidUrl, isValidCustomAlias, validatePagination } from '../../src/utils/validation';

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('should return true for valid http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should return true for URL with path', () => {
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    it('should return true for URL with query parameters', () => {
      expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
    });

    it('should return true for URL with port', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should return true for URL with subdomain', () => {
      expect(isValidUrl('https://www.example.com')).toBe(true);
    });

    it('should return true for URL with special characters in path', () => {
      expect(isValidUrl('https://example.com/path-with_special.chars')).toBe(true);
    });

    it('should return true for URL with IPv4 address', () => {
      expect(isValidUrl('http://192.168.1.1:8080')).toBe(true);
    });

    it('should return true for URL with IPv6 address', () => {
      expect(isValidUrl('http://[::1]:8080')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(isValidUrl('   ')).toBe(false);
    });

    it('should return false for string without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should return false for ftp protocol', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('should return false for file protocol', () => {
      expect(isValidUrl('file:///path/to/file')).toBe(false);
    });

    it('should return false for malformed URL', () => {
      expect(isValidUrl('ht!tp://example.com')).toBe(false);
    });

    it('should return false for null input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidUrl(null)).toBe(false);
    });

    it('should return false for undefined input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidUrl(undefined)).toBe(false);
    });

    it('should return false for number input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidUrl(123)).toBe(false);
    });
  });
});

describe('isValidCustomAlias', () => {
  describe('valid aliases', () => {
    it('should return true for minimum length alias (3 chars)', () => {
      expect(isValidCustomAlias('abc')).toBe(true);
    });

    it('should return true for maximum length alias (20 chars)', () => {
      expect(isValidCustomAlias('abcdefghijklmnopqrst')).toBe(true);
    });

    it('should return true for mixed case alphanumeric', () => {
      expect(isValidCustomAlias('AbC123')).toBe(true);
    });

    it('should return true for all lowercase', () => {
      expect(isValidCustomAlias('mylink')).toBe(true);
    });

    it('should return true for all uppercase', () => {
      expect(isValidCustomAlias('MYLINK')).toBe(true);
    });

    it('should return true for all numbers', () => {
      expect(isValidCustomAlias('123456')).toBe(true);
    });

    it('should return true for alphanumeric mix', () => {
      expect(isValidCustomAlias('abc123xyz')).toBe(true);
    });
  });

  describe('invalid aliases', () => {
    it('should return false for alias too short (2 chars)', () => {
      expect(isValidCustomAlias('ab')).toBe(false);
    });

    it('should return false for alias too long (21 chars)', () => {
      expect(isValidCustomAlias('abcdefghijklmnopqrstu')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidCustomAlias('')).toBe(false);
    });

    it('should return false for alias with special characters', () => {
      expect(isValidCustomAlias('my-link')).toBe(false);
    });

    it('should return false for alias with underscore', () => {
      expect(isValidCustomAlias('my_link')).toBe(false);
    });

    it('should return false for alias with space', () => {
      expect(isValidCustomAlias('my link')).toBe(false);
    });

    it('should return false for alias with dot', () => {
      expect(isValidCustomAlias('my.link')).toBe(false);
    });

    it('should return false for alias with slash', () => {
      expect(isValidCustomAlias('my/link')).toBe(false);
    });

    it('should return false for alias with unicode characters', () => {
      expect(isValidCustomAlias('mülink')).toBe(false);
    });

    it('should return false for null input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidCustomAlias(null)).toBe(false);
    });

    it('should return false for undefined input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidCustomAlias(undefined)).toBe(false);
    });

    it('should return false for number input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidCustomAlias(123)).toBe(false);
    });

    it('should return false for boolean input (type check)', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidCustomAlias(true)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should trim leading and trailing spaces before validation', () => {
      expect(isValidCustomAlias('  abc  ')).toBe(false); // trimmed is 3 chars, but original has spaces
    });

    it('should handle single character alias', () => {
      expect(isValidCustomAlias('a')).toBe(false);
    });

    it('should handle exactly 20 characters', () => {
      expect(isValidCustomAlias('a'.repeat(20))).toBe(true);
    });

    it('should handle exactly 21 characters', () => {
      expect(isValidCustomAlias('a'.repeat(21))).toBe(false);
    });
  });
});

describe('validatePagination', () => {
  describe('valid inputs', () => {
    it('should return default values for undefined inputs', () => {
      expect(validatePagination(undefined, undefined)).toEqual({ page: 1, limit: 10 });
    });

    it('should return default page for invalid page', () => {
      expect(validatePagination(0, 10)).toEqual({ page: 1, limit: 10 });
    });

    it('should return default limit for invalid limit', () => {
      expect(validatePagination(1, 0)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize string inputs to numbers', () => {
      expect(validatePagination('2', '20')).toEqual({ page: 2, limit: 20 });
    });

    it('should return valid inputs as-is', () => {
      expect(validatePagination(5, 50)).toEqual({ page: 5, limit: 50 });
    });

    it('should handle number inputs', () => {
      expect(validatePagination(3, 25)).toEqual({ page: 3, limit: 25 });
    });
  });

  describe('edge cases for page', () => {
    it('should normalize negative page to 1', () => {
      expect(validatePagination(-1, 10)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize zero page to 1', () => {
      expect(validatePagination(0, 10)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize non-numeric page to 1', () => {
      // @ts-expect-error Testing invalid input
      expect(validatePagination('abc', 10)).toEqual({ page: 1, limit: 10 });
    });

    it('should accept large page numbers', () => {
      expect(validatePagination(9999, 10)).toEqual({ page: 9999, limit: 10 });
    });
  });

  describe('edge cases for limit', () => {
    it('should normalize negative limit to 10', () => {
      expect(validatePagination(1, -5)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize zero limit to 10', () => {
      expect(validatePagination(1, 0)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize limit over 100 to 10', () => {
      expect(validatePagination(1, 101)).toEqual({ page: 1, limit: 10 });
    });

    it('should normalize non-numeric limit to 10', () => {
      // @ts-expect-error Testing invalid input
      expect(validatePagination(1, 'xyz')).toEqual({ page: 1, limit: 10 });
    });

    it('should accept maximum limit of 100', () => {
      expect(validatePagination(1, 100)).toEqual({ page: 1, limit: 100 });
    });

    it('should accept minimum valid limit of 1', () => {
      expect(validatePagination(1, 1)).toEqual({ page: 1, limit: 1 });
    });
  });

  describe('mixed valid/invalid inputs', () => {
    it('should use valid page with default limit', () => {
      // @ts-expect-error Testing mixed inputs
      expect(validatePagination(5, 'invalid')).toEqual({ page: 5, limit: 10 });
    });

    it('should use default page with valid limit', () => {
      // @ts-expect-error Testing mixed inputs
      expect(validatePagination('invalid', 25)).toEqual({ page: 1, limit: 25 });
    });
  });
});
