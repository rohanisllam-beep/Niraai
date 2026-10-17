import React from 'react';
import { Paperclip, ArrowUp, AudioWaveform, X } from 'lucide-react';

export interface AraanCapsuleDockProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAttachClick: () => void;
  onVoiceClick: () => void;
  attachedImage: { previewUrl: string } | null;
  onRemoveImage: () => void;
  isStreaming: boolean;
  isThinking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const AraanCapsuleDock: React.FC<AraanCapsuleDockProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  onKeyDown,
  onAttachClick,
  onVoiceClick,
  attachedImage,
  onRemoveImage,
  isStreaming,
  isThinking,
  inputRef,
}) => {
  const hasContent = Boolean(inputPrompt.trim() || attachedImage);

  if (isThinking) {
    return (
      <div className="araan-capsule araan-capsule-busy" role="status" aria-live="polite">
        <span className="araan-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Thinking…</span>
      </div>
    );
  }

  return (
    <div>
      {attachedImage && (
        <div className="flex items-center gap-2 px-2 pb-2 text-xs text-white/80">
          <img
            src={attachedImage.previewUrl}
            alt="Screenshot ready to send"
            className="h-9 rounded-lg border border-white/20 object-cover"
          />
          <span>Screenshot attached</span>
          <button
            onClick={onRemoveImage}
            className="araan-icon-btn !w-6 !h-6"
            aria-label="Remove screenshot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="araan-capsule">
        <textarea
          ref={inputRef}
          rows={1}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isStreaming}
          placeholder="Ask anything…"
          aria-label="Message Araan"
          className="araan-input"
        />

        <button
          type="button"
          onClick={onAttachClick}
          className="araan-icon-btn"
          aria-label="Attach survey screenshot"
          title="Attach screenshot (Ctrl+V also works)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {hasContent ? (
          <button
            type="button"
            onClick={onSend}
            disabled={isStreaming}
            className="araan-icon-btn araan-send"
            aria-label="Send"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onVoiceClick}
            className="araan-icon-btn"
            aria-label="Start voice call"
          >
            <AudioWaveform className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
