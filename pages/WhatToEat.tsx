
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2, Search } from 'lucide-react';
import { fetchRecipes } from '../services/api';
import { Recipe } from '../types';

interface WhatToEatProps {
  onRecipeClick: (recipe: Recipe) => void;
}

const WhatToEat: React.FC<WhatToEatProps> = ({ onRecipeClick }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const RECIPES_PER_PAGE = 9;

  const CATEGORIES = [
    { name: '全部', keywords: [] },
    { name: '家常菜', keywords: ['家常', '炒', '炖', '烧'] },
    { name: '下饭菜', keywords: ['下饭', '辣', '红烧', '干锅'] },
    { name: '早餐', keywords: ['早餐', '蛋', '饼', '粥', '面', '包子'] },
    { name: '肉类', keywords: ['肉', '排骨', '鸡', '牛', '羊', '鸭'] },
    { name: '鱼', keywords: ['鱼', '虾', '蟹', '海鲜'] },
    { name: '蔬菜', keywords: ['菜', '瓜', '豆', '茄子', '土豆', '萝卜'] },
    { name: '汤羹', keywords: ['汤', '羹'] },
    { name: '烘焙', keywords: ['蛋糕', '面包', '烤', '甜点', '饼干'] },
    { name: '主食', keywords: ['饭', '面', '粉', '馒头'] },
  ];

  useEffect(() => {
    loadRecipes();
  }, {});

  // Reset pagination when category or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory, searchQuery]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecipes();
      setRecipes(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes');
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const maxPage = Math.floor(filteredRecipes.length / RECIPES_PER_PAGE);
    setCurrentPage((prev) => (prev + 1) % (maxPage + 1));
  };

  // Filter Logic
  const filteredRecipes = React.useMemo(() => {
    let result = recipes;

    // 1. Filter by Category
    if (selectedCategory !== '全部') {
      const keywords = CATEGORIES.find(c => c.name === selectedCategory)?.keywords || [];
      result = result.filter(recipe => {
        if (keywords.some(k => recipe.name.includes(k))) return true;
        if (recipe.ingredients?.main?.some(ing => keywords.some(k => ing.name.includes(k)))) return true;
        return false;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(recipe =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.ingredients?.main?.some(i => i.name.toLowerCase().includes(i.name))
      );
    }

    return result;
  }, [recipes, selectedCategory, searchQuery]);

  const displayedRecipes = filteredRecipes.slice(
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
    <div className="px-3 pt-14 h-full flex flex-col bg-white">
      <div className="flex justify-between items-center mb-4 px-1">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">今天吃什么</h1>
        <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
          <Plus size={16} />
          存新菜
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
          placeholder="搜菜名、食材..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>

      {/* Category Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar -mx-3 px-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat.name
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-y-auto pb-20">
        {displayedRecipes.length > 0 ? (
          displayedRecipes.map((recipe) => (
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
          ))
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center text-gray-400 py-10">
            <p className="text-sm">该分类下暂无菜谱</p>
          </div>
        )}
      </div>

      <div className="mt-4 mb-4 flex justify-center">
        <button
          onClick={handleRefresh}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-base transition-all shadow-sm active:scale-95 ${displayedRecipes.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          disabled={displayedRecipes.length === 0}
        >
          <RefreshCw size={20} />
          换一组
        </button>
      </div>
    </div>
  );
};

export default WhatToEat;
