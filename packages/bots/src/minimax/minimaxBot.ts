/**
 * Minimax Bot - Perfect play with alpha-beta pruning
 *
 * Implements the minimax algorithm with alpha-beta pruning for optimal play.
 * Provides perfect tactical play within the search depth limit.
 *
 * Features:
 * - Alpha-beta pruning for efficiency
 * - Configurable search depth
 * - Mode 1 (3×3 sliding) and Mode 2 (NxN) support
 * - Position evaluation heuristics for depth-limited search
 *
 * Search depths by board size (recommended):
 * - 3×3: depth 9+ (perfect play, searches full tree)
 * - 4×4: depth 4-6 (strong tactical play)
 * - 5×5: depth 3-4 (strategic play with good tactics)
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Player } from '@infinite-ttt/game-engine';
import type { Bot, GameState } from '../core/types.js';
import { getValidMoves, indexToPosition, positionToIndex } from '../core/types.js';

// Type guards for mode detection
type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
type ExpandingBoardState = ReturnType<typeof Modes.ExpandingBoard.createInitialState>;

interface MinimaxConfig {
  /** Maximum search depth (higher = stronger but slower) */
  maxDepth: number;
}

const DEFAULT_DEPTH_BY_SIZE: Record<number, number> = {
  3: 9,  // Full search for 3×3
  4: 5,  // Tactical for 4×4
  5: 3,  // Strategic for 5×5
};

/**
 * Minimax Bot with alpha-beta pruning
 */
export class MinimaxBot implements Bot {
  private config: MinimaxConfig;
  private nodesEvaluated: number = 0;

  constructor(maxDepth?: number) {
    this.config = {
      maxDepth: maxDepth ?? 9,
    };
  }

  /**
   * Get the winner from state (handles both Mode 1 and Mode 2)
   */
  private getWinner(state: GameState): any {
    // Mode 2 uses roundWinner, Mode 1 uses winner
    return ('roundWinner' in state) ? state.roundWinner : state.winner;
  }

  /**
   * Get the best move using minimax with alpha-beta pruning
   */
  getMove(state: GameState): number {
    // Check if game is already won
    const winner = this.getWinner(state);
    if (winner !== null) {
      throw new Error('No valid moves available');
    }

    const validMoves = getValidMoves(state);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    // Quick optimization: if only one move, return it
    if (validMoves.length === 1) {
      return validMoves[0];
    }

    const boardSize = state.board.length;
    const currentPlayer = this.getCurrentPlayer(state);

    // Adjust depth based on board size if using default
    let searchDepth = this.config.maxDepth;
    if (this.config.maxDepth === 9 && boardSize !== 3) {
      searchDepth = DEFAULT_DEPTH_BY_SIZE[boardSize] ?? 3;
    }

    this.nodesEvaluated = 0;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    // Evaluate each valid move
    for (const moveIndex of validMoves) {
      const newState = this.simulateMove(state, moveIndex, currentPlayer);
      const score = this.minimax(
        newState,
        searchDepth - 1,
        alpha,
        beta,
        false, // Next level is minimizing
        currentPlayer
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = moveIndex;
      }

      alpha = Math.max(alpha, score);
    }

    return bestMove;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   *
   * @param state - Current game state
   * @param depth - Remaining search depth
   * @param alpha - Alpha value for pruning
   * @param beta - Beta value for pruning
   * @param isMaximizing - Whether this is a maximizing node
   * @param originalPlayer - The player we're optimizing for
   */
  private minimax(
    state: GameState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    originalPlayer: Player
  ): number {
    this.nodesEvaluated++;

    // Terminal conditions
    const winner = this.getWinner(state);
    if (winner !== null) {
      // Win/loss evaluation
      if (winner === originalPlayer) {
        return 10000 + depth; // Prefer faster wins
      } else {
        return -10000 - depth; // Prefer slower losses
      }
    }

    const validMoves = getValidMoves(state);

    // Draw or depth limit reached
    if (validMoves.length === 0 || depth === 0) {
      return this.evaluatePosition(state, originalPlayer);
    }

    const currentPlayer = this.getCurrentPlayer(state);

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (const moveIndex of validMoves) {
        const newState = this.simulateMove(state, moveIndex, currentPlayer);
        const score = this.minimax(newState, depth - 1, alpha, beta, false, originalPlayer);

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);

        // Alpha-beta pruning
        if (beta <= alpha) {
          break;
        }
      }

      return maxScore;
    } else {
      let minScore = Infinity;

      for (const moveIndex of validMoves) {
        const newState = this.simulateMove(state, moveIndex, currentPlayer);
        const score = this.minimax(newState, depth - 1, alpha, beta, true, originalPlayer);

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);

        // Alpha-beta pruning
        if (beta <= alpha) {
          break;
        }
      }

      return minScore;
    }
  }

  /**
   * Evaluate a non-terminal position heuristically
   */
  private evaluatePosition(state: GameState, player: Player): number {
    const opponent = player === 'X' ? 'O' : 'X';
    const boardSize = state.board.length;

    let score = 0;

    // Mode 1 (3×3 sliding) vs Mode 2 (NxN standard)
    const isMode1 = 'playerMarks' in state && state.playerMarks !== undefined;

    if (isMode1 || boardSize === 3) {
      // 3×3 evaluation (works for both modes)
      score += this.evaluate3x3Lines(state.board, player) * 10;
      score -= this.evaluate3x3Lines(state.board, opponent) * 10;
    } else {
      // NxN evaluation for larger boards
      score += this.evaluateNxNLines(state.board, boardSize, player) * 10;
      score -= this.evaluateNxNLines(state.board, boardSize, opponent) * 10;
    }

    // Center control bonus (scaled by board size)
    const centerBonus = 5 / boardSize;
    score += this.evaluateCenterControl(state.board, player) * centerBonus;
    score -= this.evaluateCenterControl(state.board, opponent) * centerBonus;

    return score;
  }

  /**
   * Evaluate 3×3 lines (8 possible lines)
   */
  private evaluate3x3Lines(board: any[][], player: Player): number {
    let score = 0;

    // All 8 winning lines for 3×3
    const lines = [
      // Rows
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      // Columns
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      // Diagonals
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ];

    for (const line of lines) {
      let playerCount = 0;
      let opponentCount = 0;

      for (const [row, col] of line) {
        const cell = board[row][col];
        if (cell === player) playerCount++;
        else if (cell !== null) opponentCount++;
      }

      // Only score lines that aren't blocked
      if (opponentCount === 0) {
        if (playerCount === 2) score += 100; // Two in a row - strong threat
        else if (playerCount === 1) score += 10; // One in a row - potential
      }
    }

    return score;
  }

  /**
   * Evaluate NxN lines (all rows, columns, and diagonals)
   */
  private evaluateNxNLines(board: any[][], boardSize: number, player: Player): number {
    let score = 0;
    const opponent = player === 'X' ? 'O' : 'X';

    // Check all rows
    for (let row = 0; row < boardSize; row++) {
      let playerCount = 0;
      let emptyCount = 0;

      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === player) playerCount++;
        else if (board[row][col] === null) emptyCount++;
      }

      score += this.scoreLineSegment(playerCount, emptyCount, boardSize);
    }

    // Check all columns
    for (let col = 0; col < boardSize; col++) {
      let playerCount = 0;
      let emptyCount = 0;

      for (let row = 0; row < boardSize; row++) {
        if (board[row][col] === player) playerCount++;
        else if (board[row][col] === null) emptyCount++;
      }

      score += this.scoreLineSegment(playerCount, emptyCount, boardSize);
    }

    // Main diagonal
    {
      let playerCount = 0;
      let emptyCount = 0;

      for (let i = 0; i < boardSize; i++) {
        if (board[i][i] === player) playerCount++;
        else if (board[i][i] === null) emptyCount++;
      }

      score += this.scoreLineSegment(playerCount, emptyCount, boardSize);
    }

    // Anti-diagonal
    {
      let playerCount = 0;
      let emptyCount = 0;

      for (let i = 0; i < boardSize; i++) {
        if (board[i][boardSize - 1 - i] === player) playerCount++;
        else if (board[i][boardSize - 1 - i] === null) emptyCount++;
      }

      score += this.scoreLineSegment(playerCount, emptyCount, boardSize);
    }

    return score;
  }

  /**
   * Score a line segment based on player marks and empty spaces
   */
  private scoreLineSegment(playerCount: number, emptyCount: number, boardSize: number): number {
    // Line is blocked by opponent
    if (playerCount + emptyCount < boardSize) {
      return 0;
    }

    // Score based on how close to winning
    if (playerCount === boardSize - 1) return 100; // One away from win - critical
    if (playerCount === boardSize - 2) return 20;  // Two away
    if (playerCount === boardSize - 3) return 5;   // Three away
    if (playerCount > 0) return 1;                  // Some presence

    return 0;
  }

  /**
   * Evaluate center control
   */
  private evaluateCenterControl(board: any[][], player: Player): number {
    const boardSize = board.length;
    const center = Math.floor(boardSize / 2);

    let score = 0;

    // Center cell (highest value)
    if (boardSize % 2 === 1 && board[center][center] === player) {
      score += 3;
    }

    // Near-center cells (for even boards or positions adjacent to center)
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === player) {
          const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
          score += Math.max(0, 2 - distFromCenter * 0.5);
        }
      }
    }

    return score;
  }

  /**
   * Simulate a move and return new state (without mutating original)
   */
  private simulateMove(state: GameState, moveIndex: number, player: Player): GameState {
    const boardSize = state.board.length;
    const isMode1 = 'playerMarks' in state && state.playerMarks !== undefined;

    if (isMode1) {
      return this.simulateMode1Move(state as Infinite3x3State, moveIndex, player);
    } else {
      return this.simulateMode2Move(state, moveIndex, player);
    }
  }

  /**
   * Simulate move for Mode 1 (3×3 with sliding)
   */
  private simulateMode1Move(state: Infinite3x3State, moveIndex: number, player: Player): GameState {
    const boardSize = 3;
    const { row, col } = indexToPosition(moveIndex, boardSize);

    // Deep copy state
    const newBoard = state.board.map(row => [...row]);
    const newPlayerMarks = { ...state.playerMarks };
    const newMoveHistory = [...state.moveHistory];

    // Get current player's marks
    const currentPlayerMarks = [...(newPlayerMarks[player] || [])];

    // Check if we need to remove oldest mark (sliding rule)
    let removedPosition = null;
    if (currentPlayerMarks.length >= 3) {
      // Find oldest mark
      const oldestMark = currentPlayerMarks.sort((a, b) => a.turn - b.turn)[0];
      if (oldestMark) {
        removedPosition = oldestMark.position;
        newBoard[removedPosition.row][removedPosition.col] = null;
        currentPlayerMarks.shift(); // Remove oldest
      }
    }

    // Place new mark
    newBoard[row][col] = player;
    const newTurn = state.currentTurn + 1;
    currentPlayerMarks.push({ player, position: { row, col }, turn: newTurn });

    // Update playerMarks
    newPlayerMarks[player] = currentPlayerMarks;

    // Check for winner
    let winner = null;
    if (this.checkWin3x3(newBoard, player)) {
      winner = player;
    }

    return {
      board: newBoard,
      currentTurn: newTurn,
      winner,
      moveHistory: newMoveHistory,
      playerMarks: newPlayerMarks,
    };
  }

  /**
   * Simulate move for Mode 2 (NxN standard)
   */
  private simulateMode2Move(state: GameState, moveIndex: number, player: Player): GameState {
    const boardSize = state.board.length;
    const { row, col } = indexToPosition(moveIndex, boardSize);

    // Deep copy state
    const newBoard = state.board.map(row => [...row]);
    const newMoveHistory = [...state.moveHistory];

    // Place mark
    newBoard[row][col] = player;
    const newTurn = state.currentTurn + 1;

    // Check for winner
    let winner = null;
    if (this.checkWinNxN(newBoard, boardSize, player)) {
      winner = player;
    }

    return {
      board: newBoard,
      currentTurn: newTurn,
      winner,
      moveHistory: newMoveHistory,
    };
  }

  /**
   * Check win for 3×3 board
   */
  private checkWin3x3(board: any[][], player: Player): boolean {
    const lines = [
      [[0, 0], [0, 1], [0, 2]], // Row 0
      [[1, 0], [1, 1], [1, 2]], // Row 1
      [[2, 0], [2, 1], [2, 2]], // Row 2
      [[0, 0], [1, 0], [2, 0]], // Col 0
      [[0, 1], [1, 1], [2, 1]], // Col 1
      [[0, 2], [1, 2], [2, 2]], // Col 2
      [[0, 0], [1, 1], [2, 2]], // Diagonal
      [[0, 2], [1, 1], [2, 0]], // Anti-diagonal
    ];

    return lines.some(line =>
      line.every(([row, col]) => board[row][col] === player)
    );
  }

  /**
   * Check win for NxN board (N-in-a-row)
   */
  private checkWinNxN(board: any[][], boardSize: number, player: Player): boolean {
    // Check rows
    for (let row = 0; row < boardSize; row++) {
      if (board[row].every(cell => cell === player)) {
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < boardSize; col++) {
      let allMatch = true;
      for (let row = 0; row < boardSize; row++) {
        if (board[row][col] !== player) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return true;
    }

    // Check main diagonal
    let mainDiagMatch = true;
    for (let i = 0; i < boardSize; i++) {
      if (board[i][i] !== player) {
        mainDiagMatch = false;
        break;
      }
    }
    if (mainDiagMatch) return true;

    // Check anti-diagonal
    let antiDiagMatch = true;
    for (let i = 0; i < boardSize; i++) {
      if (board[i][boardSize - 1 - i] !== player) {
        antiDiagMatch = false;
        break;
      }
    }
    if (antiDiagMatch) return true;

    return false;
  }

  /**
   * Get current player from state
   */
  private getCurrentPlayer(state: GameState): Player {
    return state.currentTurn % 2 === 0 ? 'X' : 'O';
  }
}

/**
 * Factory function to create a Minimax Bot
 *
 * @param maxDepth - Optional maximum search depth (default: 9 for 3×3, adaptive for larger)
 */
export function createMinimaxBot(maxDepth?: number): Bot {
  return new MinimaxBot(maxDepth);
}
