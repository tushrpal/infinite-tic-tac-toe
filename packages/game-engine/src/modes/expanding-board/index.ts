/**
 * Mode 2: Expanding Board (Round-Based Tic-Tac-Toe)
 * 
 * Public API for the expanding board game mode.
 * 
 * Key features:
 * - Round-based gameplay
 * - Board expands after each round (3×3 → 4×4 → 5×5...)
 * - Win condition: N-in-a-row where N = board size
 * - No sliding rules (marks stay for entire round)
 * - Pure, deterministic engine
 */

// Export types
export type {
  Cell,
  Board,
  RoundResult,
  ExpandingBoardState,
  GameConfig,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';

// Export state management
export {
  createEmptyBoard,
  createInitialState,
  createNextRoundState,
  isValidPosition,
  isCellEmpty,
} from './state.js';

// Export game logic
export {
  isValidMove,
  applyMove,
  isRoundComplete,
  getRoundStartingPlayer,
} from './reducer.js';

// Export win detection
export {
  checkWin,
  detectWinner,
} from './winDetection.js';
