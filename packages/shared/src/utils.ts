/**
 * Utility functions for working with frozen API types
 * These helpers maintain type safety and provide common operations
 */

import type { Player, Move } from './types/Move';
import type { Cell, GameState } from './types/GameState';

/**
 * Get the opponent of a player
 */
export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/**
 * Get the current player based on turn number (X always starts)
 */
export function getCurrentPlayer(turn: number): Player {
  return turn % 2 === 0 ? 'X' : 'O';
}

/**
 * Convert flat board index to row/col coordinates
 */
export function indexToPosition(
  index: number,
  boardSize: number
): { row: number; col: number } {
  return {
    row: Math.floor(index / boardSize),
    col: index % boardSize,
  };
}

/**
 * Convert row/col coordinates to flat board index
 */
export function positionToIndex(
  row: number,
  col: number,
  boardSize: number
): number {
  return row * boardSize + col;
}

/**
 * Check if a cell is empty
 */
export function isEmpty(cell: Cell): cell is null {
  return cell === null;
}

/**
 * Check if a cell is occupied
 */
export function isOccupied(cell: Cell): cell is Player {
  return cell !== null;
}

/**
 * Get all empty cell indices from a board
 */
export function getEmptyCells(board: Cell[]): number[] {
  return board
    .map((cell, index) => (isEmpty(cell) ? index : -1))
    .filter((index) => index !== -1);
}

/**
 * Check if the game is a draw (board full, no winner)
 */
export function isDraw(state: GameState): boolean {
  return state.isGameOver && state.winner === null;
}

/**
 * Check if the game has a winner
 */
export function hasWinner(state: GameState): boolean {
  return state.isGameOver && state.winner !== null;
}

/**
 * Create an empty board of given size
 */
export function createEmptyBoard(boardSize: number): Cell[] {
  return new Array(boardSize * boardSize).fill(null);
}

/**
 * Clone a game state (shallow copy with new board array)
 */
export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    board: [...state.board],
    moves: [...state.moves],
  };
}
