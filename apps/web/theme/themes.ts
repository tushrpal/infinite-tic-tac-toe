/**
 * Theme definitions for Infinite Tic-Tac-Toe
 * Supports future skins, seasonal themes, and cosmetics
 */

export type ThemeId = 'dark' | 'light' | 'neon' | 'retro';

export interface PlayerTheme {
  primary: string;
  secondary: string;
  glow: string;
  symbol?: string; // For emoji/icon skins
  symbolComponent?: string; // Component name for custom marks
}

export interface BoardTheme {
  bg: string;
  grid: string;
  cell: string;
  cellHover: string;
  cellDisabled: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  board: BoardTheme;
  playerX: PlayerTheme;
  playerO: PlayerTheme;
  accent: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
  surface: {
    base: string;
    elevated: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  // Future: skin assets
  assets?: {
    boardTexture?: string;
    cellTexture?: string;
    playerXMark?: string;
    playerOMark?: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Default dark theme with neon accents',
    board: {
      bg: '#0a0a0f',
      grid: '#1a1a2e',
      cell: '#12121a',
      cellHover: '#1f1f2e',
      cellDisabled: '#0d0d12',
    },
    playerX: {
      primary: '#00d4ff',
      secondary: '#0099cc',
      glow: 'rgba(0, 212, 255, 0.4)',
    },
    playerO: {
      primary: '#ff6b9d',
      secondary: '#cc5580',
      glow: 'rgba(255, 107, 157, 0.4)',
    },
    accent: {
      primary: '#8b5cf6',
      secondary: '#6d28d9',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    surface: {
      base: '#0f0f14',
      elevated: '#16161d',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#475569',
    },
  },

  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme for daytime play',
    board: {
      bg: '#f1f5f9',
      grid: '#e2e8f0',
      cell: '#ffffff',
      cellHover: '#f8fafc',
      cellDisabled: '#f1f5f9',
    },
    playerX: {
      primary: '#0284c7',
      secondary: '#0369a1',
      glow: 'rgba(2, 132, 199, 0.3)',
    },
    playerO: {
      primary: '#db2777',
      secondary: '#be185d',
      glow: 'rgba(219, 39, 119, 0.3)',
    },
    accent: {
      primary: '#7c3aed',
      secondary: '#6d28d9',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
    },
    surface: {
      base: '#ffffff',
      elevated: '#f8fafc',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
    },
  },

  neon: {
    id: 'neon',
    name: 'Neon',
    description: 'Vibrant cyberpunk aesthetic',
    board: {
      bg: '#000000',
      grid: '#0d0d1a',
      cell: '#050510',
      cellHover: '#0f0f20',
      cellDisabled: '#030308',
    },
    playerX: {
      primary: '#00ff88',
      secondary: '#00cc6a',
      glow: 'rgba(0, 255, 136, 0.5)',
    },
    playerO: {
      primary: '#ff00ff',
      secondary: '#cc00cc',
      glow: 'rgba(255, 0, 255, 0.5)',
    },
    accent: {
      primary: '#ffff00',
      secondary: '#cccc00',
      success: '#00ff00',
      warning: '#ff8800',
      error: '#ff0000',
    },
    surface: {
      base: '#000000',
      elevated: '#0a0a12',
      overlay: 'rgba(0, 0, 0, 0.85)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
      muted: '#666666',
    },
  },

  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Classic arcade vibes',
    board: {
      bg: '#2d1b00',
      grid: '#4a3000',
      cell: '#3d2400',
      cellHover: '#5a3a00',
      cellDisabled: '#241700',
    },
    playerX: {
      primary: '#ff9500',
      secondary: '#cc7600',
      glow: 'rgba(255, 149, 0, 0.4)',
    },
    playerO: {
      primary: '#00ff00',
      secondary: '#00cc00',
      glow: 'rgba(0, 255, 0, 0.4)',
    },
    accent: {
      primary: '#ff5500',
      secondary: '#cc4400',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
    },
    surface: {
      base: '#1a1000',
      elevated: '#2d1b00',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: '#ffcc00',
      secondary: '#cc9900',
      muted: '#996600',
    },
  },
};

/**
 * Get theme CSS variables for injection
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--board-bg': theme.board.bg,
    '--board-grid': theme.board.grid,
    '--board-cell': theme.board.cell,
    '--board-cell-hover': theme.board.cellHover,
    '--board-cell-disabled': theme.board.cellDisabled,
    '--player-x-primary': theme.playerX.primary,
    '--player-x-secondary': theme.playerX.secondary,
    '--player-x-glow': theme.playerX.glow,
    '--player-o-primary': theme.playerO.primary,
    '--player-o-secondary': theme.playerO.secondary,
    '--player-o-glow': theme.playerO.glow,
    '--accent-primary': theme.accent.primary,
    '--accent-secondary': theme.accent.secondary,
    '--accent-success': theme.accent.success,
    '--accent-warning': theme.accent.warning,
    '--accent-error': theme.accent.error,
    '--surface-base': theme.surface.base,
    '--surface-elevated': theme.surface.elevated,
    '--surface-overlay': theme.surface.overlay,
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-muted': theme.text.muted,
  };
}

/**
 * Default theme
 */
export const defaultTheme = themes.dark;
