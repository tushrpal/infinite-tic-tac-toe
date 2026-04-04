/**
 * State creation and management for Mode 2: Expanding Board
 */

import type { Player } from '../../core/types';
import type { Board, ExpandingBoardState, GameConfig } from './types.js';
import { DEFAULT_CONFIG } from './types.js';

/**
 * Create an empty board of size N×N
 * 
 * @param size - Board size (N)
 * @returns Empty board filled with null
 */
export function createEmptyBoard(size: number): Board {
  const board: Board = [];
  for (let row = 0; row < size; row++) {
    const rowArray = [];
    for (let col = 0; col < size; col++) {
      rowArray.push(null);
    }
    board.push(rowArray);
  }
  return board;
}

/**
 * Create initial game state for a new game
 * 
 * @param config - Optional game configuration
 * @returns Initial state for round 1
 */
export function createInitialState(
  config: Partial<GameConfig> = {}
): ExpandingBoardState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return {
    board: createEmptyBoard(finalConfig.initialBoardSize),
    boardSize: finalConfig.initialBoardSize,
    roundNumber: 1,
    currentTurn: 0,
    roundWinner: null,
    winningLine: null,
    moveHistory: [],
    roundHistory: [],
  };
}

/**
 * Create state for a new round
 * 
 * @param previousState - State from the previous round
 * @param startingPlayer - Which player starts this round
 * @returns New state for the next round
 */
export function createNextRoundState(
  previousState: ExpandingBoardState,
  startingPlayer: Player
): ExpandingBoardState {
  const newBoardSize = previousState.boardSize + 1;
  const newRoundNumber = previousState.roundNumber + 1;
  
  return {
    board: createEmptyBoard(newBoardSize),
    boardSize: newBoardSize,
    roundNumber: newRoundNumber,
    currentTurn: 0,
    roundWinner: null,
    winningLine: null,
    moveHistory: [],
    roundHistory: previousState.roundHistory,
  };
}

/**
 * Check if a position is valid for the current board
 * 
 * @param state - Current game state
 * @param row - Row index
 * @param col - Column index
 * @returns True if position is within board bounds
 */
export function isValidPosition(
  state: ExpandingBoardState,
  row: number,
  col: number
): boolean {
  return (
    row >= 0 &&
    row < state.boardSize &&
    col >= 0 &&
    col < state.boardSize
  );
}

/**
 * Check if a cell is empty
 * 
 * @param state - Current game state
 * @param row - Row index
 * @param col - Column index
 * @returns True if cell is empty (null)
 */
export function isCellEmpty(
  state: ExpandingBoardState,
  row: number,
  col: number
): boolean {
  return state.board[row][col] === null;
}
