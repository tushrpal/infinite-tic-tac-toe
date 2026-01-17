/**
 * Core bot type definitions
 */

import type { Infinite3x3State } from '@infinite-ttt/game-engine';

/**
 * Difficulty levels for bot behavior
 */
export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

/**
 * Configuration for heuristic bot behavior
 * Controls strategic priorities and randomness
 */
export interface HeuristicConfig {
  /** 
   * Probability of selecting randomly among top N moves (0 = always best, 1 = fully random)
   * - Easy: N/A (uses Random bot)
   * - Medium: considers top 3-4 moves
   * - Hard: considers only top 1-2 moves (more deterministic)
   */
  randomness: number;
  
  /** 
   * Multiplier for blocking opponent wins (default: 900)
   * Higher = more aggressive blocking
   */
  blockWeight: number;
  
  /** 
   * Multiplier for extending existing lines (default: 10 per mark)
   * Higher = more focused on building threats
   */
  extendWeight: number;
  
  /** 
   * Multiplier for center proximity (default: 5)
   * Lower on larger boards and harder difficulties
   */
  centerWeight: number;
}

/**
 * Generic game state interface for bot compatibility
 * Works with any NxN board size
 */
export interface GameState {
  board: any[][];  // NxN array
  currentTurn: number;
  winner: any;
  moveHistory: any[];
  playerMarks?: any;
}

/**
 * Bot interface - all bots must implement this
 * 
 * Returns a board index representing the chosen move.
 * The engine will validate and reject invalid moves.
 */
export interface Bot {
  /**
   * Get the next move for the current player in the given state
   * 
   * @param state - Current game state (works with any board size)
   * @returns Board index for the chosen move
   */
  getMove(state: GameState): number;
}

/**
 * Position to board index conversion
 * Works for any NxN board size
 */

/**
 * Convert row/col position to board index for NxN board
 * @param row - Row index
 * @param col - Column index
 * @param boardSize - Size of the board (N)
 */
export function positionToIndex(row: number, col: number, boardSize: number = 3): number {
  return row * boardSize + col;
}

/**
 * Convert board index to row/col position for NxN board
 * @param index - Board index
 * @param boardSize - Size of the board (N)
 */
export function indexToPosition(index: number, boardSize: number = 3): { row: number; col: number } {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize,
  };
}

/**
 * Get all valid move indices from the current state
 * Works with any NxN board size
 * 
 * @param state - Current game state
 * @returns Array of board indices that are empty
 */
export function getValidMoves(state: GameState): number[] {
  const validMoves: number[] = [];
  const board = state.board;
  const boardSize = board.length;
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === null) {
        validMoves.push(positionToIndex(row, col, boardSize));
      }
    }
  }
  
  return validMoves;
}
