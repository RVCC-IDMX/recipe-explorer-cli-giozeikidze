// test/cache.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock fs/promises with both named exports and a default export.
vi.mock('fs/promises', () => {
  const access = vi.fn();
  const readFile = vi.fn();
  const writeFile = vi.fn();
  const mkdir = vi.fn();
  return {
    __esModule: true,
    default: { access, readFile, writeFile, mkdir },
    access,
    readFile,
    writeFile,
    mkdir,
  };
});

import * as cache from '../src/cache.js';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '../data/cache.json');

describe('Cache Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initializeCache', () => {
    it('should create cache file if it does not exist', async () => {
      fs.access.mockRejectedValueOnce(new Error('File not found'));
      fs.mkdir.mockResolvedValueOnce(undefined); // Ensure directory is created
      fs.writeFile.mockResolvedValueOnce();

      await cache.initializeCache();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('cache.json'),
        JSON.stringify({}),
        'utf-8'
      );
    });

    it('should not create cache file if it already exists', async () => {
      fs.access.mockResolvedValueOnce(undefined);
      await cache.initializeCache();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getFromCache', () => {
    it('should return data if it exists and is not expired', async () => {
      const fixedTime = Date.now();
      vi.useFakeTimers().setSystemTime(fixedTime);

      const mockCache = {
        test_key: {
          timestamp: fixedTime,
          value: { id: 1, name: 'Test Data' },
        },
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      const result = await cache.getFromCache('test_key');
      expect(result).toEqual({ id: 1, name: 'Test Data' });

      vi.useRealTimers();
    });

    it('should return null if data is expired', async () => {
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const mockCache = {
        test_key: {
          timestamp: expiredTimestamp,
          value: { id: 1, name: 'Test Data' },
        },
      };

      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      const result = await cache.getFromCache('test_key');
      expect(result).toBeNull();
    }); // <-- Added missing closing parenthesis and semicolon
  }); // <-- Added missing closing curly brace for describe block
}); // <-- Added missing closing curly brace for main describe block
