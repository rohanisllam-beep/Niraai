import React from 'react';
import { Palette, Check } from 'lucide-react';

export type LiquidThemeId = 'pearl' | 'aqua' | 'lavender' | 'crystal';

export interface LiquidThemeConfig {
  id: LiquidThemeId;
  name: string;
  tagline: string;
  gradientBg: string;
  orb1: string;
  orb2: string;
  orb3: string;
  accentGradient: string;
  badgeBorder: string;
}

export const LIQUID_THEMES: Record<LiquidThemeId, LiquidThemeConfig> = {
  pearl: {
    id: 'pearl',
    name: 'Pearl Luminescence',
    tagline: 'Bright pearl, soft icy blue & subtle lavender blend',
    gradientBg: 'linear-gradient(135deg, #f8fafc 0%, #f0f7ff 35%, #ecfdf5 70%, #faf5ff 100%)',
    orb1: 'radial-gradient(circle, rgba(186, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.2) 50%, transparent 75%)',
    orb2: 'radial-gradient(circle, rgba(233, 213, 255, 0.4) 0%, rgba(243, 232, 255, 0.15) 50%, transparent 75%)',
    orb3: 'radial-gradient(circle, rgba(204, 251, 241, 0.45) 0%, rgba(240, 253, 250, 0.15) 50%, transparent 80%)',
    accentGradient: 'from-sky-500 via-indigo-500 to-teal-500',
    badgeBorder: 'border-sky-200/80',
  },
  aqua: {
    id: 'aqua',
    name: 'Aqua Marine Flow',
    tagline: 'Refreshing cyan, oceanic frost & translucent pearl',
    gradientBg: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 40%, #f0fdf4 75%, #f8fafc 100%)',
    orb1: 'radial-gradient(circle, rgba(153, 246, 228, 0.5) 0%, rgba(204, 251, 241, 0.2) 50%, transparent 75%)',
    orb2: 'radial-gradient(circle, rgba(186, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.2) 50%, transparent 75%)',
    orb3: 'radial-gradient(circle, rgba(167, 243, 208, 0.4) 0%, rgba(209, 250, 229, 0.15) 50%, transparent 80%)',
    accentGradient: 'from-teal-500 via-cyan-500 to-sky-500',
    badgeBorder: 'border-teal-200/80',
  },
  lavender: {
    id: 'lavender',
    name: 'Celestial Lavender',
    tagline: 'Dreamy soft lilac, icy mist & rose quartz drops',
    gradientBg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 35%, #eff6ff 70%, #fff1f2 100%)',
    orb1: 'radial-gradient(circle, rgba(233, 213, 255, 0.5) 0%, rgba(243, 232, 255, 0.2) 50%, transparent 75%)',
    orb2: 'radial-gradient(circle, rgba(254, 205, 211, 0.4) 0%, rgba(255, 228, 230, 0.15) 50%, transparent 75%)',
    orb3: 'radial-gradient(circle, rgba(199, 210, 254, 0.45) 0%, rgba(224, 231, 255, 0.15) 50%, transparent 80%)',
    accentGradient: 'from-purple-500 via-fuchsia-500 to-indigo-500',
    badgeBorder: 'border-purple-200/80',
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal Prism',
    tagline: 'High-clarity diamond glass with prismatic highlights',
    gradientBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 40%, #e2e8f0 75%, #f8fafc 100%)',
    orb1: 'radial-gradient(circle, rgba(224, 231, 255, 0.45) 0%, rgba(241, 245, 249, 0.2) 50%, transparent 75%)',
    orb2: 'radial-gradient(circle, rgba(207, 250, 254, 0.45) 0%, rgba(224, 242, 254, 0.2) 50%, transparent 75%)',
    orb3: 'radial-gradient(circle, rgba(243, 232, 255, 0.45) 0%, rgba(250, 245, 255, 0.15) 50%, transparent 80%)',
    accentGradient: 'from-slate-700 via-sky-600 to-indigo-600',
    badgeBorder: 'border-slate-300/80',
  },
};

interface LiquidThemeSwitcherProps {
  currentTheme: LiquidThemeId;
  onSelectTheme: (theme: LiquidThemeId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LiquidThemeSwitcher: React.FC<LiquidThemeSwitcherProps> = ({
  currentTheme,
  onSelectTheme,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass liquid-glass-glow border border-white/90 shadow-2xl p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-sky-100/60">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Select Liquid Glass Interface Theme
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 p-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          All themes retain NIRA&apos;s soft, bright, transparent pearl liquid atmosphere.
        </p>

        <div className="space-y-2.5">
          {(Object.values(LIQUID_THEMES) as LiquidThemeConfig[]).map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center justify-between group ${
                  isSelected
                    ? 'bg-white/90 border-sky-400 shadow-md ring-2 ring-sky-300/40'
                    : 'bg-white/50 border-white/80 hover:bg-white/80 hover:border-sky-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {theme.tagline}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-sky-500 border-sky-600 text-white'
                      : 'border-slate-300 group-hover:border-sky-400'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-sky-100/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-medium hover:bg-slate-900 transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
