import axios from 'axios';
import { Recipe } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Recipe APIs
export const fetchRecipes = async (): Promise<Recipe[]> => {
    const response = await api.get('/api/recipes');
    return response.data;
};

export const fetchRecipeById = async (id: string): Promise<Recipe> => {
    const response = await api.get(`/api/recipes/${id}`);
    return response.data;
};

export const createRecipe = async (recipe: Partial<Recipe>): Promise<{ id: string; message: string }> => {
    const response = await api.post('/api/recipes', recipe);
    return response.data;
};

export const updateRecipe = async (id: string, recipe: Partial<Recipe>): Promise<{ message: string }> => {
    const response = await api.put(`/api/recipes/${id}`, recipe);
    return response.data;
};

export const deleteRecipe = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/recipes/${id}`);
    return response.data;
};

// Ingredient APIs
export interface IngredientsByCategory {
    vegetables: Array<{ id: string; name: string; category: string; icon?: string }>;
    meats: Array<{ id: string; name: string; category: string; icon?: string }>;
    staples: Array<{ id: string; name: string; category: string; icon?: string }>;
    condiments: Array<{ id: string; name: string; category: string; icon?: string }>;
    kitchenware: Array<{ id: string; name: string; category: string; icon?: string }>;
}

export const fetchIngredients = async (): Promise<IngredientsByCategory> => {
    const response = await api.get('/api/ingredients');
    return response.data;
};

export const addNewIngredient = async (name: string, category: string, icon?: string): Promise<any> => {
    const response = await api.post('/api/ingredients', { name, category, icon });
    return response.data;
};

export const deleteIngredient = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/ingredients/${id}`);
    return response.data;
};

export const fetchUserIngredients = async (userId?: string): Promise<any[]> => {
    const response = await api.get('/api/ingredients/user-ingredients', {
        params: { userId },
    });
    return response.data;
};

export const addUserIngredient = async (
    ingredientName: string,
    quantity?: number,
    unit?: string,
    userId?: string
): Promise<{ message: string }> => {
    const response = await api.post('/api/ingredients/user-ingredients', {
        ingredientName,
        quantity,
        unit,
        userId,
    });
    return response.data;
};

export const removeUserIngredient = async (
    ingredientName: string,
    userId?: string
): Promise<{ message: string }> => {
    const response = await api.delete(`/api/ingredients/user-ingredients/${ingredientName}`, {
        params: { userId },
    });
    return response.data;
};

// Search APIs
export const searchByIngredients = async (
    ingredients: string[],
    strict: boolean = false
): Promise<Recipe[]> => {
    const response = await api.post('/api/search/by-ingredients', {
        ingredients,
        strict,
    });
    return response.data;
};

export const searchRecipesByKeyword = async (query: string): Promise<Recipe[]> => {
    const response = await api.get('/api/search/recipes', {
        params: { q: query },
    });
    return response.data;
};

export const searchBilibiliRecipes = async (ingredients: string[]): Promise<Recipe[]> => {
    const query = `${ingredients.join(' ')} 做法`;
    const response = await api.get('/api/search/bilibili', {
        params: { q: query }
    });
    return response.data;
};

export const analyzeRecipe = async (bvid: string) => {
    const response = await fetch(`${API_URL}/analyze/${bvid}`);
    return response.json();
};

export const toggleFavorite = async (recipeId: string) => {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user' })
    });
    return response.json();
};

export const updateRecipeInsight = async (recipeId: string, insight: string) => {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight })
    });
    return response.json();
};

export const incrementCookedCount = async (recipeId: string) => {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/cooked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
};

export const sendVoiceCommand = async (payload: { text: string; recipeId: string; currenStep: number; totalSteps: number; currentInsight?: string }) => {
    const response = await fetch(`${API_URL}/api/voice/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.json();
};

export default api;
