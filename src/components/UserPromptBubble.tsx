import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export interface UserPromptBubbleProps {
  content: string;
  image?: {
    data: string;
    mimeType: string;
  } | null;
  timestamp?: string;
}

export const UserPromptBubble: React.FC<UserPromptBubbleProps> = ({ content, image }) => (
  <div className="flex justify-end my-3 sm:my-4">
    <div className="max-w-[86%] sm:max-w-[78%] rounded-[22px] bg-white/[0.11] border border-white/[0.14] backdrop-blur-xl px-4 py-2.5 text-[15px] text-white">
      {image && (
        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 bg-black/30 max-w-sm">
          <div className="py-1 px-2.5 flex items-center gap-1.5 text-xs text-violet-200 font-medium border-b border-white/10">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Survey Screenshot</span>
          </div>
          <img
            src={`data:${image.mimeType};base64,${image.data}`}
            alt="Survey screenshot"
            className="w-full max-h-56 object-contain"
          />
        </div>
      )}
      {content && <p className="whitespace-pre-wrap leading-relaxed">{content}</p>}
    </div>
  </div>
);
