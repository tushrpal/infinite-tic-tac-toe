/**
 * Theme tokens for Infinite Tic-Tac-Toe
 * All design values are centralized here for consistency
 */

export const tokens = {
  // Spacing scale (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Typography
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Transitions
  transition: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    elevated: 10,
    dropdown: 100,
    modal: 200,
    tooltip: 300,
    toast: 400,
  },

  // Board-specific tokens
  board: {
    minSize: 280,
    maxSize: 600,
    cellGap: {
      mobile: 2,
      tablet: 4,
      desktop: 6,
    },
    cellRadius: {
      mobile: 4,
      tablet: 8,
      desktop: 10,
    },
  },

  // Animation durations
  animation: {
    markAppear: 300,
    winLine: 600,
    cellRemove: 800,
    shake: 500,
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;

export type ThemeTokens = typeof tokens;
