/**
 * Application Constants
 * Centralized configuration values
 */

// ============================================
// Game Constants
// ============================================

export const GAME = {
  // Board sizes
  BOARD_SIZE: {
    MODE_1: 3,
    MODE_2: 3,
    MIN: 3,
    MAX: 10,
  },

  // Win conditions
  WIN_LENGTH: {
    MODE_1: 3,
    MODE_2: 3,
  },

  // Sliding rule (Mode 2)
  SLIDING_RULE: {
    MAX_MARKS_PER_PLAYER: 3,
  },

  // Players
  PLAYERS: {
    X: 'X' as const,
    O: 'O' as const,
  },

  // Move limits
  MAX_MOVES: 1000,
} as const;

// ============================================
// UI Constants
// ============================================

export const UI = {
  // Animation durations (ms)
  ANIMATION: {
    MARK_APPEAR: 300,
    WIN_LINE: 600,
    CELL_REMOVE: 800,
    FADE: 200,
    SLIDE: 300,
    SHAKE: 500,
  },

  // Debounce times
  DEBOUNCE: {
    MOVE: 100,
    RESIZE: 150,
    SEARCH: 300,
  },

  // Timeouts
  TIMEOUT: {
    TOAST: 5000,
    TOOLTIP: 200,
    NOTIFICATION: 8000,
  },

  // Board constraints
  BOARD: {
    MIN_SIZE_PX: 280,
    MAX_SIZE_PX: 600,
    CELL_GAP: 4,
  },

  // Z-index layers
  Z_INDEX: {
    BASE: 0,
    OVERLAY: 10,
    DROPDOWN: 100,
    MODAL: 200,
    TOOLTIP: 300,
    TOAST: 400,
  },
} as const;

// ============================================
// Network Constants
// ============================================

export const NETWORK = {
  // WebSocket
  WS: {
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    RECONNECT_DELAY_MAX: 30000,
    PING_INTERVAL: 30000,
    PING_TIMEOUT: 5000,
  },

  // REST API
  API: {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // Latency thresholds (ms)
  LATENCY: {
    GOOD: 50,
    FAIR: 150,
    POOR: 300,
  },
} as const;

// ============================================
// Routes
// ============================================

export const ROUTES = {
  HOME: '/',
  PLAY: '/play',
  PLAY_LOCAL: '/play/local',
  PLAY_ONLINE: '/play/online',
  PLAY_RANKED: '/play/ranked',
  PLAY_PRACTICE: '/play/practice',
  MATCH: (matchId: string) => `/match/${matchId}` as const,
  WATCH: (matchId: string) => `/watch/${matchId}` as const,
  REPLAY: (matchId: string) => `/replay/${matchId}` as const,
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  HOW_TO_PLAY: '/how-to-play',
} as const;

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  THEME: 'infinite-ttt-theme',
  PLAYER_ID: 'infinite-ttt-player-id',
  SETTINGS: 'infinite-ttt-settings',
  MATCH_HISTORY: 'infinite-ttt-match-history',
} as const;

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  MATCHES: '/api/matches',
  MATCH: (matchId: string) => `/api/matches/${matchId}`,
  REPLAY: (matchId: string) => `/api/replays/${matchId}`,
  LEADERBOARD: '/api/leaderboard',
  PROFILE: '/api/profile',
  SETTINGS: '/api/settings',
} as const;

// ============================================
// Rank Tiers
// ============================================

export const RANKS = {
  TIERS: [
    { name: 'Bronze', minRating: 400, color: '#cd7f32' },
    { name: 'Silver', minRating: 800, color: '#c0c0c0' },
    { name: 'Gold', minRating: 1000, color: '#ffd700' },
    { name: 'Platinum', minRating: 1400, color: '#e5e4e2' },
    { name: 'Diamond', minRating: 1800, color: '#b9f2ff' },
    { name: 'Master', minRating: 2200, color: '#9966cc' },
    { name: 'Grandmaster', minRating: 3000, color: '#ff4444' },
  ],
  DEFAULT_RATING: 200,
} as const;
