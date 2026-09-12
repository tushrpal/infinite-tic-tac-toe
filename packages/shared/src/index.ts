/**
 * @infinite-ttt/shared
 * 
 * FROZEN GAMEPLAY APIs
 * 
 * This package contains the stable, frozen interfaces that define gameplay.
 * All other packages (engine, bots, UI, backend) depend on these types.
 * 
 * 🔒 STABILITY GUARANTEE:
 * These types are frozen and will not change shape without a major version bump.
 * 
 * THE 4 FROZEN APIs:
 * 1. GameState - Single source of truth for gameplay
 * 2. Move - Atomic, immutable player action
 * 3. GameResult - Round-level outcome
 * 4. MatchResult - Session-level outcome (what backend/leaderboards consume)
 */

// Core types
export type { Player, Move } from './types/Move.js';
export type { Cell, GameState } from './types/GameState.js';
export type { GameResult } from './types/GameResult.js';
export type {
  MatchPlayer,
  GameMode,
  Difficulty,
  MatchResult,
} from './types/MatchResult.js';

// Utility functions
export {
  getOpponent,
  getCurrentPlayer,
  indexToPosition,
  positionToIndex,
  isEmpty,
  isOccupied,
  getEmptyCells,
  isDraw,
  hasWinner,
  createEmptyBoard,
  cloneGameState,
} from './utils.js';
