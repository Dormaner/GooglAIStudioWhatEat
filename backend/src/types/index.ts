export interface Recipe {
    id: string;
    name: string;
    image: string;
    missingIngredients?: string[];
    ingredients: {
        main: { name: string; amount: string; status?: 'missing' | 'stocked' }[];
        condiments: { name: string; amount: string; status?: 'missing' | 'stocked' }[];
    };
    steps: {
        title: string;
        description: string;
        image: string;
        videoUrl?: string;
    }[];
    insight: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Ingredient {
    id: string;
    name: string;
    category: 'vegetable' | 'meat' | 'staple' | 'condiment';
    icon?: string;
}

export interface UserIngredient {
    id: string;
    userId: string;
    ingredientId: string;
    quantity?: number;
    unit?: string;
    addedAt: string;
}

export interface RecipeStep {
    id: string;
    recipeId: string;
    stepOrder: number;
    title: string;
    description: string;
    image: string;
    videoUrl?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}
