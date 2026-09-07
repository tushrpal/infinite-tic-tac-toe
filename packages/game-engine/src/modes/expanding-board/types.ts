/**
 * Type definitions for Mode 2: Expanding Board (Round-Based)
 */

import type { Player, Position, Move } from '../../core/types.ts';

/**
 * Cell state on the board
 */
export type Cell = Player | null;

/**
 * Dynamic board - 2D array that grows over rounds
 * Size is determined by the current round
 */
export type Board = Cell[][];

/**
 * Round result - who won the round
 */
export interface RoundResult {
  winner: Player;
  winningLine: Position[];
}

/**
 * Game state for Expanding Board mode
 * 
 * The engine tracks:
 * - Current round state (board, moves, winner)
 * - Round number (determines board size)
 * - Round history
 * 
 * The engine does NOT track:
 * - Match scores (handled externally)
 * - Player identities for fairness (handled externally)
 */
export interface ExpandingBoardState {
  /** Current board state */
  board: Board;
  
  /** Current board size (N×N) */
  boardSize: number;
  
  /** Current round number (1-indexed) */
  roundNumber: number;
  
  /** Current turn within this round (0-indexed) */
  currentTurn: number;
  
  /** Winner of the current round (null if ongoing) */
  roundWinner: Player | null;
  
  /** Winning line positions (if round is won) */
  winningLine: Position[] | null;
  
  /** Move history for the current round */
  moveHistory: Move[];
  
  /** History of completed rounds */
  roundHistory: RoundResult[];
}

/**
 * Configuration for starting a new game
 */
export interface GameConfig {
  /** Initial board size for round 1 */
  initialBoardSize: number;
  
  /** Starting player for the first round */
  firstPlayer: Player;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: GameConfig = {
  initialBoardSize: 3,
  firstPlayer: 'X',
};
