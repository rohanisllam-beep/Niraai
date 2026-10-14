/**
 * Centralized NIRA Design Tokens
 * Unified Theme: Premium Black + Deep Crimson / Red Liquid Glass
 */
export const NIRA_THEME = {
  // Base backgrounds
  bgBase: '#070507',
  bgRadial: 'radial-gradient(circle at 50% 20%, #170408 0%, #0d0205 55%, #050102 100%)',

  // Liquid glass surfaces
  glassBg: 'rgba(20, 10, 14, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderAccent: 'rgba(225, 29, 72, 0.25)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',
  glassGlow: '0 16px 45px -10px rgba(0, 0, 0, 0.65), 0 4px 22px -2px rgba(225, 29, 72, 0.12)',

  // Primary Crimson Accent Colors
  accentPrimary: '#e11d48', // rose-600
  accentPrimaryLight: '#f43f5e', // rose-500
  accentPrimarySubtle: 'rgba(225, 29, 72, 0.16)',
  accentGlow: 'rgba(225, 29, 72, 0.28)',

  // Gradients
  brandGradient: 'from-rose-400 via-red-300 to-amber-200',
  buttonGradient: 'from-rose-600 via-red-600 to-rose-700',
  buttonGradientHover: 'from-rose-500 via-red-500 to-rose-600',
  pillGradient: 'from-rose-500/15 via-red-500/10 to-rose-500/15',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textAccent: '#fda4af',

  // Orbs
  orb1: 'radial-gradient(circle, rgba(225, 29, 72, 0.22) 0%, rgba(159, 18, 57, 0.08) 50%, transparent 75%)',
  orb2: 'radial-gradient(circle, rgba(190, 18, 60, 0.18) 0%, rgba(136, 19, 55, 0.06) 50%, transparent 75%)',
  orb3: 'radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, rgba(159, 18, 57, 0.04) 50%, transparent 80%)',
} as const;
