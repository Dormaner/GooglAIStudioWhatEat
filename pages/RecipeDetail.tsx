
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Heart, Star, Edit3, ShoppingCart, CookingPot, ChevronRight, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Recipe, ViewMode } from '../types';
import { analyzeRecipe } from '../services/api';
import { supabase } from '../config/supabase';

interface RecipeDetailProps {
  recipe: Recipe;
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  onBack: () => void;
  onEnterCooking: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, mode, setMode, onBack, onEnterCooking }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(recipe);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Interaction States
  // REMOVED: likes/Heart state
  const [isCollected, setIsCollected] = useState(recipe.isCollected || false);
  const [cookedCount, setCookedCount] = useState(0);

  // Edit Insight State
  const [isEditingInsight, setIsEditingInsight] = useState(false);
  const [insightText, setInsightText] = useState(recipe.insight || '');
  const [isSavingInsight, setIsSavingInsight] = useState(false); // Loading state for save

  // Load local state (Cooked Count)
  useEffect(() => {
    const localCount = parseInt(localStorage.getItem(`cooked_count_${recipe.id}`) || '0');
    setCookedCount(localCount);
  }, [recipe.id]);

  // Sync props AND Fetch latest data (Fix for persistence)
  useEffect(() => {
    // 1. Initial Sync from props
    setCurrentRecipe(recipe);
    setIsCollected(recipe.isCollected || false);
    setInsightText(recipe.insight || '');

    // 2. Fetch fresh data from API to ensure Insight is up-to-date
    const fetchFreshData = async () => {
      try {
        const userId = await checkLogin(false); // Get userId silently
        const { fetchRecipeById } = await import('../services/api');
        const freshRecipe = await fetchRecipeById(recipe.id, recipe.name, userId || undefined);
        if (freshRecipe) {
          setCurrentRecipe(freshRecipe);
          setInsightText(freshRecipe.insight || '');
          setIsCollected(freshRecipe.isCollected || false);
        }
      } catch (e) {
        console.error("Failed to fetch fresh recipe data", e);
      }
    };
    fetchFreshData();

  }, [recipe.id]); // Only re-run if recipe ID changes (page load)

  // Use a simple ref to track login status to avoid async race in even handlers if possible, or just check auth.

  const checkLogin = async (showError = true): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (showError) alert("请先登录账号！");
      return null;
    }
    return session.user.id;
  };

  const recordCookingHistory = async (userId: string) => {
    try {
      const { error } = await supabase.from('cooking_history').insert({
        user_id: userId,
        recipe_id: recipe.id
      });

      if (error) {
        // Ignore duplicate key error (already recorded)
        if (error.code !== '23505') {
          console.error("Cooking history insert error:", error);
          // alert("记录失败: " + error.message);
        }
      } else {
        // Success
      }


    } catch (e) {
      console.error("Failed to record cooking history", e);
    }
  };



  useEffect(() => {
    const recordHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Upsert to update timestamp if exists
          await supabase.from('browsing_history').upsert({
            user_id: user.id,
            recipe_id: recipe.id,
            viewed_at: new Date().toISOString()
          }, { onConflict: 'user_id, recipe_id' });
        }
      } catch (e) {
        console.error("Failed to record history", e);
      }
    };
    recordHistory();
  }, [recipe.id]);

  // Inventory & Shopping Cart Logic
  // Map: Ingredient Name -> Is Stocked (true) / Missing (false)
  const [stockStatus, setStockStatus] = useState<Record<string, boolean>>({});
  const [cartItems, setCartItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadInventoryAndCart = async () => {
      const userId = await checkLogin(false);
      if (!userId) return;

      try {
        // 1. Fetch Full User Inventory
        // We use the same API as "My Kitchen" to ensure data consistency
        const { fetchUserIngredients } = await import('../services/api');
        const userIngredientsList = await fetchUserIngredients(userId);

        // Extract names
        const inventoryNames = userIngredientsList?.map((item: any) =>
          item.name || item.ingredientName || item.ingredients?.name || ''
        ).filter(Boolean) || [];

        console.log("Loaded Inventory for Check:", inventoryNames);

        // --- NEW: AI-Powered Semantic Matching with Fallback ---
        // Strategy: Try AI first (Smart), fallback to Local Algorithm (Fast/Backup) if it fails.
        let statusMap: Record<string, boolean> = {};
        const ingredientsToCheck = currentRecipe.ingredients?.main?.map(i => i.name) || [];

        try {
          const { checkAiIngredientStock } = await import('../services/api');
          // Optimistic UI could suggest "Analyzing..." here if needed, but for now we wait.
          statusMap = await checkAiIngredientStock(inventoryNames, ingredientsToCheck);
          console.log("AI Match Success:", statusMap);
        } catch (aiError) {
          console.warn("AI Match Failed, falling back to Local Algorithm:", aiError);

          // --- FALLBACK: Local Algorithm (Preserved as requested) ---
          const { isIngredientAvailable } = await import('../services/ingredientMatcher');
          ingredientsToCheck.forEach(ingName => {
            statusMap[ingName] = isIngredientAvailable(inventoryNames, ingName);
          });
        }

        setStockStatus(statusMap);

        // 3. Fetch User Cart
        const { data: cartData } = await supabase
          .from('shopping_cart')
          .select('ingredient_name')
          .eq('user_id', userId);

        if (cartData) {
          const cartNames = new Set(cartData.map((item: any) =>
            (item.ingredient_name || '').trim().toLowerCase()
          ));
          setCartItems(cartNames);
        }
      } catch (e) {
        console.error("Failed to load inventory/cart", e);
      }
    };
    loadInventoryAndCart();
  }, [recipe.id, currentRecipe.ingredients]); // Run when recipe or its ingredients change



  const handleAddToCart = async (ingredientName: string) => {
    const userId = await checkLogin(true);
    if (!userId) return;

    const normalizedName = ingredientName.trim().toLowerCase();

    try {
      if (cartItems.has(normalizedName)) {
        alert("已经在购物车里啦");
        return;
      }

      const { addToShoppingCart } = await import('../services/api');
      await addToShoppingCart(ingredientName, userId); // Store original case

      setCartItems(prev => new Set(prev).add(normalizedName));
      alert(`已将 "${ingredientName}" 加入购物车`);
    } catch (e) {
      console.error("Add to cart failed", e);
      alert("加入购物车失败，请重试");
    }
  };

  const handleToggleFavorite = async () => {
    const userId = await checkLogin();
    if (!userId) return;

    // Optimistic Update
    const newState = !isCollected;
    setIsCollected(newState);

    try {
      let targetId = recipe.id;
      // Check if UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

      if (!isUUID) {
        // Ensure persistent recipe exists
        const { ensureRecipeForFavorite } = await import('../services/api');
        const res = await ensureRecipeForFavorite(recipe.id, currentRecipe);
        if (res && res.id) {
          targetId = res.id;
        } else {
          throw new Error("Failed to ensure recipe for favorite");
        }
      }

      // Perform toggle using Supabase directly (bypassing backend RLS issues)
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', targetId)
        .single();

      if (existing) {
        // Remove
        await supabase.from('user_favorites').delete().eq('id', existing.id);
        // If we wanted exact sync, we'd check error, but optimistic is fine
      } else {
        // Add
        const { error } = await supabase.from('user_favorites').insert({
          user_id: userId,
          recipe_id: targetId
        });
        if (error) throw error;
      }

    } catch (e) {
      console.error("Favorite toggle failed", e);
      // Revert
      setIsCollected(!newState);
      alert("收藏失败，请重试");
    }
  };


  const handleIncrementCooked = async () => {
    // 1. Update Local Personal Count
    const newCount = cookedCount + 1;
    setCookedCount(newCount);
    localStorage.setItem(`cooked_count_${recipe.id}`, newCount.toString());

    // 2. Update Global Cooked Count (Invisible to user now, but still recorded)
    try {
      const { incrementCookedCount } = await import('../services/api');
      await incrementCookedCount(recipe.id);
    } catch (e) {
      // 3. Add to cooking_history table
      const userId = await checkLogin(true); // Show error for explicit click
      if (!userId) return;

      await recordCookingHistory(userId);
      alert("已记录到烹饪历史！");
    };

  };

  const handleSaveInsight = async () => {
    // Prevent double submissions
    if (isSavingInsight) return;

    setIsSavingInsight(true);

    const updatedRecipe = { ...currentRecipe, insight: insightText };
    setCurrentRecipe(updatedRecipe); // Optimistic UI update

    try {
      const { updateRecipeInsight } = await import('../services/api');
      await updateRecipeInsight(recipe.id, insightText);
      setIsEditingInsight(false); // Only close on success or after attempt
    } catch (e) {
      console.error("Failed to save insight", e);
      // Maybe show toast here?
    } finally {
      setIsSavingInsight(false);
    }
  };

  const handleSafeBack = async () => {
    // If we are editing, force a save
    if (isEditingInsight) {
      await handleSaveInsight();
    }
    onBack();
  };

  const handleSafeCooking = async () => {
    // If we are editing, force a save
    if (isEditingInsight) {
      await handleSaveInsight();
    }

    // Try to record history silently if logged in
    const userId = await checkLogin(false);
    if (userId) {
      // Increment global count silently
      try {
        const { incrementCookedCount } = await import('../services/api');
        incrementCookedCount(recipe.id);
      } catch (e) { }

      await recordCookingHistory(userId);
    }


    onEnterCooking();
  };

  const isBilibili = recipe.link?.includes('bilibili.com');
  const isXiachufang = recipe.link?.includes('xiachufang.com');

  // Handle Mode Switch to Graphic
  const handleModeSwitch = async () => {
    const newMode = mode === 'video' ? 'graphic' : 'video';
    setMode(newMode);

    if (newMode === 'graphic' && isBilibili && (!currentRecipe.steps || currentRecipe.steps.length === 0)) {
      // Trigger AI Analysis if it's a Bilibili recipe and no steps exist yet
      try {
        setAnalyzing(true);
        // Use the imported analyzeRecipe directly
        const { analyzeRecipe } = await import('../services/api');
        const analysisResult = await analyzeRecipe(recipe.id.replace('bili-', ''));

        // Merge AI result with current recipe
        setCurrentRecipe(prev => ({
          ...prev,
          steps: analysisResult.steps,
          ingredients: analysisResult.ingredients
        }));
      } catch (error) {
        console.error("AI Analysis failed", error);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const nextStep = () => {
    if (currentRecipe.steps && currentStepIndex < currentRecipe.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Touch Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextStep();
    } else if (isRightSwipe) {
      prevStep();
    }
  };

  // Alias for render
  const handleTouchStart = onTouchStart;
  const handleTouchMove = onTouchMove;
  const handleTouchEnd = onTouchEnd;

  // Safe access to current step
  const currentStep = currentRecipe.steps ? currentRecipe.steps[currentStepIndex] : null;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 border-b border-gray-50 bg-white sticky top-0 z-50">
        <button onClick={handleSafeBack} className="p-2 -ml-2">
          <ChevronLeft size={28} className="text-gray-800" />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-800 flex-1 ml-4 line-clamp-1 tracking-tight">{currentRecipe.name}</h2>
        <div className="flex items-center gap-3">

          {/* Cooked Count (Pot) */}
          <button onClick={handleIncrementCooked} className="flex flex-col items-center group active:scale-95 transition-transform" title="记录烹饪次数">
            <div className="relative">
              <CookingPot size={22} className={`${cookedCount > 0 ? 'text-orange-500' : 'text-gray-400'} transition-colors`} />
              {cookedCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white">{cookedCount}</span>}
            </div>
          </button>

          {/* Collect (Star) */}
          <button onClick={handleToggleFavorite} className="active:scale-95 transition-transform" title="收藏到我的菜谱">
            <Star size={24} className={`${isCollected ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
          </button>

          {/* REMOVED: Heart Icon */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {/* Cooking Insight - Editable */}
        <div className="m-5 p-4 bg-orange-50 rounded-2xl border border-orange-100 relative group transition-colors hover:border-orange-200">
          <div className="absolute top-4 left-4 text-orange-400">
            <span className="text-lg">💡</span>
          </div>

          {isEditingInsight ? (
            // Edit Mode
            <div className="ml-7">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-orange-600">编辑心得</h3>
                <button
                  onClick={handleSaveInsight}
                  disabled={isSavingInsight}
                  className="text-green-600 text-xs font-bold px-3 py-1 bg-green-100 rounded-full flex items-center gap-1"
                >
                  {isSavingInsight ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      保存中...
                    </>
                  ) : "保存"}
                </button>
              </div>
              <textarea
                value={insightText}
                onChange={(e) => setInsightText(e.target.value)}
                // Removed onBlur to avoid race conditions with Save button
                className="w-full text-sm text-gray-700 bg-white border border-orange-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[80px]"
                placeholder="写下你的烹饪心得..."
                autoFocus
              />
            </div>
          ) : (
            // View Mode
            <div className="ml-7">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-orange-600">我的烹饪心得</h3>
                <button onClick={() => setIsEditingInsight(true)} className="p-1 rounded-full hover:bg-orange-100 text-gray-400 hover:text-orange-500 transition-colors">
                  <Edit3 size={16} />
                </button>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap min-h-[20px]" onClick={() => setIsEditingInsight(true)}>
                {currentRecipe.insight || '暂无心得，点击编辑添加...'}
              </div>
            </div>
          )}
        </div>

        {/* Media Player Area */}
        <div className={`mb-4 relative group ${(mode === 'video' && isBilibili) ? 'mx-5 rounded-2xl aspect-video bg-black shadow-lg overflow-hidden' : 'w-full'}`}>
          {analyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 gap-4 text-purple-600 z-10 transition-all h-64">
              <Loader2 className="animate-spin" size={48} />
              <div className="text-center">
                <p className="font-bold text-lg">AI 大脑高速运转中...</p>
                <p className="text-xs text-gray-400 mt-1">正在逐帧分析视频内容</p>
              </div>
            </div>
          ) : (mode === 'video' && isBilibili) ? (
            // Bilibili Video Mode
            <div className="w-full h-full relative">
              <iframe
                src={`//player.bilibili.com/player.html?bvid=${currentRecipe.id.replace('bili-', '')}&page=1&high_quality=1&danmaku=0`}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                className="w-full h-full"
                sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
              ></iframe>
            </div>
          ) : (
            // Graphic Mode (Default for Xiachufang)
            <div className="flex flex-col">

              {/* Image Section */}
              <div
                className="w-full bg-gray-50 relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/image?url=${encodeURIComponent((currentStep?.image || currentRecipe.image) || '')}`}
                  className="w-full h-auto object-contain block transition-opacity duration-300"
                  alt="Step Preview"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />

                {/* Swipe hint overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 opacity-0 group-hover:opacity-30 transition-opacity">
                  <ChevronLeft size={32} className="text-gray-400" />
                  <ChevronRight size={32} className="text-gray-400" />
                </div>
              </div>

              {/* Step Navigation Section */}
              <div className="p-5 bg-white border-b border-gray-100 min-h-[150px]">
                {/* Only show steps if we have them */}
                {currentRecipe.steps && currentRecipe.steps.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-md font-bold">STEP {currentStepIndex + 1}</span>
                      <span className="text-xs text-gray-400 font-medium">{currentStepIndex + 1} / {currentRecipe.steps.length}</span>
                    </div>

                    {/* Only show Title if it's MEANINGFUL (longer than 5 chars or doesn't start with "步骤") */}
                    {currentStep?.title && !currentStep.title.startsWith('步骤') && (
                      <h3 className="text-lg font-bold text-gray-800">{currentStep.title}</h3>
                    )}

                    <p className="text-base text-gray-600 leading-relaxed">
                      {currentStep?.description || '暂无步骤详情'}
                    </p>

                    <p className="text-center text-xs text-gray-300 mt-4">左右滑动图片切换步骤</p>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-6 bg-gray-50 rounded-lg text-sm">
                    <p>暂无步骤数据</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ingredient List - Compacted */}
        <div className="px-5">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
              食材清单
              {mode === 'graphic' && isBilibili && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-normal">AI 生成</span>}
            </h3>
            <span className="text-gray-400 text-[10px]">{isXiachufang ? '来源于下厨房' : '根据分析生成'}</span>
          </div>

          <div className="flex gap-6 border-b border-gray-100 mb-3">
            <button className="pb-1.5 border-b-2 border-orange-500 text-orange-500 font-bold text-sm">主料</button>
            <button className="pb-1.5 text-gray-400 font-bold text-sm">辅料 / 调料</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentRecipe.ingredients?.main?.map((ing, idx) => {
              const inStock = stockStatus[ing.name]; // True = Stocked, False = Missing
              const normalizedName = (ing.name || '').trim().toLowerCase();
              const inCart = cartItems.has(normalizedName);

              return (
                <div key={idx} className={`p-2 rounded-lg flex items-center justify-between transition-all bg-gray-50 border border-transparent hover:border-orange-200`}>
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-1 h-6 bg-orange-200 rounded-full flex-shrink-0"></div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-gray-800 text-xs truncate">{ing.name}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 truncate">{ing.amount || '适量'}</div>
                      {!inStock && (
                        <div className="text-red-500 text-[10px] mt-0.5 font-medium flex items-center gap-1">
                          <span>⚠️ 家中暂缺</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shopping Cart Button */}
                  <button
                    onClick={() => handleAddToCart(ing.name)}
                    className={`p-2 rounded-full transition-colors ${inCart ? 'text-gray-300 cursor-default' : 'text-orange-500 hover:bg-orange-100'}`}
                    disabled={inCart}
                    title={inCart ? "已在购物车" : "加入购物车"}
                  >
                    <ShoppingCart size={16} className={inCart ? 'opacity-50' : ''} />
                  </button>
                </div>
              )
            })}

            {(!currentRecipe.ingredients?.main || currentRecipe.ingredients.main.length === 0) && (
              <div className="col-span-2 text-center py-4 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs">
                {analyzing ? '正在识别食材...' : '未识别到主料信息'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="absolute bottom-6 left-0 right-0 px-10 pointer-events-none">
        <button
          onClick={handleSafeCooking}
          className="w-full bg-blue-50 text-blue-600 font-extrabold py-4 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-blue-100 border border-blue-100 pointer-events-auto active:scale-95 transition-all"
        >
          <CookingPot size={24} />
          进入烹饪模式
        </button>
      </div>
    </div>
  );
};

export default RecipeDetail;
