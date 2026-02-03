import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Recipe } from '../types';
import RecipeList from '../components/me/RecipeList';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { fetchRecipeById } from '../services/api';

interface MyCookingProps {
    onBack: () => void;
    onRecipeClick: (recipe: Recipe) => void;
}

const MyCooking: React.FC<MyCookingProps> = ({ onBack, onRecipeClick }) => {
    const [recipes, setRecipes] = useState<Partial<Recipe>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('cooking_history')
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
            .order('cooked_at', { ascending: false });

        if (error) {
            console.error('Error loading cooking history:', error);
        } else {
            // Deduplicate if needed? Or show all history entries?
            // Showing all entries (e.g. cooked twice) might be repetitive.
            // Let's dedupe by ID for the list.
            const raw = data.map((item: any) => item.recipes).filter(Boolean);
            const seen = new Set();
            const unique = raw.filter((r: any) => {
                const duplicate = seen.has(r.id);
                seen.add(r.id);
                return !duplicate;
            });
            setRecipes(unique);
        }
        setLoading(false);
    };

    const handleRecipeClick = async (partialRecipe: Partial<Recipe>) => {
        if (!partialRecipe.id) return;
        try {
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
                    烹饪记录
                </h1>
            </div>

            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="animate-spin text-orange-500" />
                </div>
            ) : (
                <RecipeList recipes={recipes} onRecipeClick={handleRecipeClick} emptyMessage="还没有烹饪记录哦，快去试试吧" />
            )}
        </div>
    );
};

export default MyCooking;
