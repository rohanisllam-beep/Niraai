import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface UserPromptBubbleProps {
  content: string;
  image?: {
    data: string;
    mimeType: string;
  } | null;
  timestamp?: string;
}

export const UserPromptBubble: React.FC<UserPromptBubbleProps> = ({
  content,
  image,
  timestamp = 'Just now',
}) => {
  return (
    <div className="flex justify-end my-3 sm:my-4 group">
      <div className="max-w-[88%] sm:max-w-[78%]">
        {/* Prismatic Gem User Bubble - Clean, seamless glass without accidental red lines */}
        <div className="relative rounded-[24px] rounded-br-[6px] p-3.5 sm:p-4 bg-gradient-to-tr from-white/96 via-white/88 to-white/94 backdrop-blur-3xl border border-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] transition-all">
          {/* Attached screenshot preview */}
          {image && (
            <div className="mb-2.5 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 shadow-inner max-w-sm">
              <div className="py-1 px-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-semibold border-b border-slate-200/80 bg-white/80">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Survey Screenshot</span>
              </div>
              <img
                src={`data:${image.mimeType};base64,${image.data}`}
                alt="Survey screenshot"
                className="w-full max-h-56 object-contain bg-slate-100"
              />
            </div>
          )}

          {/* Prompt text with high-contrast, clean typography */}
          {content && (
            <p className="whitespace-pre-wrap font-medium text-slate-900 text-[15px] sm:text-[15.5px] leading-relaxed">
              {content}
            </p>
          )}

          {/* Timestamp */}
          <div className="flex justify-end mt-1.5">
            <span className="text-[11px] text-slate-400 font-medium tracking-tight">
              {timestamp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
