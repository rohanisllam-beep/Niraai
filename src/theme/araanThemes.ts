export interface AraanTheme {
  id: string;
  name: string;
  blurb: string;
  pal: {
    deep: [number, number, number];
    mid: [number, number, number];
    light: [number, number, number];
    silver: [number, number, number];
    accent: [number, number, number];
    warm: [number, number, number];
  };
  glow?: number;
  bloom?: number;
}

export const ARAAN_THEMES: AraanTheme[] = [
  {
    id: 'purple-aurora',
    name: 'Purple Aurora',
    blurb: 'Deep violet, lavender, soft magenta, silver highlights',
    pal: {
      deep: [72, 32, 190],
      mid: [124, 78, 240],
      light: [196, 174, 255],
      silver: [238, 236, 250],
      accent: [214, 108, 196],
      warm: [246, 242, 255],
    },
  },
  {
    id: 'emerald-mist',
    name: 'Emerald Mist',
    blurb: 'Dark emerald, muted jade, soft mint, champagne highlights',
    pal: {
      deep: [10, 84, 66],
      mid: [34, 148, 114],
      light: [156, 220, 194],
      silver: [226, 242, 234],
      accent: [98, 186, 152],
      warm: [250, 238, 208],
    },
  },
  {
    id: 'sunset-rose',
    name: 'Sunset Rose',
    blurb: 'Burgundy, dusty rose, muted coral, warm pink highlights',
    pal: {
      deep: [104, 24, 52],
      mid: [192, 86, 112],
      light: [240, 174, 170],
      silver: [253, 234, 228],
      accent: [232, 126, 98],
      warm: [255, 228, 204],
    },
  },
  {
    id: 'arctic-silver',
    name: 'Arctic Silver',
    blurb: 'Charcoal, icy silver, pearl white, pale lavender accents',
    pal: {
      deep: [58, 64, 82],
      mid: [132, 146, 172],
      light: [208, 218, 234],
      silver: [247, 248, 252],
      accent: [186, 176, 236],
      warm: [255, 255, 255],
    },
    glow: 0.7,
    bloom: 0.1,
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    blurb: 'Obsidian, champagne gold, warm bronze, soft amber',
    pal: {
      deep: [92, 56, 18],
      mid: [166, 116, 56],
      light: [228, 194, 126],
      silver: [255, 240, 214],
      accent: [226, 148, 62],
      warm: [255, 230, 176],
    },
    glow: 0.72,
  },
  {
    id: 'cosmic-teal',
    name: 'Cosmic Teal',
    blurb: 'Deep teal, turquoise, muted indigo, violet transitions',
    pal: {
      deep: [8, 74, 90],
      mid: [28, 160, 172],
      light: [138, 228, 226],
      silver: [226, 245, 247],
      accent: [122, 104, 224],
      warm: [236, 248, 252],
    },
    bloom: 0.45,
  },
];

export const DEFAULT_THEME_ID = 'arctic-silver';

const lerp = (a: [number, number, number], b: [number, number, number], r: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * r,
  a[1] + (b[1] - a[1]) * r,
  a[2] + (b[2] - a[2]) * r,
];

const mul = (a: [number, number, number], m: number): [number, number, number] => [
  a[0] * m,
  a[1] * m,
  a[2] * m,
];

const toRgb = (c: [number, number, number]) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
const toRgba = (c: [number, number, number], a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const WHITE: [number, number, number] = [255, 255, 255];
const GRAY: [number, number, number] = [130, 130, 145];

export function getThemeStyles(theme: AraanTheme): React.CSSProperties {
  const { deep, mid, light, silver, accent, warm } = theme.pal;
  return {
    '--araan-glow-1': toRgb(mul(lerp(mid, light, 0.18), theme.glow ?? 1)),
    '--araan-glow-2': toRgb(mul(lerp(deep, mid, 0.22), theme.glow ?? 1)),
    '--araan-glow-3': toRgb(mul(deep, 0.38)),
    '--araan-bloom': toRgba(accent, theme.bloom ?? 0.26),
    '--araan-name': toRgb(lerp(light, WHITE, 0.2)),
    '--araan-ico': toRgb(lerp(light, silver, 0.35)),
    '--araan-title-end': toRgb(lerp(light, GRAY, 0.55)),
    '--araan-line': toRgba(light, 0.42),
    '--araan-tint-a': toRgba(mid, 0.18),
    '--araan-tint-b': toRgba(accent, 0.1),
    '--araan-shadow': toRgba(mid, 0.2),
    '--araan-chip-bg': toRgba(light, 0.15),
    '--araan-chip-fg': toRgb(lerp(light, WHITE, 0.45)),
    '--araan-label-a': toRgb(lerp(light, WHITE, 0.4)),
    '--araan-label-b': toRgb(lerp(accent, WHITE, 0.45)),
    '--araan-label-c': toRgb(lerp(warm, WHITE, 0.3)),
    '--araan-cursor': toRgb(light),
    '--araan-surface-a': toRgba(mul(deep, 0.55), 0.95),
    '--araan-surface-b': toRgba(mul(deep, 0.14), 0.98),
    '--araan-end': toRgb(lerp(accent, deep, 0.3)),
    '--color-violet-200': toRgb(lerp(light, silver, 0.4)),
    '--color-violet-300': toRgb(light),
    '--color-violet-400': toRgb(lerp(mid, light, 0.4)),
    '--color-violet-500': toRgb(mid),
    '--color-violet-600': toRgb(lerp(mid, deep, 0.3)),
    '--color-violet-700': toRgb(lerp(mid, deep, 0.6)),
    '--color-fuchsia-200': toRgb(lerp(accent, silver, 0.5)),
    '--color-fuchsia-300': toRgb(lerp(accent, silver, 0.2)),
    '--color-fuchsia-400': toRgb(accent),
    '--color-fuchsia-600': toRgb(lerp(accent, deep, 0.35)),
    '--color-fuchsia-700': toRgb(lerp(accent, deep, 0.55)),
    '--color-amber-100': toRgb(lerp(warm, silver, 0.5)),
    '--color-amber-200': toRgb(warm),
    '--color-amber-300': toRgb(lerp(warm, accent, 0.2)),
  } as React.CSSProperties;
}

export function getThemeById(id: string): AraanTheme {
  return ARAAN_THEMES.find((t) => t.id === id) || ARAAN_THEMES[3]; // default arctic-silver
}
