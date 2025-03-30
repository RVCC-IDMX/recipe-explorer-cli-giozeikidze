import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FAVORITES_FILE = path.join(__dirname, '../data/favorites.json');

export async function initializeFavorites() {
  try {
    await fs.access(FAVORITES_FILE);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(FAVORITES_FILE), { recursive: true });
      await fs.writeFile(FAVORITES_FILE, JSON.stringify([]));
    } catch (writeError) {
      console.error('Error initializing favorites:', writeError.message);
    }
  }
}

export async function getFavorites() {
  try {
    await initializeFavorites();
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading favorites:', error.message);
    return [];
  }
}

export async function addFavorite(recipe) {
  try {
    await initializeFavorites();
    const favorites = await getFavorites();
    if (favorites.some(fav => fav.idMeal === recipe.idMeal)) {
      return false;
    }
    favorites.push(recipe);
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    return true;
  } catch (error) {
    console.error('Error adding favorite:', error.message);
    return false;
  }
}

export async function removeFavorite(recipeId) {
  try {
    await initializeFavorites();
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.idMeal !== recipeId);
    if (favorites.length === updatedFavorites.length) {
      return false;
    }
    await fs.writeFile(FAVORITES_FILE, JSON.stringify(updatedFavorites, null, 2));
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error.message);
    return false;
  }
}

export async function isInFavorites(recipeId) {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.idMeal === recipeId);
  } catch (error) {
    console.error('Error checking favorite:', error.message);
    return false;
  }
}

export async function getFavoriteById(recipeId) {
  try {
    const favorites = await getFavorites();
    return favorites.find(fav => fav.idMeal === recipeId) || null;
  } catch (error) {
    console.error('Error retrieving favorite:', error.message);
    return null;
  }
}

export default {
  initializeFavorites,
  getFavorites,
  addFavorite,
  removeFavorite,
  isInFavorites,
  getFavoriteById
};
