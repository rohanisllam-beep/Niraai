export type LivingConceptId =
  | 'aurora-weave'
  | 'liquid-cell'
  | 'light-filament'
  | 'soft-core'
  | 'micro-nebula'
  | 'liquid-infinity';

export interface LivingConceptMeta {
  id: LivingConceptId;
  name: string;
  tagline: string;
  description: string;
}

export const LIVING_CONCEPTS: LivingConceptMeta[] = [
  {
    id: 'aurora-weave',
    name: 'Aurora Weave',
    tagline: '2–3 translucent liquid strands flowing like silk underwater',
    description: 'Extremely thin liquid-aurora strands slowly flowing through one another. Organic, slightly unpredictable, with beautiful depth as strands pass behind one another.',
  },
  {
    id: 'liquid-cell',
    name: 'Liquid Cell',
    tagline: 'Translucent liquid-glass membrane with luminous fluid interior',
    description: 'A tiny translucent liquid-glass membrane like a microscopic living cell. The outer membrane gently breathes while internal light smoothly moves and changes shape.',
  },
  {
    id: 'light-filament',
    name: 'Light Filament',
    tagline: 'Primary glowing filament with a delicate trailing filament',
    description: 'One primary ultra-thin glowing filament with a second faint filament following it. They continuously bend, stretch, and gently fold through space, illuminating as they cross.',
  },
  {
    id: 'soft-core',
    name: 'Soft Core',
    tagline: 'Luminous breathing core embraced by 2–3 gentle liquid layers',
    description: 'A tiny soft luminous core surrounded by 2–3 extremely subtle liquid layers that slowly expand, contract, and flow around it without flashy pulsing.',
  },
  {
    id: 'micro-nebula',
    name: 'Micro Nebula',
    tagline: 'Concentrated cloud of liquid light with embedded starlight specks',
    description: 'A very small concentrated cloud of liquid light with a few microscopic points of light embedded inside a smooth translucent flow, forming temporary structures.',
  },
  {
    id: 'liquid-infinity',
    name: 'Liquid Infinity',
    tagline: 'Two ultra-thin strands flowing in an imperfect deforming loop',
    description: 'Two ultra-thin luminous strands continuously flowing through an imperfect infinity-like path that slowly stretches, deforms, and relaxes like living liquid.',
  },
];
