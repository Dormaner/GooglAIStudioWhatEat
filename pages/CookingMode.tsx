
import React, { useState } from 'react';
import { X, Mic, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Recipe, ViewMode } from '../types';

interface CookingModeProps {
  recipe: Recipe;
  mode: ViewMode;
  onExit: () => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, mode, onExit }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = recipe.steps[currentStepIdx] || recipe.steps[0];

  const nextStep = () => {
    if (currentStepIdx < recipe.steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-[100] flex flex-col max-w-md mx-auto h-screen overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentStep.image} 
          className="w-full h-full object-cover opacity-30 scale-105" 
          alt="Cooking Backdrop"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/20 to-black/90"></div>
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
            {mode === 'video' ? '视频模式' : '图文模式'}
          </div>
          <h2 className="text-xl font-bold truncate tracking-tight">{recipe.name}{mode === 'graphic' ? '：正在烹饪' : ''}</h2>
        </div>
        <button 
          onClick={onExit} 
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 relative z-10 flex flex-col">
        {mode === 'video' ? (
          /* VIDEO MODE UI */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer">
              <Play size={48} fill="white" className="ml-2 text-white" />
            </div>
            
            {/* Steps Progress Pills (Mini) */}
            <div className="mt-12 flex gap-1.5 overflow-x-auto hide-scrollbar max-w-full px-4">
               {recipe.steps.map((_, i) => (
                 <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStepIdx ? 'w-8 bg-orange-500' : 'w-4 bg-white/20'}`}></div>
               ))}
            </div>
          </div>
        ) : (
          /* GRAPHIC MODE UI */
          <div className="flex-1 flex flex-col px-6 pt-2">
            {/* Manual Navigation */}
            <div className="absolute top-[40%] left-0 right-0 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-30">
              <button 
                onClick={prevStep}
                disabled={currentStepIdx === 0}
                className={`w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all ${currentStepIdx === 0 ? 'opacity-0' : 'opacity-100'}`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextStep}
                disabled={currentStepIdx === recipe.steps.length - 1}
                className={`w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all ${currentStepIdx === recipe.steps.length - 1 ? 'opacity-0' : 'opacity-100'}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Instruction Card with Image */}
            <div className="mt-auto mb-10 overflow-hidden">
               <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="w-full aspect-[16/10] overflow-hidden">
                    <img src={currentStep.image} className="w-full h-full object-cover" alt="Step illustration" />
                  </div>
                  <div className="p-6">
                    <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1 block">步骤 {currentStepIdx + 1} / {recipe.steps.length}</span>
                    <h3 className="text-2xl font-black mb-2 tracking-tight leading-tight">{currentStep.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed font-medium line-clamp-4">
                      {currentStep.description}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Voice Command Area (Shared but slightly different hints) */}
        <div className="mt-auto flex flex-col items-center gap-4 pb-12">
          {/* Command Pills */}
          <div className="flex justify-center gap-2">
            {mode === 'video' ? (
              <>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"播放"</span>
                </div>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"快进"</span>
                </div>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"后退"</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"下一步"</span>
                </div>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"上一步"</span>
                </div>
                <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1 border border-white/5">
                  <span className="text-gray-400">喊</span>
                  <span className="text-orange-400 font-bold">"退出"</span>
                </div>
              </>
            )}
          </div>

          {/* Pulsing Microphone */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-10 group-hover:opacity-30 transition-opacity animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-0.5 shadow-xl shadow-orange-500/30">
                <div className="w-full h-full rounded-full bg-orange-500 flex items-center justify-center border-2 border-white/10 animate-pulse">
                  <Mic size={28} className="text-white" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.2em] text-white/80 animate-pulse uppercase">正在聆听...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Step Timeline at the very bottom */}
      <div className="relative z-10 px-6 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent pt-8">
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-all duration-700 ease-out" 
            style={{ width: `${((currentStepIdx + 1) / recipe.steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[9px] font-black tracking-widest text-gray-600 uppercase">
          {recipe.steps.map((step, idx) => (
            <span 
              key={idx} 
              onClick={() => setCurrentStepIdx(idx)}
              className={`transition-all duration-300 cursor-pointer ${idx === currentStepIdx ? 'text-orange-500 scale-110' : 'hover:text-white'}`}
            >
              {step.title.split('：')[0].slice(0, 4)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
