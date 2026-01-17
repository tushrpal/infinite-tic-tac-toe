/**
 * FROZEN API: GameState
 * 
 * This is the single source of truth for gameplay.
 * 
 * ✅ REQUIRED PROPERTIES (LOCKED):
 * - board: flat array of cells
 * - boardSize: N (3, 4, 5...)
 * - currentPlayer: who moves next
 * - moves: ordered history
 * - winner: game outcome
 * - isGameOver: terminal state flag
 * 
 * 🔒 RULES:
 * ❌ Do not add UI fields
 * ❌ Do not add ranking fields
 * ❌ Do not add bot hints
 * ✅ Engine owns this fully
 * 
 * Once frozen, DO NOT change shape without a major version bump.
 */

import type { Player, Move } from './Move';

/**
 * Cell state - can be empty or occupied by a player
 */
export type Cell = Player | null;

/**
 * Single source of truth for game state
 * Works for any NxN board size
 */
export interface GameState {
  /** 
   * Board representation as a flat array
   * Length = boardSize * boardSize
   * Index = row * boardSize + col
   */
  board: Cell[];
  
  /** Board dimension (N for NxN board) */
  boardSize: number;
  
  /** Current player whose turn it is */
  currentPlayer: Player;
  
  /** Ordered move history (immutable log) */
  moves: Move[];
  
  /** Winner of the game (null if ongoing or draw) */
  winner: Player | null;
  
  /** Whether the game has ended */
  isGameOver: boolean;
}
