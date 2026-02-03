import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Recipe } from '../types';
import RecipeList from '../components/me/RecipeList';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { fetchRecipeById } from '../services/api';

interface MyFavoritesProps {
    onBack: () => void;
    onRecipeClick: (recipe: Recipe) => void;
}

const MyFavorites: React.FC<MyFavoritesProps> = ({ onBack, onRecipeClick }) => {
    const [recipes, setRecipes] = useState<Partial<Recipe>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('user_favorites')
            .select(`
                recipe_id,
                recipes (
                    id,
                    name,
                    image,
                    insight
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading favorites:', error);
        } else {
            const formatted = data.map((item: any) => item.recipes).filter(Boolean);
            setRecipes(formatted);
        }
        setLoading(false);
    };

    const handleRecipeClick = async (partialRecipe: Partial<Recipe>) => {
        if (!partialRecipe.id) return;
        // Fetch full details
        try {
            // Show loading if needed, or optimistically navigate?
            // Since onRecipeClick in App handles sync/async, passing full object is better.
            const fullRecipe = await fetchRecipeById(partialRecipe.id);
            onRecipeClick(fullRecipe);
        } catch (e) {
            console.error('Failed to load recipe details', e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center px-4 h-14 bg-white border-b border-gray-100">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">
                    我的收藏
                </h1>
            </div>

            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="animate-spin text-orange-500" />
                </div>
            ) : (
                <RecipeList recipes={recipes} onRecipeClick={handleRecipeClick} emptyMessage="还没有收藏菜谱哦" />
            )}
        </div>
    );
};

export default MyFavorites;
