import React from 'react';
import { NanoLiquidVoiceCore, CallState } from './NanoLiquidVoiceCore';
import { LivingConceptId } from '../types/livingConcepts';

interface NiraAvatarProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isStreaming?: boolean;
  state?: CallState;
  concept?: LivingConceptId;
  audioLevel?: number;
  analyserNode?: AnalyserNode | null;
  className?: string;
}

export const NiraAvatar: React.FC<NiraAvatarProps> = ({
  size = 'md',
  isStreaming = false,
  state,
  concept,
  audioLevel,
  analyserNode,
  className = '',
}) => {
  const resolvedState: CallState = state || (isStreaming ? 'nira-speaking' : 'idle');

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      title="NIRA Living Presence"
    >
      <NanoLiquidVoiceCore
        size={size}
        state={resolvedState}
        concept={concept}
        audioLevel={audioLevel}
        analyserNode={analyserNode}
      />
    </div>
  );
};
