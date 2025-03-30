async function initialize() {
  try {
    await Promise.all([cache.initialize(), favorites.initialize()]);
    await cache.clearExpiredEntries();
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
    const isFavorite = await favorites.isFavorite(recipeId);
    const action = isFavorite ? 'Remove from' : 'Add to';
    if (readlineSync.keyInYN(`${action} favorites?`)) {
      isFavorite ? await favorites.removeFavorite(recipeId) : await favorites.addFavorite(recipe);
    }
    api.getMealsByCategory(recipe.strCategory).then(related => {
      console.log('Related recipes:', utils.formatRecipeList(related));
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
    const recipes = await cache.getCachedOrFetch(cacheKey, () => Promise.all(uniqueLetters.map(api.searchMealsByFirstLetter)));
    console.log(utils.formatRecipeList(recipes.flat()));
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
    console.log(utils.formatRecipeList(recipes));
  } catch (error) {
    console.error('Error searching by ingredient:', error.message);
  }
}

async function discoverRandom() {
  console.log('Fetching random recipes...');
  try {
    const recipe = await Promise.race([api.getRandomMeal(), api.getRandomMeal(), api.getRandomMeal()]);
    if (!recipe) {
      console.log('No random recipe found.');
      return;
    }
    console.log(utils.formatRecipe(recipe));
  } catch (error) {
    console.error('Error discovering random recipes:', error.message);
  }
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
