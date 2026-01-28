
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { fetchIngredients, addNewIngredient, searchByIngredients, deleteIngredient } from '../services/api';
import { Recipe } from '../types';
import KitchenPantry from '../components/KitchenPantry';
import AddIngredientModal from '../components/AddIngredientModal';
import IngredientSection from '../components/IngredientSection';
import VariantSelectionModal from '../components/VariantSelectionModal';

interface WhatIsAvailableProps {
  onRecipeClick: (recipe: Recipe) => void;
}

const WhatIsAvailable: React.FC<WhatIsAvailableProps> = ({ onRecipeClick }) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['土豆', '胡萝卜', '鸡蛋']);
  const [ingredients, setIngredients] = useState<any>({ vegetables: [], meats: [], staples: [], condiments: [], kitchenware: [] });
  const [showPantry, setShowPantry] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);

  // Display loading state
  const [loading, setLoading] = useState(false);

  // Add Ingredient Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('');

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ingredientsData] = await Promise.all([
        fetchIngredients(),
      ]);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Manual search trigger
  const handleSearch = async () => {
    if (selectedIngredients.length === 0) return;

    try {
      setLoading(true);
      setDisplayedRecipes([]);

      // Always use fuzzy search (strict=false) to get all potential matches
      const results = await searchByIngredients(selectedIngredients, false);

      // Sort by missing ingredients count (ascending)
      // Recipes with 0 missing ingredients come first
      const sortedResults = results.sort((a, b) => {
        const missingA = a.missingIngredients?.length || 0;
        const missingB = b.missingIngredients?.length || 0;
        return missingA - missingB;
      });

      setDisplayedRecipes(sortedResults);

    } catch (err) {
      console.error('Local search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleRecipeClickInternal = (recipe: Recipe) => {
    // Always treat as internal view, now that we handle Bilibili videos in-app
    onRecipeClick(recipe);
  };

  const openAddModal = (category: string) => {
    const categoryMap: Record<string, string> = {
      '菜菜们': 'vegetable',
      '肉肉们': 'meat',
      '主食也一起下锅吗？': 'staple',
      '调料': 'condiment',
      '厨具': 'tool'
    };
    setModalCategory(categoryMap[category] || 'condiment');
    setIsModalOpen(true);
  };

  const handleAddIngredient = async (name: string, icon?: string, overrideCategory?: string) => {
    try {
      // Manual mapping mainly for when KitchenPantry passes Chinese keys
      const categoryMap: Record<string, string> = {
        '蔬菜': 'vegetable',
        '肉类': 'meat',
        '主食': 'staple',
        '调料': 'condiment',
        '厨具': 'tool'
      };

      let finalCategory = overrideCategory || modalCategory;
      if (categoryMap[finalCategory]) {
        finalCategory = categoryMap[finalCategory];
      }

      // Fallbacks
      if (finalCategory === '调料') finalCategory = 'condiment';
      if (finalCategory === '厨具') finalCategory = 'tool';
      if (finalCategory === '主食') finalCategory = 'staple';

      // 1. Close Modal Immediately
      setIsModalOpen(false);

      // 2. Optimistic Update
      const tempId = `temp-${Date.now()}`;
      const optimisticItem = {
        id: tempId,
        name,
        category: finalCategory,
        icon: icon || '🍽️', // Simple fallback, server will do better
        variants: [] // It's a single item initially
      };

      setIngredients((prev: any) => {
        const next = { ...prev };
        // Map category to state key
        // vegetables, meats, staples, condiments, kitchenware
        // 'vegetable' -> 'vegetables'
        let key = finalCategory + 's';
        if (finalCategory === 'kitchenware' || finalCategory === 'tool') key = 'kitchenware';

        if (Array.isArray(next[key])) {
          next[key] = [...next[key], optimisticItem];
        }
        return next;
      });

      // 3. Background API Call
      await addNewIngredient(name, finalCategory, icon);
      await loadData(); // Refresh list to get real ID and correct grouping/icon

    } catch (error) {
      console.error('Failed to add ingredient:', error);
      alert(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
      loadData(); // Revert on error
    }
  };

  // Variant Selection Modal State
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<{ name: string, variants: any[] } | null>(null);

  const openVariantModal = (group: any) => {
    setActiveGroup(group);
    setVariantModalOpen(true);
  };

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleBackgroundTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
    }, 800);
  };

  const handleBackgroundTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Exit edit mode when clicking elsewhere/background if already on? 
  // actually user said "long press blank" to *enable* it. usually clicking blank *disables* it.
  const handleBackgroundClick = () => {
    if (isEditMode) setIsEditMode(false);
  };

  const handleDeleteIngredient = async (item: any) => {
    // 1. Optimistic Update: Remove from UI immediately
    setIngredients((prev: any) => {
      const next = { ...prev };
      // Find and remove from correct category
      for (const key in next) {
        if (Array.isArray(next[key])) {
          next[key] = next[key].filter((i: any) => i.id !== item.id);
        }
      }
      return next;
    });

    // Remove from selected immediately
    if (selectedIngredients.includes(item.name)) {
      toggleIngredient(item.name);
    }

    // 2. Background API Call
    try {
      await deleteIngredient(item.id);
    } catch (err) {
      console.error("Delete failed in background", err);
      // Ideally we should revert UI here, but for "Instant" feel we just silent fail or toast.
      // alert("服务器同步失败"); // Optional: Don't interrupt flow if possible
    }
  };

  return (
    <div
      className={`px-5 pt-10 bg-[#f8f9fa] min-h-full pb-20 transition-colors duration-300 ${isEditMode ? 'bg-gray-100' : ''}`}
      onMouseDown={handleBackgroundTouchStart}
      onMouseUp={handleBackgroundTouchEnd}
      onClick={handleBackgroundClick}
      onTouchStart={handleBackgroundTouchStart}
      onTouchEnd={handleBackgroundTouchEnd}
    >
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">今天吃什么</h1>
        <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
          <Plus size={18} />
          存新菜
        </button>
      </div>

      <div className="flex justify-end mb-4 gap-2">
        {isEditMode && (
          <div className="flex items-center gap-1 bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs animate-pulse">
            <span>🗑️ 编辑模式: 点击红色按钮删除</span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPantry(true);
          }}
          className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50 transition-all"
        >
          <span>🧂</span> 我的厨房库
        </button>
      </div>

      <IngredientSection
        title="菜菜们"
        icon="🥬"
        items={ingredients.vegetables}
        colorClass="bg-green-100 text-green-700"
        selectedIngredients={selectedIngredients}
        onToggle={toggleIngredient}
        onOpenAddModal={openAddModal}
        onOpenVariantModal={openVariantModal}
        isEditMode={isEditMode}
        onDelete={handleDeleteIngredient}
      />
      <IngredientSection
        title="肉肉们"
        icon="🥩"
        items={ingredients.meats}
        colorClass="bg-red-100 text-red-700"
        selectedIngredients={selectedIngredients}
        onToggle={toggleIngredient}
        onOpenAddModal={openAddModal}
        onOpenVariantModal={openVariantModal}
        isEditMode={isEditMode}
        onDelete={handleDeleteIngredient}
      />

      <KitchenPantry
        isOpen={showPantry}
        onClose={() => setShowPantry(false)}
        ingredients={ingredients}
        selectedIngredients={selectedIngredients}
        onToggleIngredient={toggleIngredient}
        onAddIngredient={(name, cat, icon) => handleAddIngredient(name, icon, cat)}
        onSearch={handleSearch}
      />

      {/* Variant Selection Modal - Reusable Component */}
      <VariantSelectionModal
        isOpen={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        group={activeGroup}
        selectedIngredients={selectedIngredients}
        onToggle={toggleIngredient}
      />

      <div className={`mt-10 mb-6 transition-opacity duration-300 ${showPantry ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="fixed bottom-20 left-0 right-0 px-6 z-30 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSearch();
            }}
            disabled={selectedIngredients.length === 0 || loading}
            style={{ pointerEvents: 'auto' }}
            className={`shadow-xl flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all transform active:scale-95 cursor-pointer
                    ${selectedIngredients.length > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white translate-y-0 opacity-100 hover:shadow-2xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 translate-y-4 opacity-0'
              }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : '🍳'}
            {loading ? '正在搜索...' : '开始觅食'}
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mb-4 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍲</span>
            <h3 className="text-lg font-bold text-gray-800">来看看组合出的菜谱吧！</h3>
          </div>
          <p className="text-[10px] text-gray-400">
            优先展示食材齐全的菜谱，缺少食材的排在后面
          </p>
        </div>

        {/* Search Results Area */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-amber-500/80">
              <Loader2 className="animate-spin" size={40} />
              <span className="text-sm font-bold animate-pulse">正在厨房里翻箱倒柜...</span>
            </div>
          ) : displayedRecipes.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  已为您找到 {displayedRecipes.length} 个相关视频
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 px-2 pb-24">
                {displayedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleRecipeClickInternal(recipe)}
                  >
                    <div className="relative w-full aspect-video bg-gray-100">
                      <img
                        src={`http://localhost:3001/api/image?url=${encodeURIComponent(recipe.image || '')}`}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Missing Ingredients Badge */}
                      {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-white/20">
                          缺: {recipe.missingIngredients.slice(0, 2).join(' ')}{recipe.missingIngredients.length > 2 ? '...' : ''}
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                        <div className="flex items-center justify-between text-[10px] text-white/90">
                          <span>{recipe.insight?.split('•')[0] || 'UP主'}</span>
                          <span>{recipe.insight?.split('•')[1] || ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed">
                        {recipe.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-10 text-sm">
              {selectedIngredients.length > 0 ? '点击下方按钮开始搜索' : '请先选择食材'}
            </div>
          )}
        </div>

        <AddIngredientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleAddIngredient}
          category={modalCategory}
        />
      </div>
    </div >
  );
};

export default WhatIsAvailable;
