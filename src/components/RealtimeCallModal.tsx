import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
} from 'lucide-react';
import { NanoLiquidVoiceCore, CallState } from './NanoLiquidVoiceCore';

interface RealtimeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CallState;
  isMuted: boolean;
  isSpeakerMuted: boolean;
  audioLevel: number;
  errorMsg: string | null;
  analyserNode: AnalyserNode | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onRetry: () => void;
}

export const RealtimeCallModal: React.FC<RealtimeCallModalProps> = ({
  isOpen,
  onClose,
  state,
  isMuted,
  isSpeakerMuted,
  audioLevel,
  errorMsg,
  analyserNode,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onRetry,
}) => {
  if (!isOpen) return null;

  // Compute reactive glow scale and intensity based on real audioLevel (0 to 1)
  const clampedLevel = Math.min(1, Math.max(0, audioLevel));
  const glowScale = 1 + clampedLevel * 0.28;
  const glowOpacity =
    state === 'nira-speaking'
      ? 0.55 + clampedLevel * 0.45
      : state === 'user-speaking'
      ? 0.45 + clampedLevel * 0.4
      : 0.22;

  const glowBg =
    state === 'nira-speaking'
      ? 'radial-gradient(circle, rgba(244, 63, 94, 0.7) 0%, rgba(251, 113, 133, 0.35) 45%, transparent 72%)'
      : state === 'user-speaking'
      ? 'radial-gradient(circle, rgba(16, 185, 129, 0.65) 0%, rgba(52, 211, 153, 0.3) 45%, transparent 72%)'
      : 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, rgba(254, 205, 211, 0.12) 50%, transparent 72%)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 backdrop-blur-2xl w-full max-w-full overflow-hidden select-none animate-fadeIn">
      {/* Liquid Glass Ambient Container - Strictly bounded to prevent mobile overflow */}
      <div className="relative w-full max-w-xs sm:max-w-sm rounded-[36px] sm:rounded-[42px] bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-3xl border border-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.14),inset_0_2px_4px_rgba(255,255,255,1)] flex flex-col items-center justify-between p-6 sm:p-7 overflow-hidden h-[440px] sm:h-[480px]">
        {/* Subtle Prismatic Header Aura */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-200/35 via-rose-100/15 to-transparent pointer-events-none" />

        {/* Top Minimal Branding Header - Icon/Status Indicator Only, No Text Labels */}
        <div className="relative z-10 w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {/* Visual Ambient Indicator Dot */}
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                state === 'nira-speaking'
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] scale-110'
                  : state === 'user-speaking'
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110'
                  : state === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-300'
              }`}
            />
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
                NIRA
              </span>
              <p className="text-[9px] font-semibold text-slate-400 tracking-wider">
                By Emran Mahmud
              </p>
            </div>
          </div>

          {/* Minimal Connectivity Glyph */}
          <div className="flex items-center gap-1.5 opacity-60">
            <span
              className={`w-1 h-2 rounded-full ${
                state === 'user-speaking' || state === 'nira-speaking' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span
              className={`w-1 h-3 rounded-full ${
                state === 'user-speaking' || state === 'nira-speaking' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span
              className={`w-1 h-4 rounded-full ${
                state === 'user-speaking' || state === 'nira-speaking' ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Center Reactive Core - Real Audio-Driven Glowing State */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full my-auto">
          <div className="relative flex items-center justify-center w-44 h-44 sm:w-48 sm:h-48">
            {/* Glowing Resonant Aura Layer - Pulses strictly with real audioActivity */}
            <div
              className="absolute inset-2 rounded-full pointer-events-none transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${glowScale})`,
                opacity: glowOpacity,
                filter: 'blur(30px)',
                background: glowBg,
              }}
            />

            {/* Nano Liquid Voice Core (Design F: Prismatic Nano Core) */}
            <NanoLiquidVoiceCore
              state={state}
              audioLevel={clampedLevel}
              analyserNode={analyserNode}
              size={160}
              className="relative z-10"
            />
          </div>

          {/* Recover notice if error occurs */}
          {errorMsg && (
            <div className="mt-2 px-3.5 py-2 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-center max-w-[280px] shadow-xs">
              <p className="text-[11px] font-medium text-rose-700 leading-snug">
                {errorMsg}
              </p>
              <button
                onClick={onRetry}
                className="mt-1.5 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-all shadow-xs active:scale-95 inline-flex items-center gap-1"
              >
                <span>Allow & Retry</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Clean Iconic Controls - Microphone, End Call, Speaker */}
        <div className="relative z-10 w-full flex items-center justify-around pt-3 border-t border-slate-100/80">
          {/* Microphone Mute/Unmute */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-12 h-12 rounded-full transition-all flex items-center justify-center shadow-xs active:scale-95 ${
              isMuted
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-amber-600" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button (Center Primary Red Action) */}
          <button
            onClick={() => {
              onEndCall();
              onClose();
            }}
            aria-label="End Call"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 text-white shadow-[0_8px_22px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_28px_rgba(225,29,72,0.5)] active:scale-95 transition-all flex items-center justify-center"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Speaker Mute/Unmute */}
          <button
            onClick={onToggleSpeaker}
            aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            className={`w-12 h-12 rounded-full transition-all flex items-center justify-center shadow-xs active:scale-95 ${
              isSpeakerMuted
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90'
            }`}
          >
            {isSpeakerMuted ? (
              <VolumeX className="w-5 h-5 text-amber-600" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
