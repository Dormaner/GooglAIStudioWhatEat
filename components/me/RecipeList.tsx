import React from 'react';
import { Recipe } from '../../types';
import { ChefHat } from 'lucide-react';

interface RecipeListProps {
    recipes: Partial<Recipe>[];
    onRecipeClick: (recipe: any) => void;
    emptyMessage?: string;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onRecipeClick, emptyMessage = '暂无食谱' }) => {
    if (recipes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-gray-400 mt-10">
                <ChefHat size={48} className="mb-4 opacity-20" />
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 p-4 pb-20 overflow-y-auto">
            {recipes.map((recipe) => (
                <div
                    key={recipe.id}
                    onClick={() => onRecipeClick(recipe)}
                    className="bg-white rounded-xl shadow-sm overflow-hidden flex h-24 cursor-pointer active:scale-98 transition-transform border border-gray-50"
                >
                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                        {recipe.image && (
                            <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/image?url=${encodeURIComponent(recipe.image)}`}
                                alt={recipe.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        )}
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-center">
                        <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{recipe.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{recipe.insight || '暂无描述'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecipeList;
