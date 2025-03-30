// src/cache.js
/**
 * This module provides caching functionality to store API responses locally
 * to reduce API calls and improve performance
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../data/cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Initialize the cache file if it doesn't exist
 */
export async function initializeCache() {
  try {
    await fs.access(CACHE_FILE);
  } catch (error) {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify({}), 'utf-8');
  }
}

/**
 * Get data from cache if it exists and hasn't expired
 */
export async function getFromCache(key) {
  try {
    const data = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    if (data[key] && Date.now() - data[key].timestamp < CACHE_DURATION) {
      return data[key].value;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Save data to cache with a timestamp
 */
export async function saveToCache(key, value) {
  try {
    await initializeCache();
    const data = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    data[key] = { timestamp: Date.now(), value };
    await fs.writeFile(CACHE_FILE, JSON.stringify(data), 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear expired entries from the cache
 */
export async function clearExpiredCache() {
  try {
    await initializeCache();
    const data = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    const now = Date.now();
    let removedCount = 0;

    for (const key in data) {
      if (now - data[key].timestamp >= CACHE_DURATION) {
        delete data[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await fs.writeFile(CACHE_FILE, JSON.stringify(data), 'utf-8');
    }
    return removedCount;
  } catch (error) {
    return 0;
  }
}

/**
 * Get a cached API response or fetch it if not available
 */
export async function getCachedOrFetch(key, fetchFn, forceRefresh = false) {
  try {
    if (!forceRefresh) {
      const cachedData = await getFromCache(key);
      if (cachedData) return cachedData;
    }

    const freshData = await fetchFn();
    await saveToCache(key, freshData);
    return freshData;
  } catch (error) {
    try {
      return await getFromCache(key);
    } catch {
      return null;
    }
  }
}

export default {
  initializeCache,
  getFromCache,
  saveToCache,
  clearExpiredCache,
  getCachedOrFetch
};
