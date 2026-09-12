/**
 * State definitions for Mode 1: Infinite 3×3 (Sliding Moves)
 */

import type { Player, Position, Move } from '../../core/types';

/**
 * Cell state on the board
 */
export type Cell = Player | null;

/**
 * Board state - 3×3 grid
 */
export type Board = [
  [Cell, Cell, Cell],
  [Cell, Cell, Cell],
  [Cell, Cell, Cell]
];

/**
 * Game state for Infinite 3×3 mode
 */
export interface Infinite3x3State {
  board: Board;
  currentTurn: number;
  winner: Player | null;
  moveHistory: Move[];
  playerMarks: {
    X: Move[];
    O: Move[];
  };
}

/**
 * Create an empty 3×3 board
 */
export function createEmptyBoard(): Board {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

/**
 * Create initial game state
 */
export function createInitialState(): Infinite3x3State {
  return {
    board: createEmptyBoard(),
    currentTurn: 0,
    winner: null,
    moveHistory: [],
    playerMarks: {
      X: [],
      O: [],
    },
  };
}
