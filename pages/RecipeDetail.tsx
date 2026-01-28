
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Heart, Star, Edit3, ShoppingCart, CookingPot, ChevronRight, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Recipe, ViewMode } from '../types';
import { analyzeRecipe } from '../services/api';

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

  // When props recipe changes, update state
  useEffect(() => {
    setCurrentRecipe(recipe);
  }, [recipe]);

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
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-50 bg-white sticky top-0 z-50">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft size={28} className="text-gray-800" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex-1 ml-4 line-clamp-1">{currentRecipe.name}</h2>
        <div className="flex items-center gap-2">
          {/* Only show "Video Mode" toggle if it IS a Bilibili video. For Xiachufang, we default to graphic. */}
          {isBilibili && (
            <button
              onClick={handleModeSwitch}
              className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 transition-all ${mode === 'graphic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}
            >
              {mode === 'video' ? '智能图文' : '返回视频'}
              {mode === 'video' && <Sparkles size={14} />}
            </button>
          )}
          {/* If Xiachufang, show explicit "Source" button */}
          {isXiachufang && (
            <a
              href={currentRecipe.link}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold flex items-center gap-1"
            >
              <ExternalLink size={12} /> 原网页
            </a>
          )}
          <Heart size={24} className="text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {/* Cooking Insight */}
        {currentRecipe.insight && (
          <div className="m-5 p-4 bg-orange-50 rounded-2xl border border-orange-100 relative">
            <div className="absolute top-4 left-4 text-orange-400">
              <span className="text-lg">💡</span>
            </div>
            <div className="flex justify-between items-start mb-2 ml-7">
              <h3 className="font-bold text-orange-600">我的烹饪心得</h3>
              <Edit3 size={16} className="text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed ml-7">{currentRecipe.insight}</p>
          </div>
        )}

        {/* Media Player Area - Enlarged and No Cropping for Graphic Mode */}
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

              {/* Image Section - Full Width, Natural Aspect Ratio with Swipe Support */}
              <div
                className="w-full bg-gray-50 relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={`http://localhost:3001/api/image?url=${encodeURIComponent((currentStep?.image || currentRecipe.image) || '')}`}
                  className="w-full h-auto object-contain block transition-opacity duration-300"
                  alt="Step Preview"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />

                {/* Swipe hint overlay (fades out) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 opacity-0 group-hover:opacity-30 transition-opacity">
                  <ChevronLeft size={32} className="text-gray-400" />
                  <ChevronRight size={32} className="text-gray-400" />
                </div>
              </div>

              {/* Step Navigation Section - MOVED BELOW IMAGE, Buttonless */}
              <div className="p-5 bg-white border-b border-gray-100 min-h-[150px]">
                {/* Only show steps if we have them */}
                {currentRecipe.steps && currentRecipe.steps.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-md font-bold">STEP {currentStepIndex + 1}</span>
                      <span className="text-xs text-gray-400 font-medium">{currentStepIndex + 1} / {currentRecipe.steps.length}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800">{currentStep?.title || '准备开始'}</h3>
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
            {currentRecipe.ingredients?.main?.map((ing, idx) => (
              <div key={idx} className={`p-2 rounded-lg flex items-center justify-between transition-all bg-gray-50 border border-transparent hover:border-orange-200`}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-1 h-6 bg-orange-200 rounded-full flex-shrink-0"></div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-gray-800 text-xs truncate">{ing.name}</div>
                    <div className="text-gray-400 text-[10px] mt-0.5 truncate">{ing.amount || '适量'}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Show message if no ingredients found */}
            {(!currentRecipe.ingredients?.main || currentRecipe.ingredients.main.length === 0) && (
              <div className="col-span-2 text-center py-4 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs">
                {analyzing ? '正在识别食材...' : '未识别到主料信息'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button - Only for Video/Bilibili recipes or if we want users to cook along */}
      <div className="absolute bottom-6 left-0 right-0 px-10 pointer-events-none">
        <button
          onClick={onEnterCooking}
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
