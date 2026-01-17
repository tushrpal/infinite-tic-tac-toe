/**
 * NxN-Aware Heuristic Evaluation
 * 
 * Evaluates moves on any board size (3×3, 4×4, 5×5, ...)
 * with N-in-a-row win conditions.
 * 
 * Now supports difficulty configuration via HeuristicConfig:
 * - blockWeight: Controls blocking priority
 * - extendWeight: Controls line extension priority
 * - centerWeight: Controls center proximity bias
 * 
 * Fork Detection (Hard mode only):
 * - Detects when a move allows opponent to create 2+ winning threats
 * - Auto-disables on large boards (forks less critical on 4×4+)
 * 
 * Priority Order:
 * 1. Immediate win (complete N-in-a-row)
 * 2. Immediate block (prevent opponent's N-in-a-row) - scaled by blockWeight
 * 2.5. Fork prevention (Hard mode, 3×3 only) - prevent dual threats
 * 3. Line extension (prefer moves that extend existing lines) - scaled by extendWeight
 * 4. Center bias (scaled by board size and centerWeight)
 * 5. Random valid move
 */

import type { Player } from '@infinite-ttt/game-engine';
import { getOpponent } from '@infinite-ttt/game-engine';
import type { GameState, HeuristicConfig } from '../core/types.js';
import { indexToPosition, positionToIndex, getValidMoves } from '../core/types.js';
import { DEFAULT_CONFIG } from './config.js';

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
 * Calculate center proximity score (scaled by board size and config)
 * Smaller boards = stronger center bias
 * Larger boards = weaker center bias
 * 
 * @param row - Row position
 * @param col - Column position
 * @param boardSize - Size of the board
 * @param centerWeight - Configuration multiplier for center bias
 */
function getCenterProximityScore(
  row: number,
  col: number,
  boardSize: number,
  centerWeight: number
): number {
  const center = (boardSize - 1) / 2;
  const maxDistance = Math.sqrt(2 * center * center);
  const distance = Math.sqrt(
    Math.pow(row - center, 2) + Math.pow(col - center, 2)
  );
  
  // Normalize to 0-1 range, then scale down for larger boards
  const proximity = 1 - (distance / maxDistance);
  const sizeScaling = 3 / boardSize; // Weaker for larger boards
  
  return proximity * sizeScaling * 5 * centerWeight; // Apply config weight
}

/**
 * Count how many immediate winning moves a player has in a given state (NxN version)
 * Used for fork detection in Hard mode on 3×3 boards
 * 
 * @param state - Current game state
 * @param player - Player to count winning moves for
 * @returns Number of moves that would result in an immediate win
 */
function countImmediateWinningMoves(state: GameState, player: Player): number {
  const board = state.board;
  const boardSize = board.length;
  const validMoves = getValidMoves(state);
  let winningMoveCount = 0;
  
  for (const moveIndex of validMoves) {
    const position = indexToPosition(moveIndex, boardSize);
    const { row, col } = position;
    
    // Check if this move would result in a win
    if (wouldWin(board, row, col, player)) {
      winningMoveCount++;
    }
  }
  
  return winningMoveCount;
}

/**
 * Simulate a move on the board (lightweight version for fork detection)
 * Creates a copy of the state with the move applied
 * 
 * @param state - Current game state
 * @param moveIndex - Index of move to simulate
 * @param player - Player making the move
 * @returns New state with move applied
 */
function simulateMove(state: GameState, moveIndex: number, player: Player): GameState {
  const board = state.board;
  const boardSize = board.length;
  const position = indexToPosition(moveIndex, boardSize);
  const { row, col } = position;
  
  // Create a deep copy of the board
  const newBoard = board.map(row => [...row]);
  newBoard[row][col] = player;
  
  return {
    ...state,
    board: newBoard,
    currentTurn: state.currentTurn + 1,
  };
}

/**
 * Evaluate a move for NxN board with configurable difficulty
 * 
 * Returns a score (higher = better):
 * - 10000: Immediate win (always highest priority)
 * - blockWeight (900-9000): Block opponent win
 * - 8500 penalty: Allows opponent fork (Hard mode, 3×3 only)
 * - extendWeight * lineLength (10-800): Extend existing line
 * - 0-5 * centerWeight: Center proximity
 * - -10000: Invalid move
 * 
 * @param state - Current game state
 * @param moveIndex - Index of the move to evaluate
 * @param botPlayer - Player making the move
 * @param config - Optional difficulty configuration (defaults to Medium)
 */
export function evaluateMoveNxN(
  state: GameState,
  moveIndex: number,
  botPlayer: Player,
  config: HeuristicConfig = DEFAULT_CONFIG
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
  // Use explicit high value to ensure wins are always taken
  if (wouldWin(board, row, col, botPlayer)) {
    return 10000;
  }
  
  // Priority 2: Block opponent's immediate win (scaled by config)
  // Hard difficulty has blockWeight=9000, making blocks nearly as valuable as wins
  if (wouldWin(board, row, col, opponent)) {
    score += config.blockWeight;
  }
  
  // Priority 2.5: Fork Detection (Hard mode only, 3×3 boards only)
  // Forks are less critical on larger boards where threats are more spread out
  if (config.randomness <= 0.1 && boardSize === 3) { // Hard mode threshold
    // Simulate this move and check if opponent can create 2+ winning threats
    const simulatedState = simulateMove(state, moveIndex, botPlayer);
    const opponentForkCount = countImmediateWinningMoves(simulatedState, opponent);
    
    if (opponentForkCount >= 2) {
      // This move allows opponent to fork - heavily penalize it
      // Penalty is significant but lower than blocking an immediate win
      score -= 8500;
    }
  }
  
  // Priority 3: Line extension (scaled by config)
  // Temporarily place the mark to evaluate line strength
  board[row][col] = botPlayer;
  const lineLength = getLongestLine(board, row, col, botPlayer);
  board[row][col] = null; // Restore
  
  // Score based on line length: longer lines are much better
  // This encourages building toward N-in-a-row
  score += lineLength * config.extendWeight;
  
  // Priority 4: Center proximity (scaled by board size and config)
  score += getCenterProximityScore(row, col, boardSize, config.centerWeight);
  
  return score;
}
