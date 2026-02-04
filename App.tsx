import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppTab, Recipe, ViewMode } from './types';
import WhatToEat from './pages/WhatToEat';
import WhatIsAvailable from './pages/WhatIsAvailable';
import RecipeDetail from './pages/RecipeDetail';
import CookingMode from './pages/CookingMode';
import Navbar from './components/Navbar';
import Me from './pages/Me';
import { BackHandlerProvider, useBackHandler } from './contexts/BackHandlerContext';
import ParsingProgressIndicator from './components/ParsingProgressIndicator';
import ParsingCompleteToast from './components/ParsingCompleteToast';
import { parseRecipeFromUrl } from './services/api';
import { supabase } from './config/supabase';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('what-to-eat');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [isCooking, setIsCooking] = useState(false);

  // Global Parsing State - Support multiple tasks
  const [parsingTasks, setParsingTasks] = useState<Array<{
    id: string;
    url: string;
    status: 'parsing' | 'success' | 'error';
    progress: string;
    result?: any;
    error?: string;
    progressPercent?: number;
    estimatedTimeLeft?: string;
  }>>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Progress Simulation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setParsingTasks(prevTasks => {
        if (!prevTasks.some(t => t.status === 'parsing')) return prevTasks;

        return prevTasks.map(task => {
          if (task.status !== 'parsing') return task;

          // Simulate progress up to 90%
          const currentPercent = task.progressPercent || 0;
          if (currentPercent >= 90) return task;

          const increment = Math.random() * 2; // Random increment
          const newPercent = Math.min(90, currentPercent + increment);
          const timeLeft = Math.max(0, 60 - Math.floor(newPercent * 0.6)); // Estimate

          return {
            ...task,
            progressPercent: newPercent,
            estimatedTimeLeft: `${timeLeft}秒`
          };
        });
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const startParsingTask = useCallback(async (url: string) => {
    const taskId = `task_${Date.now()}`;

    // 1. Add Task
    setParsingTasks(prev => [...prev, {
      id: taskId,
      url,
      status: 'parsing',
      progress: '正在初始化...',
      progressPercent: 0,
      estimatedTimeLeft: '60秒'
    }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'default-user';

      // 2. Start API
      const result = await parseRecipeFromUrl(url, userId);

      // 3. Success
      setParsingTasks(prev => prev.map(t =>
        t.id === taskId ? {
          ...t,
          status: 'success',
          progress: '完成',
          progressPercent: 100,
          result: result,
          estimatedTimeLeft: undefined
        } : t
      ));

    } catch (error: any) {
      // 4. Error
      console.error("Parsing failed", error);
      setParsingTasks(prev => prev.map(t =>
        t.id === taskId ? {
          ...t,
          status: 'error',
          progress: '失败',
          error: error.message || 'Unknown error',
          progressPercent: 0
        } : t
      ));
    }
  }, []);

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

    // Smart Mode Selection:
    // - If recipe has steps (graphic content), default to 'graphic' mode
    // - Otherwise (video-only), default to 'video' mode
    const hasSteps = recipe.steps && recipe.steps.length > 0;
    setViewMode(hasSteps ? 'graphic' : 'video');
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
          <div className={activeTab === 'what-to-eat' ? 'block h-full' : 'hidden'}>
            <WhatToEat
              onRecipeClick={handleRecipeClick}
              parsingTasks={parsingTasks}
              setParsingTasks={setParsingTasks}
              editingTaskId={editingTaskId}
              setEditingTaskId={setEditingTaskId}
              startParsingTask={startParsingTask}
            />
          </div>
          {/* Always keep WhatIsAvailable mounted to preserve state */}
          <div className={activeTab === 'what-is-available' ? 'block' : 'hidden'}>
            <WhatIsAvailable
              onRecipeClick={handleRecipeClick}
              parsingTasks={parsingTasks}
              setParsingTasks={setParsingTasks}
              editingTaskId={editingTaskId}
              setEditingTaskId={setEditingTaskId}
              startParsingTask={startParsingTask}
            />
          </div>
          {activeTab === 'me' && <Me onRecipeClick={handleRecipeClick} />}

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
