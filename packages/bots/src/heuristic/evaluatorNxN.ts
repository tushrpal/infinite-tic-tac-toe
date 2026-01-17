/**
 * NxN-Aware Heuristic Evaluation
 * 
 * Evaluates moves on any board size (3×3, 4×4, 5×5, ...)
 * with N-in-a-row win conditions.
 * 
 * Priority Order:
 * 1. Immediate win (complete N-in-a-row)
 * 2. Immediate block (prevent opponent's N-in-a-row)
 * 3. Line extension (prefer moves that extend existing lines)
 * 4. Center bias (scaled by board size)
 * 5. Random valid move
 */

import type { Player } from '@infinite-ttt/game-engine';
import { getOpponent } from '@infinite-ttt/game-engine';
import type { GameState } from '../core/types.js';
import { indexToPosition, positionToIndex } from '../core/types.js';

/**
 * Check if placing a mark at a position would complete N-in-a-row
 */
function wouldWin(
  board: any[][],
  row: number,
  col: number,
  player: Player
): boolean {
  const boardSize = board.length;
  
  // Temporarily place the mark
  const originalValue = board[row][col];
  board[row][col] = player;
  
  let wins = false;
  
  // Check row
  let count = 0;
  for (let c = 0; c < boardSize; c++) {
    if (board[row][c] === player) count++;
  }
  if (count === boardSize) wins = true;
  
  // Check column
  if (!wins) {
    count = 0;
    for (let r = 0; r < boardSize; r++) {
      if (board[r][col] === player) count++;
    }
    if (count === boardSize) wins = true;
  }
  
  // Check main diagonal (if on diagonal)
  if (!wins && row === col) {
    count = 0;
    for (let i = 0; i < boardSize; i++) {
      if (board[i][i] === player) count++;
    }
    if (count === boardSize) wins = true;
  }
  
  // Check anti-diagonal (if on anti-diagonal)
  if (!wins && row + col === boardSize - 1) {
    count = 0;
    for (let i = 0; i < boardSize; i++) {
      if (board[i][boardSize - 1 - i] === player) count++;
    }
    if (count === boardSize) wins = true;
  }
  
  // Restore original value
  board[row][col] = originalValue;
  
  return wins;
}

/**
 * Count how many marks a player has in a line (row, col, or diagonal)
 * Returns the longest contiguous sequence
 */
function getLongestLine(
  board: any[][],
  row: number,
  col: number,
  player: Player
): number {
  const boardSize = board.length;
  let maxLength = 1; // The move itself counts as 1
  
  // Check row - count contiguous marks
  let left = 0, right = 0;
  for (let c = col - 1; c >= 0 && board[row][c] === player; c--) left++;
  for (let c = col + 1; c < boardSize && board[row][c] === player; c++) right++;
  maxLength = Math.max(maxLength, left + right + 1);
  
  // Check column
  let up = 0, down = 0;
  for (let r = row - 1; r >= 0 && board[r][col] === player; r--) up++;
  for (let r = row + 1; r < boardSize && board[r][col] === player; r++) down++;
  maxLength = Math.max(maxLength, up + down + 1);
  
  // Check main diagonal (if relevant)
  if (Math.abs(row - col) < boardSize) {
    let diagUp = 0, diagDown = 0;
    let r = row - 1, c = col - 1;
    while (r >= 0 && c >= 0 && board[r][c] === player) {
      diagUp++;
      r--;
      c--;
    }
    r = row + 1;
    c = col + 1;
    while (r < boardSize && c < boardSize && board[r][c] === player) {
      diagDown++;
      r++;
      c++;
    }
    maxLength = Math.max(maxLength, diagUp + diagDown + 1);
  }
  
  // Check anti-diagonal (if relevant)
  if (row + col >= 0 && row + col < 2 * boardSize) {
    let diagUp = 0, diagDown = 0;
    let r = row - 1, c = col + 1;
    while (r >= 0 && c < boardSize && board[r][c] === player) {
      diagUp++;
      r--;
      c++;
    }
    r = row + 1;
    c = col - 1;
    while (r < boardSize && c >= 0 && board[r][c] === player) {
      diagDown++;
      r++;
      c--;
    }
    maxLength = Math.max(maxLength, diagUp + diagDown + 1);
  }
  
  return maxLength;
}

/**
 * Calculate center proximity score (scaled by board size)
 * Smaller boards = stronger center bias
 * Larger boards = weaker center bias
 */
function getCenterProximityScore(
  row: number,
  col: number,
  boardSize: number
): number {
  const center = (boardSize - 1) / 2;
  const maxDistance = Math.sqrt(2 * center * center);
  const distance = Math.sqrt(
    Math.pow(row - center, 2) + Math.pow(col - center, 2)
  );
  
  // Normalize to 0-1 range, then scale down for larger boards
  const proximity = 1 - (distance / maxDistance);
  const sizeScaling = 3 / boardSize; // Weaker for larger boards
  
  return proximity * sizeScaling * 5; // Max ~5 points for 3×3 center
}

/**
 * Evaluate a move for NxN board
 * 
 * Returns a score (higher = better):
 * - 1000: Immediate win
 * - 900: Block opponent win
 * - 10-90: Extend existing line (10 points per additional mark)
 * - 0-5: Center proximity
 * - -10000: Invalid move
 */
export function evaluateMoveNxN(
  state: GameState,
  moveIndex: number,
  botPlayer: Player
): number {
  const board = state.board;
  const boardSize = board.length;
  const position = indexToPosition(moveIndex, boardSize);
  const { row, col } = position;
  
  // Check if move is valid
  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
    return -10000;
  }
  if (board[row][col] !== null) {
    return -10000;
  }
  
  const opponent = getOpponent(botPlayer);
  let score = 0;
  
  // Priority 1: Immediate win (complete N-in-a-row)
  if (wouldWin(board, row, col, botPlayer)) {
    return 1000;
  }
  
  // Priority 2: Block opponent's immediate win
  if (wouldWin(board, row, col, opponent)) {
    score += 900;
  }
  
  // Priority 3: Line extension
  // Temporarily place the mark to evaluate line strength
  board[row][col] = botPlayer;
  const lineLength = getLongestLine(board, row, col, botPlayer);
  board[row][col] = null; // Restore
  
  // Score based on line length: longer lines are much better
  // This encourages building toward N-in-a-row
  score += lineLength * 10;
  
  // Priority 4: Center proximity (scaled by board size)
  score += getCenterProximityScore(row, col, boardSize);
  
  return score;
}
