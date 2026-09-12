/**
 * State reducer for Mode 2: Expanding Board
 *
 * Handles:
 * - Move application
 * - Win detection
 * - Round completion
 */

import type { Player, Position, Move } from '../../core/types';
import { getNextPlayer } from '../../core/types';
import type { Board, ExpandingBoardState, RoundResult } from './types';
import { isValidPosition, isCellEmpty } from './state';
import { detectWinner } from './winDetection';

/**
 * Create a deep copy of the board
 */
function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * Validate if a move is legal
 *
 * @param state - Current game state
 * @param player - Player making the move
 * @param position - Position to place mark
 * @returns True if move is valid
 */
export function isValidMove(
  state: ExpandingBoardState,
  player: Player,
  position: Position
): boolean {
  // Cannot make moves if round is already won
  if (state.roundWinner !== null) {
    return false;
  }

  // Check if it's the correct player's turn
  const expectedPlayer = getNextPlayer(state.currentTurn);
  if (player !== expectedPlayer) {
    return false;
  }

  // Check if position is within bounds
  if (!isValidPosition(state, position.row, position.col)) {
    return false;
  }

  // Check if cell is empty
  if (!isCellEmpty(state, position.row, position.col)) {
    return false;
  }

  return true;
}

/**
 * Apply a move to the game state
 *
 * @param state - Current game state
 * @param player - Player making the move
 * @param position - Position to place mark
 * @returns New state after applying the move (or unchanged if invalid)
 */
export function applyMove(
  state: ExpandingBoardState,
  player: Player,
  position: Position
): ExpandingBoardState {
  // Validate move
  if (!isValidMove(state, player, position)) {
    return state;
  }

  // Clone the board and place the mark
  const newBoard = cloneBoard(state.board);
  newBoard[position.row][position.col] = player;

  // Create move record
  const move: Move = {
    player,
    position,
    turn: state.currentTurn,
  };

  // Check for winner
  const winResult = detectWinner(newBoard, state.boardSize);

  // Build new state
  const newState: ExpandingBoardState = {
    ...state,
    board: newBoard,
    currentTurn: state.currentTurn + 1,
    moveHistory: [...state.moveHistory, move],
  };

  // If there's a winner, update the state
  if (winResult) {
    newState.roundWinner = winResult.winner;
    newState.winningLine = winResult.winningLine;

    // Add round result to history
    const roundResult: RoundResult = {
      winner: winResult.winner,
      winningLine: winResult.winningLine,
    };
    newState.roundHistory = [...state.roundHistory, roundResult];
  }

  return newState;
}

/**
 * Check if the current round is complete
 *
 * @param state - Current game state
 * @returns True if round has a winner
 */
export function isRoundComplete(state: ExpandingBoardState): boolean {
  return state.roundWinner !== null;
}

/**
 * Get the starting player for a given round number
 * Starting player alternates each round
 *
 * @param roundNumber - Round number (1-indexed)
 * @param firstPlayer - Player who started round 1
 * @returns Player who should start the given round
 */
export function getRoundStartingPlayer(
  roundNumber: number,
  firstPlayer: Player
): Player {
  // Round 1 uses firstPlayer
  // Round 2 uses opponent
  // Round 3 uses firstPlayer again, etc.
  const shouldAlternate = (roundNumber - 1) % 2 === 1;
  if (shouldAlternate) {
    return firstPlayer === 'X' ? 'O' : 'X';
  }
  return firstPlayer;
}
