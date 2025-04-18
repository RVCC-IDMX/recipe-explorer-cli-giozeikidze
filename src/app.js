import readlineSync from 'readline-sync';
import * as api from './api.js';
import * as cache from './cache.js';
import * as favorites from './favorites.js';
import * as utils from './utils.js';

async function initialize() {
  try {
    await Promise.all([cache.initializeCache(), favorites.initializeFavorites()]);
    await cache.clearExpiredCache();
    return true;
  } catch (error) {
    console.error('Error during initialization:', error);
    return false;
  }
}

async function searchRecipes() {
  const query = readlineSync.question('Enter search term: ');
  if (!query.trim()) {
    console.log('Search term cannot be empty');
    return;
  }
  const cacheKey = `search_${query.toLowerCase()}`;
  try {
    const recipes = await cache.getCachedOrFetch(cacheKey, () => api.searchMealsByName(query));
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found.');
      return;
    }
    console.log(utils.formatRecipeList(recipes));
    const viewDetails = readlineSync.keyInYN('View details for a recipe?');
    if (viewDetails) {
      const index = readlineSync.questionInt('Enter recipe number: ') - 1;
      if (recipes[index]) await viewRecipeDetails(recipes[index].idMeal);
    }
  } catch (error) {
    console.error('Error searching recipes:', error.message);
  }
}

async function viewRecipeDetails(recipeId) {
  if (!recipeId) recipeId = readlineSync.question('Enter recipe ID: ');
  if (!recipeId.trim()) {
    console.log('Recipe ID cannot be empty');
    return;
  }
  const cacheKey = `recipe_${recipeId}`;
  try {
    const recipe = await cache.getCachedOrFetch(cacheKey, () => api.getMealById(recipeId));
    if (!recipe) {
      console.log('Recipe not found.');
      return;
    }
    console.log(utils.formatRecipe(recipe));
    const isFavorite = await favorites.isInFavorites(recipeId);
    const action = isFavorite ? 'Remove from' : 'Add to';
    if (readlineSync.keyInYN(`${action} favorites?`)) {
      isFavorite ? await favorites.removeFavorite(recipeId) : await favorites.addFavorite(recipe);
    }
    api.getRelatedRecipes(recipe).then(related => {
      if (related && related.length > 0) {
        console.log('\nRelated recipes:');
        console.log(utils.formatRecipeList(related));
      }
    }).catch(err => console.error('Error fetching related recipes:', err));
  } catch (error) {
    console.error('Error viewing recipe details:', error.message);
  }
}

async function exploreByFirstLetter() {
  const letters = readlineSync.question('Enter up to 3 letters: ').toLowerCase();
  if (!letters.trim()) {
    console.log('Please enter at least one letter');
    return;
  }
  const uniqueLetters = Array.from(new Set(letters)).slice(0, 3);
  const cacheKey = `letters_${uniqueLetters.sort().join('')}`;
  try {
    const letterPromises = uniqueLetters.map(letter => api.searchMealsByFirstLetter(letter));
    const recipes = await cache.getCachedOrFetch(cacheKey, async () => {
      const results = await Promise.all(letterPromises);
      return results.flat();
    });
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found.');
      return;
    }
    console.log(utils.formatRecipeList(recipes));
    const viewDetails = readlineSync.keyInYN('View details for a recipe?');
    if (viewDetails) {
      const index = readlineSync.questionInt('Enter recipe number: ') - 1;
      if (recipes[index]) await viewRecipeDetails(recipes[index].idMeal);
    }
  } catch (error) {
    console.error('Error exploring recipes:', error.message);
  }
}

async function searchByIngredient() {
  const ingredient = readlineSync.question('Enter an ingredient: ');
  if (!ingredient.trim()) {
    console.log('Ingredient cannot be empty');
    return;
  }
  const cacheKey = `ingredient_${ingredient.toLowerCase()}`;
  try {
    const recipes = await cache.getCachedOrFetch(cacheKey, () => api.getMealsByIngredient(ingredient));
    if (typeof recipes === 'string') {
      console.log(recipes);
      return;
    }
    if (!recipes || recipes.length === 0) {
      console.log('No recipes found.');
      return;
    }
    console.log(utils.formatRecipeList(recipes));
    const viewDetails = readlineSync.keyInYN('View details for a recipe?');
    if (viewDetails) {
      const index = readlineSync.questionInt('Enter recipe number: ') - 1;
      if (recipes[index]) await viewRecipeDetails(recipes[index].idMeal);
    }
  } catch (error) {
    console.error('Error searching by ingredient:', error.message);
  }
}

async function discoverRandom() {
  console.log('Fetching random recipes...');
  try {
    const randomPromises = [api.getRandomMeal(), api.getRandomMeal(), api.getRandomMeal()];
    const recipe = await Promise.race(randomPromises);
    if (!recipe) {
      console.log('No random recipe found.');
      return;
    }
    console.log(utils.formatRecipe(recipe));
    const isFavorite = await favorites.isInFavorites(recipe.idMeal);
    const action = isFavorite ? 'Remove from' : 'Add to';
    if (readlineSync.keyInYN(`${action} favorites?`)) {
      isFavorite ? await favorites.removeFavorite(recipe.idMeal) : await favorites.addFavorite(recipe);
    }
  } catch (error) {
    console.error('Error discovering random recipes:', error.message);
  }
}

async function viewFavorites() {
  try {
    const favoriteRecipes = await favorites.getFavorites();
    if (!favoriteRecipes || favoriteRecipes.length === 0) {
      console.log('You have no favorite recipes.');
      return;
    }
    console.log(utils.formatRecipeList(favoriteRecipes));
    const viewDetails = readlineSync.keyInYN('View details for a recipe?');
    if (viewDetails) {
      const index = readlineSync.questionInt('Enter recipe number: ') - 1;
      if (favoriteRecipes[index]) await viewRecipeDetails(favoriteRecipes[index].idMeal);
    }
  } catch (error) {
    console.error('Error viewing favorites:', error.message);
  }
}

async function showMainMenu() {
  console.log('\n===== RECIPE EXPLORER =====');
  console.log('1. Search recipes');
  console.log('2. View recipe details by ID');
  console.log('3. Explore recipes by first letter');
  console.log('4. Search by ingredient');
  console.log('5. View favorites');
  console.log('6. Discover random recipe');
  console.log('7. Exit');

  const choice = readlineSync.questionInt('Enter your choice (1-7): ', {
    limit: [1, 2, 3, 4, 5, 6, 7],
    limitMessage: 'Please enter a number between 1 and 7'
  });

  switch (choice) {
    case 1:
      await searchRecipes();
      break;
    case 2:
      await viewRecipeDetails();
      break;
    case 3:
      await exploreByFirstLetter();
      break;
    case 4:
      await searchByIngredient();
      break;
    case 5:
      await viewFavorites();
      break;
    case 6:
      await discoverRandom();
      break;
    case 7:
      console.log('Thank you for using Recipe Explorer!');
      process.exit(0);
  }

  return showMainMenu();
}

async function main() {
  console.log('Initializing Recipe Explorer...');
  const success = await initialize();
  if (!success) {
    console.error('Failed to initialize. Exiting.');
    process.exit(1);
  }
  console.log('Welcome to Recipe Explorer!');
  await showMainMenu();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default {
  main,
  searchRecipes,
  viewRecipeDetails,
  exploreByFirstLetter,
  searchByIngredient,
  viewFavorites,
  discoverRandom
};
