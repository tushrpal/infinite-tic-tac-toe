/**
 * Public exports for Mode 1: Infinite 3×3 (Sliding Moves)
 */

export { createInitialState, type Infinite3x3State, type Board, type Cell } from './state.js';
export { applyMove } from './reducer.js';
export { isValidMove, checkWin, getWinner } from './rules.js';
