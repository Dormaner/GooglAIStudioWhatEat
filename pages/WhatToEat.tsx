
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { fetchRecipes } from '../services/api';
import { Recipe } from '../types';

interface WhatToEatProps {
  onRecipeClick: (recipe: Recipe) => void;
}

const WhatToEat: React.FC<WhatToEatProps> = ({ onRecipeClick }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const RECIPES_PER_PAGE = 9;

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes');
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const maxPage = Math.floor(recipes.length / RECIPES_PER_PAGE);
    setCurrentPage((prev) => (prev + 1) % (maxPage + 1));
  };

  const displayedRecipes = recipes.slice(
    currentPage * RECIPES_PER_PAGE,
    (currentPage + 1) * RECIPES_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-red-500 mb-4">❌ {error}</p>
        <button
          onClick={loadRecipes}
          className="bg-blue-500 text-white px-6 py-2 rounded-full"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">今天吃什么</h1>
        <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
          <Plus size={16} />
          存新菜
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1 content-start">
        {displayedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex flex-col items-center group cursor-pointer"
            onClick={() => onRecipeClick(recipe)}
          >
            <div className={`relative w-full aspect-square rounded-[1.2rem] overflow-hidden mb-1 bg-[#fdf2e9] border-[1.5px] transition-all ${recipe.id === '5' ? 'border-blue-400 shadow-sm scale-105' : 'border-transparent'}`}>
              <img src={`http://localhost:3001/api/image?url=${encodeURIComponent(recipe.image || '')}`} alt={recipe.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] py-0.5 px-0.5 text-center truncate">
                  缺:{recipe.missingIngredients[0]}
                </div>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-[9px] py-0.5 px-0.5 text-center">
                  齐全
                </div>
              )}
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight line-clamp-1 ${recipe.id === '5' ? 'text-blue-600' : 'text-gray-700'}`}>
              {recipe.name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 mb-4 flex justify-center">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-8 py-3 rounded-full font-bold text-base hover:bg-blue-100 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={20} />
          换一组
        </button>
      </div>
    </div>
  );
};

export default WhatToEat;
