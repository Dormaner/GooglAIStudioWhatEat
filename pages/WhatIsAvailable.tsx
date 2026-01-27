
import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { fetchIngredients, fetchRecipes, addNewIngredient, searchByIngredients } from '../services/api';
import { Recipe } from '../types';
import AddIngredientModal from '../components/AddIngredientModal';

interface WhatIsAvailableProps {
  onRecipeClick: (recipe: Recipe) => void;
}

const WhatIsAvailable: React.FC<WhatIsAvailableProps> = ({ onRecipeClick }) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['土豆', '胡萝卜', '鸡蛋']);
  const [ingredients, setIngredients] = useState<any>({ vegetables: [], meats: [], staples: [] });
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);

  // Display loading state
  const [loading, setLoading] = useState(false);
  const [matchMode, setMatchMode] = useState<'fuzzy' | 'strict'>('strict');

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

  // Helper: Synonym Mapping for better matching
  const SYNONYMS: Record<string, string[]> = {
    '西红柿': ['番茄'],
    '番茄': ['西红柿'],
    '土豆': ['马铃薯', '洋芋'],
    '马铃薯': ['土豆', '洋芋'],
    '洋芋': ['土豆', '马铃薯'],
    '花菜': ['花椰菜'],
    '西兰花': ['花椰菜'],
    '包菜': ['卷心菜', '洋白菜', '圆白菜'],
    '大头菜': ['包菜', '卷心菜'],
    '菠萝': ['凤梨'],
    '鸡肉': ['鸡胸', '鸡腿', '鸡翅', '全鸡'],
    '猪肉': ['五花肉', '瘦肉', '里脊', '排骨', '猪蹄'],
    '牛肉': ['牛排', '牛腩', '肥牛'],
    '鸡蛋': ['蛋'],
    '青椒': ['甜椒', '辣椒']
  };

  // Helper to check if text contains ingredient (handling synonyms)
  const containsIngredient = (text: string, ingredient: string) => {
    if (text.includes(ingredient)) return true;
    const aliases = SYNONYMS[ingredient];
    if (aliases) {
      return aliases.some(alias => text.includes(alias));
    }
    return false;
  };

  // Helper to get all known ingredient names for scanning
  const getAllKnownIngredients = () => {
    return [
      ...ingredients.vegetables.map((i: any) => i.name),
      ...ingredients.meats.map((i: any) => i.name),
      ...ingredients.staples.map((i: any) => i.name)
    ];
  };

  // Manual search trigger
  const handleSearch = async () => {
    if (selectedIngredients.length === 0) return;

    try {
      setLoading(true);
      setDisplayedRecipes([]);

      // Switch to Local DB Search for Xiachufang recipes
      // strict=false means fuzzy match (at least one ingredient)
      // matchMode state controls how we filter the RESULTS

      const results = await searchByIngredients(selectedIngredients, matchMode === 'strict');
      setDisplayedRecipes(results);

    } catch (err) {
      console.error('Local search failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run filter if matchMode changes
  useEffect(() => {
    if (selectedIngredients.length > 0 && !loading) {
      handleSearch();
    }
  }, [matchMode]);

  // ... (omitted sections)

  <p className="text-[10px] text-gray-400">
    {matchMode === 'strict' ? '精准匹配：不应该缺少任何食材' : '模糊匹配：可能需要额外购买食材'}
  </p>



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
      '主食也一起下锅吗？': 'staple'
    };
    setModalCategory(categoryMap[category] || 'condiment');
    setIsModalOpen(true);
  };

  const handleAddIngredient = async (name: string, icon?: string) => {
    try {
      await addNewIngredient(name, modalCategory, icon);
      await loadData(); // Refresh list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      alert('添加失败，可能该食材已存在');
    }
  };

  const IngredientSection = ({ title, icon, items, colorClass }: { title: string, icon: string, items: any[], colorClass: string }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 justify-center">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((item: any) => (
          <button
            key={item.name}
            onClick={() => toggleIngredient(item.name)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${selectedIngredients.includes(item.name)
                ? `${colorClass} border-transparent shadow-sm scale-105`
                : 'bg-white text-gray-600 border-gray-200'}`}
          >
            <span>{item.icon}</span>
            {item.name}
          </button>
        ))}
        <button
          onClick={() => openAddModal(title)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-400 border border-orange-100 border-dashed hover:bg-orange-100 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-5 pt-10 bg-[#f8f9fa] min-h-full pb-20">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">今天吃什么</h1>
        <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
          <Plus size={18} />
          存新菜
        </button>
      </div>

      <div className="flex gap-2 justify-end mb-6">
        <button className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">调料</button>
        <button className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">厨具</button>
      </div>

      <IngredientSection title="菜菜们" icon="🥬" items={ingredients.vegetables} colorClass="bg-green-100 text-green-700" />
      <IngredientSection title="肉肉们" icon="🥩" items={ingredients.meats} colorClass="bg-red-100 text-red-700" />
      <IngredientSection title="主食也一起下锅吗？" icon="🍚" items={ingredients.staples} colorClass="bg-yellow-50 text-yellow-700" />

      <div className="mt-10 mb-6">
        <div className="fixed bottom-20 left-0 right-0 px-6 pointer-events-none z-50 flex justify-center">
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

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMatchMode('strict')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${matchMode === 'strict' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
            >
              严格匹配
            </button>
            <button
              onClick={() => setMatchMode('fuzzy')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${matchMode === 'fuzzy' ? 'bg-white text-amber-500 shadow-sm' : 'text-gray-400'}`}
            >
              模糊匹配
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            {matchMode === 'strict' ? '必须包含所有选中的食材' : '包含部分食材，会标注缺少的食材'}
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
                        src={recipe.image}
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
    </div>
  );
};

export default WhatIsAvailable;
