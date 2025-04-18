const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function searchMealsByName(query) {
  try {
    console.log(`Searching for: ${query}`);
    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
    console.log(`Request URL: ${url}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    // console.log('API response:', data);

    // Ensure we're properly handling the API response
    return data.meals || [];
  } catch (error) {
    console.error('Error searching meals by name:', error);
    return [];
  }
}

export async function getMealById(id, attempts = 2) {
  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMealById(id, attempts - 1);
    }
    console.error('Error fetching meal by ID:', error);
    return null;
  }
}

export async function searchMealsByFirstLetter(letter) {
  try {
    const response = await fetch(`${BASE_URL}/search.php?f=${letter.charAt(0)}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Error searching meals by first letter:', error);
    return [];
  }
}

export async function getMealsByIngredient(ingredient, timeoutMs = 5000) {
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeoutMs));
    const fetchPromise = fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`)
      .then(response => response.ok ? response.json() : { meals: [] })
      .then(data => data.meals || []);
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error fetching meals by ingredient:', error);
    return 'Error fetching meals or request timed out';
  }
}

export async function getRelatedRecipes(recipe, limit = 3) {
  try {
    if (!recipe || !recipe.strCategory) return [];
    const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(recipe.strCategory)}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return (data.meals || []).filter(meal => meal.idMeal !== recipe.idMeal).slice(0, limit);
  } catch (error) {
    console.error('Error fetching related recipes:', error);
    return [];
  }
}

export async function getRandomMeal() {
  try {
    const response = await fetch(`${BASE_URL}/random.php`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error('Error fetching random meal:', error);
    return null;
  }
}

export default {
  searchMealsByName,
  getMealById,
  searchMealsByFirstLetter,
  getMealsByIngredient,
  getRelatedRecipes,
  getRandomMeal
};
