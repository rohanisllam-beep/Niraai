import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { LIVING_CONCEPTS, LivingConceptId } from '../types/livingConcepts';
import { useLivingConcept } from '../context/LivingConceptContext';
import { LivingAiPresence } from './LivingAiPresence';

export const LivingConceptSelectorModal: React.FC = () => {
  const { concept, setConcept, isSelectorOpen, setIsSelectorOpen } = useLivingConcept();

  if (!isSelectorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 backdrop-blur-xl animate-fadeIn select-none">
      {/* Liquid Glass Modal Card */}
      <div className="relative w-full max-w-lg rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-3xl border border-white/90 shadow-[0_24px_70px_rgba(0,0,0,0.16),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Soft Ambient Aurora Aura */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-cyan-200/25 via-violet-100/10 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200/80 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Living AI Presence Concepts
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Choose 1 of 6 real-time animated concepts for Nira
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSelectorOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Concepts List */}
        <div className="relative z-10 p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {LIVING_CONCEPTS.map((c) => {
            const isSelected = concept === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setConcept(c.id)}
                className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3.5 border relative group ${
                  isSelected
                    ? 'bg-cyan-50/60 border-cyan-300/90 shadow-xs'
                    : 'bg-white/60 hover:bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                {/* Live Miniature Aurora Preview */}
                <div className="w-12 h-12 rounded-2xl bg-white/95 border border-slate-100 shadow-2xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LivingAiPresence
                    concept={c.id}
                    state={isSelected ? 'speaking' : 'idle'}
                    size={42}
                  />
                </div>

                {/* Concept Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {c.name}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[9px] font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    {c.tagline}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                {/* Radio Checkmark */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-cyan-600 text-white'
                      : 'border border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="relative z-10 px-5 py-3 border-t border-slate-100/80 bg-slate-50/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">
            Applies to Header, Chat, and Call screens
          </span>
          <button
            onClick={() => setIsSelectorOpen(false)}
            className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
