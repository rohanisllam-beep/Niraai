import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X, Check, Sparkles, SlidersHorizontal, ArrowUp } from 'lucide-react';

export type ChatboxDesignId =
  | 'aura-capsule'
  | 'crystalline-horizon'
  | 'fluid-minimalist'
  | 'aero-curvature'
  | 'prismatic-gem';

export interface ChatboxProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAttachClick: () => void;
  attachedImage: { previewUrl: string; mimeType?: string } | null;
  onRemoveImage: () => void;
  isStreaming: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  className?: string;
}

export interface DesignMeta {
  id: ChatboxDesignId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
}

export const CHATBOX_DESIGNS: DesignMeta[] = [
  {
    id: 'aura-capsule',
    name: 'Aura Capsule',
    badge: 'Design 1 • Dynamic Island',
    tagline: 'Continuous curvature fluid pill',
    description: 'Ultra-smooth rounded capsule with pure crystalline frosted glass, inset silver rim reflection, and integrated floating action nodes.',
  },
  {
    id: 'crystalline-horizon',
    name: 'Crystalline Horizon',
    badge: 'Design 2 • Prismatic Split-Deck',
    tagline: 'Contoured dual-tier glass shelf',
    description: 'Elevated multi-layer liquid glass with an upper context rail and a recessed, soft-glow typing deck for precise mobile thumb reach.',
  },
  {
    id: 'fluid-minimalist',
    name: 'Fluid Minimalist',
    badge: 'Design 3 • Monolithic Glass Dock',
    tagline: 'Cupertino architectural minimalism',
    description: 'Edge-to-edge crystalline sheen with subtle caustic light diffusion, flush haptic controls, and a luminous focus ring.',
  },
  {
    id: 'aero-curvature',
    name: 'Aero-Curvature',
    badge: 'Design 4 • Ergonomic Thumb Arc',
    tagline: 'Engineered for one-handed mobile reach',
    description: 'Asymmetric curvature tailored to natural thumb arcs, with an elevated quick-trigger send button and floating attachment badge.',
  },
  {
    id: 'prismatic-gem',
    name: 'Prismatic Gem',
    badge: 'Design 5 • Diamond Bevel Glass',
    tagline: 'Sculpted optical crystal with specular rims',
    description: 'High-refraction silica glass featuring diamond-cut chamfered edges, delicate prismatic dispersion, and polished jewel controls.',
  },
];

/* =========================================================================
   DESIGN 1: AURA CAPSULE (iOS 27 Dynamic Island Fluid Pill)
   - Continuous pill silhouette (rounded-full)
   - High-translucency luminous frosted glass
   - Inline circular action nodes
   ========================================================================= */
export const DesignAuraCapsule: React.FC<ChatboxProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  inputRef,
  placeholder = 'Kivabe shahajjo korte pari, bondhu?',
  className = '',
}) => {
  const canSend = (Boolean(inputPrompt.trim()) || Boolean(attachedImage)) && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Attached Image Pill */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-lg animate-in fade-in duration-200">
          <img
            src={attachedImage.previewUrl}
            alt="Survey screenshot"
            className="w-7 h-7 object-cover rounded-full border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-800">Screenshot Attached</span>
          <button
            onClick={onRemoveImage}
            className="p-1 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Liquid Capsule */}
      <div className="relative rounded-full p-1.5 sm:p-2 bg-white/85 backdrop-blur-3xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.18),0_1px_1px_rgba(255,255,255,0.95)_inset] transition-all duration-300 focus-within:shadow-[0_22px_55px_rgba(0,0,0,0.22),0_0_0_1px_rgba(244,63,94,0.4)]">
        {/* Specular top rim highlight */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        <div className="flex items-center gap-1.5 sm:gap-2 px-1">
          {/* Attach Button */}
          <button
            type="button"
            onClick={onAttachClick}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 ${
              attachedImage
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 hover:text-slate-900'
            }`}
            title="Attach survey screenshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Typing Area */}
          <textarea
            ref={inputRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 px-2 py-2.5 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px] leading-relaxed"
          />

          {/* Fluid Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(225,29,72,0.35)] active:scale-90 hover:brightness-105"
            title="Send"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   DESIGN 2: CRYSTALLINE HORIZON (iOS 27 Prismatic Split-Deck)
   - Dual-tier structured glass shelf (rounded-[28px])
   - Subtle utility rail above recessed typing area
   ========================================================================= */
export const DesignCrystallineHorizon: React.FC<ChatboxProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  inputRef,
  placeholder = 'Kivabe shahajjo korte pari, bondhu?',
  className = '',
}) => {
  const canSend = (Boolean(inputPrompt.trim()) || Boolean(attachedImage)) && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Attached Image Pill */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white shadow-md animate-in fade-in duration-200">
          <img
            src={attachedImage.previewUrl}
            alt="Survey screenshot"
            className="w-7 h-7 object-cover rounded-xl border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-800">Screenshot Attached</span>
          <button
            onClick={onRemoveImage}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Glass Deck */}
      <div className="relative rounded-[28px] p-2.5 sm:p-3 bg-gradient-to-b from-white/95 via-white/88 to-white/82 backdrop-blur-3xl border border-white shadow-[0_24px_55px_-12px_rgba(0,0,0,0.18),0_1.5px_2px_rgba(255,255,255,0.95)_inset] transition-all duration-300 focus-within:ring-2 focus-within:ring-rose-400/50">
        {/* Upper Micro Utility Track */}
        <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold text-slate-500 tracking-wide border-b border-slate-900/5">
          <span className="flex items-center gap-1.5 text-rose-700">
            <Sparkles className="w-3 h-3 text-rose-500" />
            NIRA Intelligent Assist
          </span>
          <span className="text-slate-400">English • বাংলা • Banglish</span>
        </div>

        {/* Lower Ergonomic Deck */}
        <div className="flex items-center gap-2 pt-2">
          {/* Frosted Square Attach Button */}
          <button
            type="button"
            onClick={onAttachClick}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 border ${
              attachedImage
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/60 shadow-xs'
            }`}
            title="Attach screenshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Recessed Typing Channel */}
          <textarea
            ref={inputRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-slate-900/[0.03] focus:bg-slate-900/[0.05] rounded-2xl px-3 py-2 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px] transition-colors leading-relaxed"
          />

          {/* Droplet Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(225,29,72,0.3)] active:scale-90 hover:brightness-105"
            title="Send"
          >
            <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   DESIGN 3: FLUID MINIMALIST (iOS 27 Monolithic Floating Dock)
   - Ultra-clean rounded squircle (rounded-[24px])
   - Caustic light diffusion, flush haptic controls
   ========================================================================= */
export const DesignFluidMinimalist: React.FC<ChatboxProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  inputRef,
  placeholder = 'Kivabe shahajjo korte pari, bondhu?',
  className = '',
}) => {
  const canSend = (Boolean(inputPrompt.trim()) || Boolean(attachedImage)) && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Attached Image Pill */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xl border border-white shadow-md animate-in fade-in duration-200">
          <img
            src={attachedImage.previewUrl}
            alt="Survey screenshot"
            className="w-7 h-7 object-cover rounded-lg border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-800">Screenshot Attached</span>
          <button
            onClick={onRemoveImage}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Dock */}
      <div className="relative rounded-[24px] p-2 sm:p-2.5 bg-white/88 backdrop-blur-2xl border border-white/80 shadow-[0_14px_40px_rgba(0,0,0,0.14),inset_0_1.5px_1px_rgba(255,255,255,0.95)] transition-all duration-300 focus-within:shadow-[0_16px_45px_rgba(0,0,0,0.18),0_0_0_1px_rgba(225,29,72,0.35)]">
        <div className="flex items-center gap-2">
          {/* Minimalist Attach Icon Button */}
          <button
            type="button"
            onClick={onAttachClick}
            className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95 ${
              attachedImage
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
            }`}
            title="Attach survey screenshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Flush Text Area */}
          <textarea
            ref={inputRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 px-2 py-2 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px] leading-relaxed"
          />

          {/* Minimalist Solid Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium flex items-center justify-center gap-1.5 transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
            title="Send"
          >
            <span className="text-xs font-semibold hidden sm:inline">Send</span>
            <Send className="w-3.5 h-3.5 text-rose-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   DESIGN 4: AERO-CURVATURE (iOS 27 Ergonomic Thumb Arc)
   - Asymmetric thumb-reach curvature (rounded-[30px])
   - Elevated quick-trigger send button
   ========================================================================= */
export const DesignAeroCurvature: React.FC<ChatboxProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  inputRef,
  placeholder = 'Kivabe shahajjo korte pari, bondhu?',
  className = '',
}) => {
  const canSend = (Boolean(inputPrompt.trim()) || Boolean(attachedImage)) && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Attached Image Pill */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/92 backdrop-blur-xl border border-white shadow-md animate-in fade-in duration-200">
          <img
            src={attachedImage.previewUrl}
            alt="Survey screenshot"
            className="w-7 h-7 object-cover rounded-xl border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-800">Screenshot Attached</span>
          <button
            onClick={onRemoveImage}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Curved Ergonomic Bar */}
      <div className="relative rounded-[30px] p-2 sm:p-2.5 bg-white/90 backdrop-blur-3xl border border-white shadow-[0_24px_50px_-10px_rgba(0,0,0,0.2),inset_0_1.5px_2px_rgba(255,255,255,1)] transition-all duration-300 focus-within:ring-2 focus-within:ring-rose-400/50">
        <div className="flex items-end gap-2">
          {/* Circular Frosted Media Button */}
          <button
            type="button"
            onClick={onAttachClick}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 mb-0.5 ${
              attachedImage
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200/90 text-slate-600 hover:text-slate-900 border border-slate-200/60'
            }`}
            title="Attach screenshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Ergonomic Input Area */}
          <div className="flex-1 pb-1">
            <textarea
              ref={inputRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full bg-transparent border-0 px-2 pt-2 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[38px] leading-relaxed"
            />
          </div>

          {/* Elevated Circular Action Trigger */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-700 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_6px_18px_rgba(225,29,72,0.4)] active:scale-90 hover:brightness-105 mb-0.5"
            title="Send"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   DESIGN 5: PRISMATIC GEM (iOS 27 Diamond Bevel Glass)
   - Diamond-cut chamfered edges (rounded-[26px])
   - Subtle chromatic dispersion reflection
   ========================================================================= */
export const DesignPrismaticGem: React.FC<ChatboxProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  inputRef,
  placeholder = 'Kivabe shahajjo korte pari, bondhu?',
  className = '',
}) => {
  const canSend = (Boolean(inputPrompt.trim()) || Boolean(attachedImage)) && !isStreaming;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Attached Image Pill */}
      {attachedImage && (
        <div className="mb-2 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/92 backdrop-blur-xl border border-white shadow-md animate-in fade-in duration-200">
          <img
            src={attachedImage.previewUrl}
            alt="Survey screenshot"
            className="w-7 h-7 object-cover rounded-xl border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-800">Screenshot Attached</span>
          <button
            onClick={onRemoveImage}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Diamond Bevel Crystal Container */}
      <div className="relative rounded-[26px] p-2 sm:p-2.5 bg-gradient-to-tr from-white/95 via-white/86 to-white/92 backdrop-blur-3xl border border-white/90 shadow-[0_20px_45px_rgba(0,0,0,0.16),inset_0_2px_4px_rgba(255,255,255,0.95)] transition-all duration-300 focus-within:shadow-[0_24px_55px_rgba(225,29,72,0.2),0_0_0_1.5px_rgba(225,29,72,0.4)]">
        {/* Subtle prismatic sheen line */}
        <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-rose-400/40 via-amber-300/40 to-transparent pointer-events-none" />

        <div className="flex items-center gap-2 px-1">
          {/* Jewel Polished Attach Button */}
          <button
            type="button"
            onClick={onAttachClick}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 border ${
              attachedImage
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border-white shadow-xs'
            }`}
            title="Attach survey screenshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Center Text Area */}
          <textarea
            ref={inputRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 px-2 py-2 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px] leading-relaxed"
          />

          {/* Diamond Jewel Send Trigger */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-700 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_5px_16px_rgba(225,29,72,0.38)] active:scale-90 hover:brightness-105 border border-white/40"
            title="Send"
          >
            <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   MASTER CHATBOX SWITCHER COMPONENT
   Renders the currently selected design on the main app
   ========================================================================= */
export const ActiveChatbox: React.FC<
  ChatboxProps & {
    selectedDesign: ChatboxDesignId;
  }
> = ({ selectedDesign, ...props }) => {
  switch (selectedDesign) {
    case 'aura-capsule':
      return <DesignAuraCapsule {...props} />;
    case 'crystalline-horizon':
      return <DesignCrystallineHorizon {...props} />;
    case 'fluid-minimalist':
      return <DesignFluidMinimalist {...props} />;
    case 'aero-curvature':
      return <DesignAeroCurvature {...props} />;
    case 'prismatic-gem':
      return <DesignPrismaticGem {...props} />;
    default:
      return <DesignAuraCapsule {...props} />;
  }
};

/* =========================================================================
   LIVE PREVIEW & SELECTION STUDIO MODAL
   Shows all 5 designs in a live, interactive phone-first preview interface
   Allows testing input and selecting one design to apply to the main app
   ========================================================================= */
interface ChatboxDesignStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDesign: ChatboxDesignId;
  onSelectDesign: (id: ChatboxDesignId) => void;
}

export const ChatboxDesignStudioModal: React.FC<ChatboxDesignStudioModalProps> = ({
  isOpen,
  onClose,
  selectedDesign,
  onSelectDesign,
}) => {
  // Test inputs for each design so the user can interactively test typing
  const [testInputs, setTestInputs] = useState<Record<string, string>>({
    'aura-capsule': 'Aura Capsule testing...',
    'crystalline-horizon': 'Survey question testing...',
    'fluid-minimalist': 'Minimalist dock typing...',
    'aero-curvature': 'Thumb arc test...',
    'prismatic-gem': 'Diamond bevel test...',
  });

  const handleTestChange = (id: string, text: string) => {
    setTestInputs((prev) => ({ ...prev, [id]: text }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[32px] bg-[#110d12] border border-rose-500/25 shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                iOS 27 Liquid Glass Chatbox Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
                  5 Designs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live interactive preview. Select your favorite design to apply to NIRA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Previews List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {CHATBOX_DESIGNS.map((design, index) => {
            const isSelected = selectedDesign === design.id;

            return (
              <div
                key={design.id}
                className={`relative rounded-3xl p-4 sm:p-5 transition-all duration-300 border ${
                  isSelected
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/50'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header Information for Design */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-rose-400 tracking-wide uppercase">
                        {design.badge}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <Check className="w-3 h-3" /> Active on App
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {design.name}
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        — {design.tagline}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300/80 mt-1 max-w-2xl leading-relaxed">
                      {design.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectDesign(design.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:brightness-110'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </>
                    ) : (
                      'Select This Design'
                    )}
                  </button>
                </div>

                {/* Live Interactive Phone Simulator Canvas */}
                <div className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-black/80 via-[#180e15]/80 to-black/90 border border-white/5 overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>📱 Live Mobile Preview (Try typing below):</span>
                    <span className="text-slate-500">Pure Liquid Glass</span>
                  </div>

                  {/* Render the specific design */}
                  {design.id === 'aura-capsule' && (
                    <DesignAuraCapsule
                      inputPrompt={testInputs[design.id]}
                      setInputPrompt={(txt) => handleTestChange(design.id, txt)}
                      onSend={() => alert(`Aura Capsule test sent: "${testInputs[design.id]}"`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          alert(`Aura Capsule test sent: "${testInputs[design.id]}"`);
                        }
                      }}
                      onAttachClick={() => alert('Screenshot picker triggered (Preview Mode)')}
                      attachedImage={null}
                      onRemoveImage={() => {}}
                      isStreaming={false}
                    />
                  )}

                  {design.id === 'crystalline-horizon' && (
                    <DesignCrystallineHorizon
                      inputPrompt={testInputs[design.id]}
                      setInputPrompt={(txt) => handleTestChange(design.id, txt)}
                      onSend={() => alert(`Crystalline Horizon test sent: "${testInputs[design.id]}"`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          alert(`Crystalline Horizon test sent: "${testInputs[design.id]}"`);
                        }
                      }}
                      onAttachClick={() => alert('Screenshot picker triggered (Preview Mode)')}
                      attachedImage={null}
                      onRemoveImage={() => {}}
                      isStreaming={false}
                    />
                  )}

                  {design.id === 'fluid-minimalist' && (
                    <DesignFluidMinimalist
                      inputPrompt={testInputs[design.id]}
                      setInputPrompt={(txt) => handleTestChange(design.id, txt)}
                      onSend={() => alert(`Fluid Minimalist test sent: "${testInputs[design.id]}"`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          alert(`Fluid Minimalist test sent: "${testInputs[design.id]}"`);
                        }
                      }}
                      onAttachClick={() => alert('Screenshot picker triggered (Preview Mode)')}
                      attachedImage={null}
                      onRemoveImage={() => {}}
                      isStreaming={false}
                    />
                  )}

                  {design.id === 'aero-curvature' && (
                    <DesignAeroCurvature
                      inputPrompt={testInputs[design.id]}
                      setInputPrompt={(txt) => handleTestChange(design.id, txt)}
                      onSend={() => alert(`Aero-Curvature test sent: "${testInputs[design.id]}"`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          alert(`Aero-Curvature test sent: "${testInputs[design.id]}"`);
                        }
                      }}
                      onAttachClick={() => alert('Screenshot picker triggered (Preview Mode)')}
                      attachedImage={null}
                      onRemoveImage={() => {}}
                      isStreaming={false}
                    />
                  )}

                  {design.id === 'prismatic-gem' && (
                    <DesignPrismaticGem
                      inputPrompt={testInputs[design.id]}
                      setInputPrompt={(txt) => handleTestChange(design.id, txt)}
                      onSend={() => alert(`Prismatic Gem test sent: "${testInputs[design.id]}"`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          alert(`Prismatic Gem test sent: "${testInputs[design.id]}"`);
                        }
                      }}
                      onAttachClick={() => alert('Screenshot picker triggered (Preview Mode)')}
                      attachedImage={null}
                      onRemoveImage={() => {}}
                      isStreaming={false}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-white/10 bg-white/[0.02]">
          <span className="text-xs text-slate-400">
            Current active design:{' '}
            <strong className="text-rose-400 font-semibold">
              {CHATBOX_DESIGNS.find((d) => d.id === selectedDesign)?.name}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
