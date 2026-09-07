/**
 * State reducer for Mode 1: Infinite 3×3 (Sliding Moves)
 */

import type { Player, Position, Move } from '../../core/types.ts';
import type { Board, Infinite3x3State } from './state.ts';
import { isValidMove, getWinner, getMarkToRemove } from './rules.ts';

/**
 * Create a new board with a mark placed at the given position
 */
function placeMark(
  board: Board,
  position: Position,
  player: Player
): Board {
  const newBoard: Board = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
  ];
  newBoard[position.row][position.col] = player;
  return newBoard;
}

/**
 * Remove a mark from the board at the given position
 */
function removeMark(board: Board, position: Position): Board {
  const newBoard: Board = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
  ];
  newBoard[position.row][position.col] = null;
  return newBoard;
}

/**
 * Apply a move to the game state and return the new state
 *
 * If the move is invalid, returns the unchanged state.
 * This ensures the engine never throws during normal gameplay.
 */
export function applyMove(
  state: Infinite3x3State,
  player: Player,
  position: Position
): Infinite3x3State {
  // Validate the move - return unchanged state if invalid
  if (!isValidMove(state, player, position)) {
    return state;
  }

  // Create the move
  const move: Move = {
    player,
    position,
    turn: state.currentTurn,
  };

  // Apply sliding rule: check if we need to remove the oldest mark
  const currentPlayerMarks = state.playerMarks[player];
  const markToRemove = getMarkToRemove(currentPlayerMarks);

  // Start with current board
  let newBoard: Board = state.board;

  // Remove oldest mark if sliding rule applies (before placing new mark)
  if (markToRemove !== null) {
    // Find the oldest mark by turn number (needed to remove from arrays)
    const oldestMark = currentPlayerMarks
      .sort((a, b) => a.turn - b.turn)[0];

    // Remove oldest mark from board
    newBoard = removeMark(newBoard, markToRemove);

    // Update player marks to remove the oldest one (by turn number)
    const updatedPlayerMarks = currentPlayerMarks
      .filter((m) => m.turn !== oldestMark.turn)
      .concat([move]);

    // Remove the oldest mark from history (as per spec: "Remove oldest moves")
    const updatedMoveHistory = state.moveHistory
      .filter((m) => m.turn !== oldestMark.turn)
      .concat([move]);

    // Place the new mark
    newBoard = placeMark(newBoard, position, player);

    // Check for winner
    const winner = getWinner(newBoard);

    return {
      board: newBoard,
      currentTurn: state.currentTurn + 1,
      winner,
      moveHistory: updatedMoveHistory,
      playerMarks: {
        ...state.playerMarks,
        [player]: updatedPlayerMarks,
      },
    };
  }

  // No sliding needed - just place the mark
  newBoard = placeMark(newBoard, position, player);

  // Check for winner
  const winner = getWinner(newBoard);

  return {
    board: newBoard,
    currentTurn: state.currentTurn + 1,
    winner,
    moveHistory: [...state.moveHistory, move],
    playerMarks: {
      ...state.playerMarks,
      [player]: [...currentPlayerMarks, move],
    },
  };
}
