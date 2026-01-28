
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

      {/* 1. TOP PROGRESS BAR (Fixed at very top) */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-safe-top">
        <div className="h-1 w-full bg-white/20">
          <div
            className="h-full bg-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${((currentStepIdx + 1) / recipe.steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={`http://localhost:3001/api/image?url=${encodeURIComponent(currentStep.image || recipe.image)}`}
          className="w-full h-full object-cover opacity-10 blur-xl scale-110"
          alt="Backdrop"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"></div>
      </div>

      {/* 2. ABSOLUTE CENTERED IMAGE (Zero Shake, Full Width, Safe 50vh Height) */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 w-full flex items-center justify-center pointer-events-none">
        {/* Image Container - No Aspect Ratio Lock, just Full Width */}
        <div className="relative w-full shadow-2xl">
          <img
            src={`http://localhost:3001/api/image?url=${encodeURIComponent(currentStep.image || recipe.image)}`}
            className="w-full h-auto object-cover max-h-[50vh] mx-auto bg-black/20"
            alt="Step illustration"
            referrerPolicy="no-referrer"
          />

          {/* Step Badge (Floating) */}
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur pointer-events-none px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 shadow-sm z-20">
            STEP {currentStepIdx + 1}
          </div>
        </div>

        {/* Navigation Zones (Overlay entire screen center area) */}
        <div className="absolute inset-y-[-20vh] left-0 right-0 flex z-30 pointer-events-auto h-[140%]">
          <div className="flex-1 bg-transparent active:bg-white/5 transition-colors" onClick={prevStep}></div>
          <div className="flex-1 bg-transparent active:bg-white/5 transition-colors" onClick={nextStep}></div>
        </div>
      </div>

      {/* 3. INSIGHT (Absolute Top, anchored above image center line) */}
      {/* Image Top is at 25% (50 - 25). Insight ends at 24%. Safe. */}
      <div className="absolute bottom-[76%] left-0 right-0 z-20 px-4 pb-0 flex flex-col justify-end items-center pointer-events-none">
        {recipe.insight && (
          <div className="bg-orange-500/10 border border-orange-500/20 backdrop-blur-md px-4 py-2 rounded-xl max-w-[95%] animate-fade-in shadow-lg mb-1">
            <p className="text-orange-300 text-xs font-bold line-clamp-2 text-center">
              💡 {recipe.insight}
            </p>
          </div>
        )}
      </div>

      {/* 4. DESCRIPTION (Absolute Bottom, anchored below image center line) */}
      {/* Image Bottom is at 75% (50 + 25). Description starts at 76%. Safe. */}
      <div className="absolute top-[76%] left-0 right-0 z-20 px-6 pt-0 flex flex-col items-center pointer-events-none">
        <h3 className="text-xl font-bold mb-2 text-white tracking-tight text-center leading-tight drop-shadow-md">{currentStep.title}</h3>
        <div className="w-full max-h-[20vh] overflow-y-auto no-scrollbar pointer-events-auto">
          <p className="text-gray-200 text-sm leading-relaxed font-medium text-center drop-shadow-sm">
            {currentStep.description}
          </p>
        </div>
      </div>

      {/* Bottom Controls (Mic Only) */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-end pointer-events-none">
        {/* Close Button (Floating Top Right originally, moving here or keep top right? 
             User didn't specify Close btn loc, but said "Only mic button at bottom". 
             I'll put close button back at Top Right fixed.
          ) */}

        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <div className="relative group cursor-pointer active:scale-95 transition-transform" onClick={() => { /* Toggle voice? */ }}>
            <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-2 border-white/20 shadow-xl">
              <Mic size={24} className="text-white" />
            </div>
          </div>
          <span className="text-[10px] text-white/40 font-medium tracking-wider uppercase">语音控制中</span>
        </div>
      </div>

      {/* Close Button Fixed Top Right */}
      <button
        onClick={onExit}
        className="absolute top-6 right-4 z-40 w-8 h-8 bg-black/40 text-white/70 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
      >
        <X size={18} />
      </button>

    </div>
  );
};

export default CookingMode;
