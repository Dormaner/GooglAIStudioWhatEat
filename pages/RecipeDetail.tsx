import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Heart, Star, Edit3, ShoppingCart, CookingPot, ChevronRight, Loader2, Sparkles } from 'lucide-react';
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

  // Handle Mode Switch to Graphic
  const handleModeSwitch = async () => {
    const newMode = mode === 'video' ? 'graphic' : 'video';
    setMode(newMode);

    if (newMode === 'graphic' && recipe.id.startsWith('bili-') && (!currentRecipe.steps || currentRecipe.steps.length === 0)) {
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
          <button
            onClick={handleModeSwitch}
            className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 transition-all ${mode === 'graphic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}`}
          >
            {mode === 'video' ? '智能图文' : '返回视频'}
            {mode === 'video' && <Sparkles size={14} />}
          </button>
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

        {/* Media Player Area */}
        <div className="mx-5 mb-8 rounded-2xl overflow-hidden aspect-video relative group bg-black shadow-lg">
          {analyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 gap-4 text-purple-600 z-10 transition-all">
              <Loader2 className="animate-spin" size={48} />
              <div className="text-center">
                <p className="font-bold text-lg">AI 大脑高速运转中...</p>
                <p className="text-xs text-gray-400 mt-1">正在逐帧分析视频内容</p>
              </div>
            </div>
          ) : mode === 'video' ? (
            // Video Mode
            currentRecipe.link && currentRecipe.link.includes('bilibili.com') ? (
              <iframe
                src={`//player.bilibili.com/player.html?bvid=${currentRecipe.id.replace('bili-', '')}&page=1&high_quality=1&danmaku=0`}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                className="w-full h-full"
                sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
              ></iframe>
            ) : (
              // Fallback for non-bilibili videos (local)
              <>
                <img
                  src={currentRecipe.image}
                  className="w-full h-full object-cover opacity-80"
                  alt="Preview"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 cursor-pointer">
                    <Play size={32} fill="white" className="text-white ml-1" />
                  </div>
                </div>
              </>
            )
          ) : (
            // Graphic Mode
            <div className="relative w-full h-full">
              <img
                src={currentStep?.image || currentRecipe.image}
                className="w-full h-full object-cover"
                alt="Step Preview"
                referrerPolicy="no-referrer"
              />
              {/* Step Navigation Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6">
                <div className="text-white mb-4">
                  <span className="bg-purple-500 text-xs px-2 py-1 rounded-md font-bold mr-2">STEP {currentStepIndex + 1}</span>
                  <h3 className="text-lg font-bold inline shadow-black drop-shadow-md">{currentStep?.title || '准备开始'}</h3>
                  <p className="text-sm text-gray-200 mt-2 leading-relaxed h-12 line-clamp-2">
                    {currentStep?.description || 'AI 分析未返回步骤详情'}
                  </p>
                </div>

                <div className="flex items-center justify-between w-full text-white font-medium gap-4">
                  <button
                    onClick={prevStep}
                    disabled={currentStepIndex === 0}
                    className={`bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all ${currentStepIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ChevronLeft />
                  </button>
                  <div className="bg-black/40 px-4 py-1.5 rounded-full text-xs backdrop-blur-sm border border-white/10">
                    {currentStepIndex + 1} / {String(currentRecipe.steps?.length || 1)}
                  </div>
                  <button
                    onClick={nextStep}
                    disabled={!currentRecipe.steps || currentStepIndex === (currentRecipe.steps.length - 1)}
                    className={`bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all ${(!currentRecipe.steps || currentStepIndex === (currentRecipe.steps.length - 1)) ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ingredient List */}
        <div className="px-5">
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              食材清单
              {mode === 'graphic' && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-normal">AI 生成</span>}
            </h3>
            <span className="text-gray-400 text-xs">根据 AI 分析结果展示</span>
          </div>

          <div className="flex gap-8 border-b border-gray-100 mb-6">
            <button className="pb-3 border-b-4 border-orange-500 text-orange-500 font-bold">主料</button>
            <button className="pb-3 text-gray-400 font-bold">辅料 / 调料</button>
          </div>

          <div className="space-y-4">
            {currentRecipe.ingredients?.main?.map((ing, idx) => (
              <div key={idx} className={`p-4 rounded-xl flex items-center justify-between transition-all bg-gray-50 border border-transparent hover:border-orange-200`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-orange-200 rounded-full"></div>
                  <div>
                    <div className="font-bold text-gray-800 text-base">{ing.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">需要: {ing.amount || '适量'}</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-300">
                  <ShoppingCart size={14} />
                </div>
              </div>
            ))}

            {/* Show message if no ingredients found */}
            {(!currentRecipe.ingredients?.main || currentRecipe.ingredients.main.length === 0) && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                {analyzing ? '正在识别食材...' : '未识别到主料信息'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      {mode === 'video' && (
        <div className="absolute bottom-6 left-0 right-0 px-10 pointer-events-none">
          <button
            onClick={onEnterCooking}
            className="w-full bg-blue-50 text-blue-600 font-extrabold py-4 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-blue-100 border border-blue-100 pointer-events-auto active:scale-95 transition-all"
          >
            <CookingPot size={24} />
            进入烹饪模式
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
