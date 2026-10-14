import React from 'react';
import { LivingAiPresence, LivingEntityState } from './LivingAiPresence';
import { LivingConceptId } from '../types/livingConcepts';

export type CallState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'user-speaking'
  | 'nira-speaking'
  | 'error'
  | 'ended';

interface NanoLiquidVoiceCoreProps {
  state: CallState;
  audioLevel?: number; // 0 to 1 normalized volume
  analyserNode?: AnalyserNode | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  concept?: LivingConceptId;
  className?: string;
}

export const NanoLiquidVoiceCore: React.FC<NanoLiquidVoiceCoreProps> = ({
  state,
  audioLevel = 0,
  analyserNode,
  size = 160,
  concept,
  className = '',
}) => {
  return (
    <LivingAiPresence
      concept={concept}
      state={state as LivingEntityState}
      audioLevel={audioLevel}
      analyserNode={analyserNode}
      size={size}
      className={className}
    />
  );
};
