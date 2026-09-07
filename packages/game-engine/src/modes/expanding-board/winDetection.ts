/**
 * Win detection for Mode 2: Expanding Board
 * 
 * Detects N-in-a-row where N = board size
 */

import type { Player, Position } from '../../core/types.ts';
import type { Board } from './types.ts';

/**
 * Check if a player has won by getting N-in-a-row
 * where N equals the board size
 * 
 * @param board - Current board state
 * @param boardSize - Size of the board (N×N)
 * @param player - Player to check for win
 * @returns Array of positions forming the winning line, or null if no win
 */
export function checkWin(
  board: Board,
  boardSize: number,
  player: Player
): Position[] | null {
  // Check all rows
  for (let row = 0; row < boardSize; row++) {
    let count = 0;
    const line: Position[] = [];
    
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === player) {
        count++;
        line.push({ row, col });
      }
    }
    
    if (count === boardSize) {
      return line;
    }
  }
  
  // Check all columns
  for (let col = 0; col < boardSize; col++) {
    let count = 0;
    const line: Position[] = [];
    
    for (let row = 0; row < boardSize; row++) {
      if (board[row][col] === player) {
        count++;
        line.push({ row, col });
      }
    }
    
    if (count === boardSize) {
      return line;
    }
  }
  
  // Check main diagonal (top-left to bottom-right)
  {
    let count = 0;
    const line: Position[] = [];
    
    for (let i = 0; i < boardSize; i++) {
      if (board[i][i] === player) {
        count++;
        line.push({ row: i, col: i });
      }
    }
    
    if (count === boardSize) {
      return line;
    }
  }
  
  // Check anti-diagonal (top-right to bottom-left)
  {
    let count = 0;
    const line: Position[] = [];
    
    for (let i = 0; i < boardSize; i++) {
      if (board[i][boardSize - 1 - i] === player) {
        count++;
        line.push({ row: i, col: boardSize - 1 - i });
      }
    }
    
    if (count === boardSize) {
      return line;
    }
  }
  
  return null;
}

/**
 * Detect if either player has won
 * 
 * @param board - Current board state
 * @param boardSize - Size of the board (N×N)
 * @returns Object with winner and winning line, or null if no winner
 */
export function detectWinner(
  board: Board,
  boardSize: number
): { winner: Player; winningLine: Position[] } | null {
  // Check X first (since X always goes first)
  const xWin = checkWin(board, boardSize, 'X');
  if (xWin) {
    return { winner: 'X', winningLine: xWin };
  }
  
  // Check O
  const oWin = checkWin(board, boardSize, 'O');
  if (oWin) {
    return { winner: 'O', winningLine: oWin };
  }
  
  return null;
}
