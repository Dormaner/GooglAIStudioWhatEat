
import React, { useState, useCallback } from 'react';
import { AppTab, Recipe, ViewMode } from './types';
import WhatToEat from './pages/WhatToEat';
import WhatIsAvailable from './pages/WhatIsAvailable';
import RecipeDetail from './pages/RecipeDetail';
import CookingMode from './pages/CookingMode';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('what-to-eat');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [isCooking, setIsCooking] = useState(false);

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

  if (isCooking && selectedRecipe) {
    return (
      <CookingMode 
        recipe={selectedRecipe} 
        mode={viewMode} 
        onExit={exitCookingMode} 
      />
    );
  }

  if (selectedRecipe) {
    return (
      <RecipeDetail 
        recipe={selectedRecipe} 
        mode={viewMode} 
        setMode={setViewMode} 
        onBack={handleBack} 
        onEnterCooking={enterCookingMode}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white overflow-hidden shadow-2xl relative">
      <div className="flex-1 overflow-y-auto pb-20 hide-scrollbar">
        {activeTab === 'what-to-eat' && <WhatToEat onRecipeClick={handleRecipeClick} />}
        {activeTab === 'what-is-available' && <WhatIsAvailable onRecipeClick={handleRecipeClick} />}
        {activeTab === 'me' && (
          <div className="p-8 text-center text-gray-500">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">我的</h1>
            <p>个人中心页面开发中...</p>
          </div>
        )}
      </div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
