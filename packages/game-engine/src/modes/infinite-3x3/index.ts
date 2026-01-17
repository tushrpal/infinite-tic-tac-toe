/**
 * Public exports for Mode 1: Infinite 3×3 (Sliding Moves)
 */

export { createInitialState, type Infinite3x3State, type Board, type Cell } from './state';
export { applyMove } from './reducer';
export { isValidMove, checkWin, getWinner } from './rules';
