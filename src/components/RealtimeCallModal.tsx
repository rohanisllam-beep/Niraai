import React from 'react';
import { AraanEntity, EntityState } from './AraanEntity';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { AraanTheme, getThemeStyles, getThemeById } from '../theme/araanThemes';

const CALL_STATE_LABELS: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Connected',
  listening: 'Listening',
  'user-speaking': 'You are speaking',
  'nira-speaking': 'Araan is speaking',
  error: 'Connection problem',
  ended: 'Call ended',
};

export interface RealtimeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: EntityState;
  isMuted: boolean;
  isSpeakerMuted: boolean;
  audioLevel: number;
  errorMsg: string | null;
  analyserNode?: AnalyserNode | null;
  theme?: AraanTheme;
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
  theme,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onRetry,
}) => {
  if (!isOpen) return null;

  const activeTheme = theme || getThemeById('arctic-silver');
  const themeStyle = getThemeStyles(activeTheme);

  return (
    <div
      className="araan-root araan-overlay flex flex-col items-center justify-between select-none"
      style={themeStyle}
      role="dialog"
      aria-label="Voice call with Araan"
    >
      <div className="araan-glow" aria-hidden="true" />

      <div
        className="relative z-10 text-center"
        style={{ paddingTop: 'max(32px, env(safe-area-inset-top))' }}
      >
        <p className="araan-name">Araan</p>
        <p className="mt-1 text-sm text-white/55 min-h-5" role="status" aria-live="polite">
          {CALL_STATE_LABELS[state] || ''}
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <AraanEntity
          state={state}
          level={Math.min(1, Math.max(0, audioLevel))}
          size={Math.min(340, typeof window !== 'undefined' ? window.innerWidth - 32 : 340)}
        />
        {errorMsg && (
          <div className="mt-2 px-4 py-3 rounded-2xl bg-white/[0.07] border border-white/15 text-center max-w-[300px] backdrop-blur-xl">
            <p className="text-xs text-white/85 leading-snug">{errorMsg}</p>
            <button
              onClick={onRetry}
              className="mt-2 px-3.5 py-1.5 rounded-full bg-white text-[#1a0f33] text-xs font-semibold active:scale-95 transition-transform"
            >
              Allow &amp; Retry
            </button>
          </div>
        )}
      </div>

      <div
        className="relative z-10 w-full max-w-sm flex items-center justify-around px-6"
        style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 16px))' }}
      >
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          className="araan-call-btn"
        >
          {isMuted ? (
            <MicOff className="w-5 h-5 text-amber-200" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => {
            onEndCall();
            onClose();
          }}
          aria-label="End call"
          className="araan-call-btn araan-call-end"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        <button
          onClick={onToggleSpeaker}
          aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
          aria-pressed={isSpeakerMuted}
          className="araan-call-btn"
        >
          {isSpeakerMuted ? (
            <VolumeX className="w-5 h-5 text-amber-200" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
