
import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Loader2, Search } from 'lucide-react';
import { fetchRecipes, softDeleteRecipe } from '../services/api';
import { Recipe } from '../types';
import ParsingButton from '../components/ParsingButton';
import SaveRecipeModal from '../components/SaveRecipeModal';
import { supabase } from '../config/supabase';

interface WhatToEatProps {
  onRecipeClick: (recipe: Recipe) => void;
  parsingTasks: Array<{
    id: string;
    url: string;
    status: 'parsing' | 'success' | 'error';
    progress: string;
    result?: any;
    error?: string;
    progressPercent?: number;
    estimatedTimeLeft?: string;
  }>;
  setParsingTasks: (tasks: any) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}

const WhatToEat: React.FC<WhatToEatProps> = ({
  onRecipeClick,
  parsingTasks,
  setParsingTasks,
  editingTaskId,
  setEditingTaskId
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const RECIPES_PER_PAGE = 9;

  // Delete Mode State
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsDeleteMode(true);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(50);
    }, 800); // 800ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };



  // Exit delete mode when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDeleteMode && !(e.target as Element).closest('.recipe-card') && !(e.target as Element).closest('.delete-btn')) {
        setIsDeleteMode(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDeleteMode]);

  // Modal state
  const [isSaveRecipeModalOpen, setIsSaveRecipeModalOpen] = useState(false);

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
  }, []);

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
        recipe.ingredients?.main?.some(i => i.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [recipes, selectedCategory, searchQuery]);

  // Pagination Logic (Moved after filteredRecipes)
  const maxPage = Math.max(0, Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE) - 1);

  const handleNext = () => {
    setCurrentPage((prev) => (prev >= maxPage ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => (prev <= 0 ? maxPage : prev - 1));
  };

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
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">吃什么</h1>
        <div className="flex items-center gap-2">
          {/* Parsing Button */}
          <ParsingButton
            parsingTasks={parsingTasks}
            onOpenEdit={(taskId) => {
              setEditingTaskId(taskId);
              setIsSaveRecipeModalOpen(true);
            }}
            onClearTask={(taskId) => {
              setParsingTasks(prev => prev.filter(t => t.id !== taskId));
            }}
          />

          {/* Add Recipe Button */}
          <button
            onClick={() => {
              setEditingTaskId(null);
              setIsSaveRecipeModalOpen(true);
            }}
            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <Plus size={16} />
            存新菜
          </button>
        </div>
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

      <div
        className="grid grid-cols-3 gap-2 flex-1 content-start overflow-y-auto pb-20 hide-scrollbar"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {displayedRecipes.length > 0 ? (
          displayedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => {
                if (!isDeleteMode) onRecipeClick(recipe);
              }}
              className={`flex flex-col items-center group cursor-pointer relative ${isDeleteMode ? 'animate-shake' : ''}`}
            >
              {/* Delete Button Overlay */}
              {isDeleteMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Call delete API
                    softDeleteRecipe(recipe.id).then(() => {
                      // Optimistic update
                      setRecipes(prev => prev.filter(r => r.id !== recipe.id));
                    });
                  }}
                  className="delete-btn absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center z-20 shadow-md animate-in zoom-in"
                >
                  <span className="font-bold text-xs">✕</span>
                </button>
              )}

              <div className={`relative w-full aspect-square rounded-[1.2rem] overflow-hidden mb-1 bg-[#fdf2e9] border-[1.5px] transition-all ${recipe.id === '5' ? 'border-blue-400 shadow-sm scale-105' : 'border-transparent'}`}>
                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/image?url=${encodeURIComponent(recipe.image || '')}`} alt={recipe.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
        <div className="mt-4 mb-4 flex justify-center items-center gap-6">
          <button
            onClick={handlePrev}
            className={`flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all ${displayedRecipes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={displayedRecipes.length === 0}
          >
            <span className="text-xl font-bold">{'<'}</span>
          </button>

          <span className="text-sm font-medium text-gray-500">
            {filteredRecipes.length > 0 ? `${currentPage + 1} / ${maxPage + 1}` : '0 / 0'}
          </span>

          <button
            onClick={handleNext}
            className={`flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all ${displayedRecipes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={displayedRecipes.length === 0}
          >
            <span className="text-xl font-bold">{'>'}</span>
          </button>
        </div>
      </div>

      {/* Save Recipe Modal */}
      <SaveRecipeModal
        isOpen={isSaveRecipeModalOpen}
        onClose={() => setIsSaveRecipeModalOpen(false)}
        onSave={async (recipe) => {
          try {
            const { saveCustomRecipe } = await import('../services/api');
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'default-user';

            await saveCustomRecipe(recipe, userId);
            // Silently save, no alert needed
            loadRecipes(); // Reload recipes
          } catch (error) {
            console.error('Save failed:', error);
            throw error;
          }
        }}
        parsingTasks={parsingTasks}
        setParsingTasks={setParsingTasks}
        editingTaskId={editingTaskId}
      />
    </div>
  );
};

export default WhatToEat;
