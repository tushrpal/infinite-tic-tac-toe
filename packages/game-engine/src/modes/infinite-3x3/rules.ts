/**
 * Game rules for Mode 1: Infinite 3×3 (Sliding Moves)
 */

import type { Player, Position } from '../../core/types';
import type { Board, Infinite3x3State, Cell } from './state';

const BOARD_SIZE = 3;
const MAX_MARKS_PER_PLAYER = 3;

/**
 * Win patterns - all possible 3-in-a-row patterns
 */
const WIN_PATTERNS: Position[][] = [
  // Horizontal rows
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
  [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
  // Vertical columns
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
  // Diagonals
  [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
  [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
];

/**
 * Check if a position is within board bounds
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
}

/**
 * Check if a cell is empty
 */
export function isEmpty(board: Board, position: Position): boolean {
  if (!isValidPosition(position)) {
    return false;
  }
  return board[position.row][position.col] === null;
}

/**
 * Check if a player has formed a 3-in-a-row
 */
export function checkWin(board: Board, player: Player): boolean {
  for (const pattern of WIN_PATTERNS) {
    if (pattern.every((pos) => board[pos.row][pos.col] === player)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the winner from the current board state
 */
export function getWinner(board: Board): Player | null {
  if (checkWin(board, 'X')) {
    return 'X';
  }
  if (checkWin(board, 'O')) {
    return 'O';
  }
  return null;
}

/**
 * Apply the sliding rule: remove the oldest mark when player places their 4th mark
 * Returns the position of the mark to remove, or null if no removal is needed
 */
export function getMarkToRemove(
  playerMarks: readonly { player: Player; position: Position; turn: number }[]
): Position | null {
  // If player already has 3 marks, the next one (4th) will trigger removal
  if (playerMarks.length < MAX_MARKS_PER_PLAYER) {
    return null;
  }

  // Find the oldest mark (lowest turn number)
  const sortedMarks = [...playerMarks].sort((a, b) => a.turn - b.turn);
  return sortedMarks[0]?.position || null;
}

/**
 * Validate if a move is legal
 */
export function isValidMove(
  state: Infinite3x3State,
  player: Player,
  position: Position
): boolean {
  // Game is already won
  if (state.winner !== null) {
    return false;
  }

  // Position is out of bounds
  if (!isValidPosition(position)) {
    return false;
  }

  // Cell is occupied
  if (!isEmpty(state.board, position)) {
    return false;
  }

  // Check if it's the correct player's turn
  const expectedPlayer = state.currentTurn % 2 === 0 ? 'X' : 'O';
  if (player !== expectedPlayer) {
    return false;
  }

  return true;
}
