/**
 * Core bot type definitions
 */

import type { Infinite3x3State } from '@infinite-ttt/game-engine';

/**
 * Bot interface - all bots must implement this
 * 
 * Returns a board index (0-8) representing the chosen move.
 * The engine will validate and reject invalid moves.
 */
export interface Bot {
  /**
   * Get the next move for the current player in the given state
   * 
   * @param state - Current game state
   * @returns Board index (0-8) for the chosen move
   */
  getMove(state: Infinite3x3State): number;
}

/**
 * Position to board index conversion
 * Board indices: 0-8
 * 0: (0,0), 1: (0,1), 2: (0,2)
 * 3: (1,0), 4: (1,1), 5: (1,2)
 * 6: (2,0), 7: (2,1), 8: (2,2)
 */

/**
 * Convert row/col position to board index (0-8)
 */
export function positionToIndex(row: number, col: number): number {
  return row * 3 + col;
}

/**
 * Convert board index (0-8) to row/col position
 */
export function indexToPosition(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / 3),
    col: index % 3,
  };
}

/**
 * Get all valid move indices from the current state
 * 
 * @param state - Current game state
 * @returns Array of board indices (0-8) that are empty
 */
export function getValidMoves(state: Infinite3x3State): number[] {
  const validMoves: number[] = [];
  const board = state.board;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        validMoves.push(positionToIndex(row, col));
      }
    }
  }
  
  return validMoves;
}
