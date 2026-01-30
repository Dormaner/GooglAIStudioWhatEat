import React, { useState, useCallback } from 'react';
import { AppTab, Recipe, ViewMode } from './types';
import WhatToEat from './pages/WhatToEat';
import WhatIsAvailable from './pages/WhatIsAvailable';
import RecipeDetail from './pages/RecipeDetail';
import CookingMode from './pages/CookingMode';
import Navbar from './components/Navbar';
import { BackHandlerProvider, useBackHandler } from './contexts/BackHandlerContext';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('what-to-eat');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [isCooking, setIsCooking] = useState(false);

  // Native Back Button Handling (Prioritized Overlays)
  useBackHandler(() => {
    // 1. Cooking Mode (Top Priority)
    if (isCooking) {
      setIsCooking(false);
      return true;
    }

    // 2. Recipe Detail (Second Priority)
    if (selectedRecipe) {
      setSelectedRecipe(null);
      return true;
    }

    // Default: Not handled by global overlays
    return false;
  }, [isCooking, selectedRecipe]);

  const handleRecipeClick = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setViewMode('video');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  const enterCookingMode = useCallback(() => {
    setIsCooking(true);
  }, []);

  const exitCookingMode = useCallback(() => {
    setIsCooking(false);
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      <div className="flex-1 overflow-y-auto pb-20 hide-scrollbar scroll-smooth">
        {/* Main Tab Views - Keep mounted but hidden when detail is open */}
        <div className={selectedRecipe ? 'hidden' : 'block h-full'}>
          {activeTab === 'what-to-eat' && <WhatToEat onRecipeClick={handleRecipeClick} />}
          {/* Always keep WhatIsAvailable mounted to preserve state */}
          <div className={activeTab === 'what-is-available' ? 'block' : 'hidden'}>
            <WhatIsAvailable onRecipeClick={handleRecipeClick} />
          </div>
          {activeTab === 'me' && (
            <div className="p-8 text-center text-gray-500">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">我的</h1>
              <p>个人中心页面开发中...</p>
            </div>
          )}
        </div>

        {/* Recipe Detail View - Overlays the main content */}
        {selectedRecipe && !isCooking && (
          <div className="absolute inset-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <RecipeDetail
              recipe={selectedRecipe}
              mode={viewMode}
              setMode={setViewMode}
              onBack={handleBack}
              onEnterCooking={enterCookingMode}
            />
          </div>
        )}

        {/* Cooking Mode - Full screen overlay */}
        {isCooking && selectedRecipe && (
          <div className="absolute inset-0 bg-white z-50 animate-in fade-in duration-300">
            <CookingMode
              recipe={selectedRecipe}
              mode={viewMode}
              onExit={exitCookingMode}
            />
          </div>
        )}
      </div>

      {!selectedRecipe && !isCooking && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BackHandlerProvider>
      <AppContent />
    </BackHandlerProvider>
  );
};

export default App;
