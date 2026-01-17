/**
 * Core bot type definitions
 */

import type { Infinite3x3State } from '@infinite-ttt/game-engine';

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
