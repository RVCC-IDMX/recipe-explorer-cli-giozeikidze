/**
 * Utility functions for the recipe explorer application
 */

/**
 * Format a recipe for display in the console
 *
 * @param {Object} recipe - Recipe object
 * @returns {string} - Formatted recipe string
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim | MDN: String.trim}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals | MDN: Template literals}
 */
export function formatRecipe(recipe) {
  if (!recipe) {
    return 'Recipe not found';
  }

  // Extract ingredients and measures
  const ingredients = [];
  for (let i = 1; i <= 20; i++) { // Consider explaining why this loop runs up to 20
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];

    if (ingredient && ingredient.trim() !== '') {
      ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`);
    }
  }

  // Build formatted string
  let result = '\n';
  result += `=== ${recipe.strMeal} ===\n`;
  result += `Category: ${recipe.strCategory || 'N/A'}\n`;
  result += `Area: ${recipe.strArea || 'N/A'}\n`;
  result += '\nIngredients:\n';

  for (const ingredient of ingredients) {
    result += `- ${ingredient}\n`;
  }

  result += '\nInstructions:\n';
  result += `${recipe.strInstructions}\n`;

  if (recipe.strYoutube) {
    result += `\nVideo Tutorial: ${recipe.strYoutube}\n`;
  }

  return result;
}

/**
 * Format a list of recipes for display
 *
 * @param {Array<Object>} recipes - Array of recipe objects
 * @returns {string} - Formatted recipe list
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach | MDN: Array.forEach}
 */
export function formatRecipeList(recipes) {
  if (!recipes || recipes.length === 0) {
    return 'No recipes found';
  }

  let result = '\n';
  result += '=== Recipe List ===\n';

  recipes.forEach((recipe, index) => {
    result += `${index + 1}. ${recipe.strMeal} (ID: ${recipe.idMeal})\n`;
  });

  return result;
}

/**
 * Run tasks with a concurrency limit
 * Useful for API calls with rate limits
 *
 * @param {Array<Function>} tasks - Array of functions that return promises
 * @param {number} concurrency - Maximum number of tasks to run concurrently
 * @returns {Promise<Array>} - Results in the same order as tasks
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise | MDN: Promise}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all | MDN: Promise.all}
 */
export async function runWithConcurrency(tasks, concurrency = 3) {
  const results = new Array(tasks.length);
  let currentIndex = 0;

  // Function to run a task by index
  async function runTask(index) {
    try {
      results[index] = await tasks[index]();
    } catch (error) {
      console.error(`Error in task ${index}:`, error.message); // Consider adding more context to this error message
      results[index] = null;
    }

    // If there are more tasks, start the next one
    if (currentIndex < tasks.length) {
      return runTask(currentIndex++);
    }
  }

  // Start initial batch of tasks
  const initialBatch = Math.min(concurrency, tasks.length);
  const initialPromises = [];

  for (let i = 0; i < initialBatch; i++) {
    initialPromises.push(runTask(currentIndex++));
  }

  // Wait for all tasks to complete
  await Promise.all(initialPromises);

  return results;
}

/**
 * Execute a function with a timeout
 *
 * @param {Function} fn - Function that returns a promise
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {any} fallbackValue - Value to return if timeout occurs
 * @returns {Promise<any>} - Function result or fallback value
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race | MDN: Promise.race}
 */
export async function withTimeout(fn, timeoutMs, fallbackValue) {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  }); // Consider explaining why a timeout is necessary

  try {
    // Race the function against the timeout
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    console.error('Operation timed out:', error.message);
    return fallbackValue;
  }
}

/**
 * Try multiple strategies in sequence until one succeeds
 *
 * @param {Array<Function>} strategies - Functions that return promises
 * @returns {Promise<any>} - Result from the first successful strategy
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | MDN: try...catch}
 */
export async function tryStrategies(strategies) {
  const errors = [];

  for (let i = 0; i < strategies.length; i++) {
    try {
      return await strategies[i]();
    } catch (error) {
      errors.push(error);
    }
  }

  // If all strategies failed, throw a combined error
  throw new Error(`All strategies failed: ${errors.map(e => e.message).join(', ')}`); // Consider logging individual errors before throwing the final error
}

export default {
  formatRecipe,
  formatRecipeList,
  runWithConcurrency,
  withTimeout,
  tryStrategies
};
