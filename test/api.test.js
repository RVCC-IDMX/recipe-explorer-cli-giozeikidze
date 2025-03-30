// test/api.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../src/api.js';

// Mock global fetch
global.fetch = vi.fn();

describe('API Module', () => {
  // Mock response factory
  function createMockResponse(data, ok = true, status = 200) {
    return {
      ok,
      status,
      json: () => Promise.resolve(data)
    };
  }

  // Reset mocks before each test
  beforeEach(() => {
    fetch.mockReset();
  });

  describe('searchMealsByName', () => {
    it('should return meals when found', async () => {
      const mockMeals = {
        meals: [
          { idMeal: '1', strMeal: 'Test Recipe' },
          { idMeal: '2', strMeal: 'Another Recipe' }
        ]
      };

      fetch.mockResolvedValueOnce(createMockResponse(mockMeals));

      const result = await api.searchMealsByName('test');

      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?s=test');
      expect(result).toEqual(mockMeals.meals);
    });

    it('should return an empty array when no meals are found', async () => {
      const mockResponse = { meals: null };

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.searchMealsByName('nonexistent');

      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/search.php?s=nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({}, false, 500));

      const result = await api.searchMealsByName('test');

      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.searchMealsByName('test');

      expect(result).toEqual([]);
    });
  });

  describe('getMealById', () => {
    it('should return a meal when found', async () => {
      const mockMeal = { meals: [{ idMeal: '123', strMeal: 'Test Recipe' }] };

      fetch.mockResolvedValueOnce(createMockResponse(mockMeal));

      const result = await api.getMealById('123');

      expect(fetch).toHaveBeenCalledWith('https://www.themealdb.com/api/json/v1/1/lookup.php?i=123');
      expect(result).toEqual(mockMeal.meals[0]);
    });

    it('should return null when meal is not found', async () => {
      const mockResponse = { meals: null };

      fetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await api.getMealById('999');

      expect(result).toBeNull();
    });
  });
});
