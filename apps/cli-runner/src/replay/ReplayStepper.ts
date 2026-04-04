/**
 * ReplayStepper - Applies moves step-by-step using engine reducer
 * 
 * RULES:
 * - Pure state reconstruction
 * - No game logic duplication
 * - Deterministic replay
 * - Works for any mode
 */

import type { GameState, Move } from '@infinite-ttt/shared';
import type { GameResult } from '@infinite-ttt/shared';
import { Modes } from '@infinite-ttt/game-engine';

/**
 * Reconstruct all game states by applying moves in sequence
 * 
 * For Mode 1 (infinite-3x3):
 * - Uses sliding move reducer
 * - Board size is always 3x3
 * 
 * For Mode 2 (expanding-board):
 * - Uses expanding board reducer
 * - Board size varies per round
 * 
 * @param gameResult - The game result with move history
 * @param mode - The game mode ('mode1' or 'mode2')
 * @returns Array of GameState snapshots (one per move, plus initial state)
 */
export function replayGame(
  gameResult: GameResult,
  mode: 'mode1' | 'mode2'
): GameState[] {
  const states: GameState[] = [];
  const moves = gameResult.moves;
  const boardSize = gameResult.boardSize;
  
  if (mode === 'mode1') {
    // Mode 1: Infinite 3x3
    let state = Modes.Infinite3x3.createInitialState();
    
    // Add initial state
    states.push(convertMode1StateToGameState(state));
    
    // Apply each move
    for (const move of moves) {
      // Convert flat index to position
      const position = {
        row: Math.floor(move.index / 3),
        col: move.index % 3,
      };
      
      state = Modes.Infinite3x3.applyMove(state, move.player, position);
      states.push(convertMode1StateToGameState(state));
    }
  } else {
    // Mode 2: Expanding Board
    let state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: boardSize });
    
    // Add initial state
    states.push(convertMode2StateToGameState(state, boardSize));
    
    // Apply each move
    for (const move of moves) {
      // Convert flat index to position
      const position = {
        row: Math.floor(move.index / boardSize),
        col: move.index % boardSize,
      };
      
      state = Modes.ExpandingBoard.applyMove(state, move.player, position);
      states.push(convertMode2StateToGameState(state, boardSize));
    }
  }
  
  return states;
}

/**
 * Convert Mode 1 internal state to GameState
 */
function convertMode1StateToGameState(
  state: any
): GameState {
  // Flatten the 2D board to 1D array
  const board: any[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      board.push(state.board[row][col]);
    }
  }
  
  // Convert moves from position-based to index-based
  const moves: Move[] = state.moveHistory.map((move: any) => ({
    index: move.position.row * 3 + move.position.col,
    player: move.player,
    turn: move.turn,
    timestamp: move.timestamp,
  }));
  
  return {
    board,
    boardSize: 3,
    currentPlayer: state.currentTurn % 2 === 0 ? 'X' : 'O',
    moves,
    winner: state.winner ?? null,
    isGameOver: state.winner !== null,
  };
}

/**
 * Convert Mode 2 internal state to GameState
 */
function convertMode2StateToGameState(
  state: any,
  boardSize: number
): GameState {
  // Flatten the 2D board to 1D array
  const board: any[] = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      board.push(state.board[row][col]);
    }
  }
  
  // Convert moves from position-based to index-based
  const moves: Move[] = state.moveHistory.map((move: any) => ({
    index: move.position.row * boardSize + move.position.col,
    player: move.player,
    turn: move.turn,
    timestamp: move.timestamp,
  }));
  
  return {
    board,
    boardSize,
    currentPlayer: state.currentTurn % 2 === 0 ? 'X' : 'O',
    moves,
    winner: state.roundWinner ?? null,
    isGameOver: state.roundWinner !== null,
  };
}
