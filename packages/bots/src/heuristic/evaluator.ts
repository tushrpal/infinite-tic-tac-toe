/**
 * Heuristic evaluation logic for Medium difficulty bot
 * 
 * Evaluates board states and moves based on strategic priorities.
 * 
 * Fork Detection (Hard mode only):
 * - Detects when a move allows opponent to create 2+ winning threats
 * - Prevents classic corner-opposite-corner trap
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Player } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
type Board = Infinite3x3State['board'];
import { getOpponent } from '@infinite-ttt/game-engine';
import { indexToPosition, getValidMoves } from '../core/types.js';
import { getCurrentPlayer } from '../core/utils.js';
import { HEURISTIC_SCORES, BOARD_POSITIONS } from '../core/constants.js';
import type { HeuristicConfig } from '../core/types.js';
import { DEFAULT_CONFIG } from './config.js';

const { applyMove } = Modes.Infinite3x3;

/**
 * Check if a board has a 2-in-a-row threat for a player
 * This means the player has exactly 2 marks in a line with 1 empty space
 * 
 * @param board - Board state to check (after move is placed)
 * @param player - Player to check threats for
 * @returns true if player has a 2-in-a-row threat
 */
function createsTwoInARowThreat(board: Board, player: Player): boolean {
  // Win patterns (8 total: 3 horizontal, 3 vertical, 2 diagonal)
  const winPatterns = [
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
    [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
    [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
  ];

  // Check each pattern to see if player has exactly 2 marks with 1 empty
  for (const pattern of winPatterns) {
    let playerMarks = 0;
    let emptyCells = 0;

    for (const pos of pattern) {
      const cell = board[pos.row][pos.col];
      if (cell === player) {
        playerMarks++;
      } else if (cell === null) {
        emptyCells++;
      }
    }

    // A 2-in-a-row threat means: 2 marks, 1 empty (player can win next turn)
    if (playerMarks === 2 && emptyCells === 1) {
      return true;
    }
  }

  return false;
}

/**
 * Count how many immediate winning moves a player has in a given state
 * Used for fork detection in Hard mode
 * 
 * @param state - Current game state
 * @param player - Player to count winning moves for
 * @returns Number of moves that would result in an immediate win
 */
function countImmediateWinningMoves(state: Infinite3x3State, player: Player): number {
  const validMoves = getValidMoves(state);
  let winningMoveCount = 0;
  
  for (const moveIndex of validMoves) {
    const position = indexToPosition(moveIndex);
    // Simulate the opponent's move from the current state
    const simulatedState = applyMove(state, player, position);
    
    // If move was valid and results in a win for that player
    if (simulatedState !== state && simulatedState.winner === player) {
      winningMoveCount++;
    }
  }
  
  return winningMoveCount;
}


/**
 * Evaluate a move by simulating it and scoring the resulting state
 * 
 * @param state - Current game state
 * @param moveIndex - Board index (0-8) of the move to evaluate
 * @param botPlayer - The player the bot is playing as
 * @param config - Optional difficulty configuration (for fork detection in Hard mode)
 * @returns Numeric score for this move (higher = better)
 */
export function evaluateMove(
  state: Infinite3x3State,
  moveIndex: number,
  botPlayer: Player,
  config: HeuristicConfig = DEFAULT_CONFIG
): number {
  // Get the current player (whose turn it is)
  const currentPlayer = getCurrentPlayer(state);
  
  // Convert index to position
  const position = indexToPosition(moveIndex);
  
  // Check if opponent had a winning move before our move (using engine reducer)
  const opponent = getOpponent(botPlayer);
  const opponentHadWinningMove = checkOpponentWinningMove(state, opponent);
  
  // Simulate the move using the engine reducer (this handles sliding rule automatically)
  const simulatedState = applyMove(state, currentPlayer, position);
  
  // If move was invalid, return very low score
  if (simulatedState === state) {
    return -10000;
  }
  
  // Check the resulting board state
  const newBoard = simulatedState.board;
  // Use simulatedState.winner directly (computed by reducer)
  const winner = simulatedState.winner;
  
  let score = 0;
  
  // Priority 1: Bot wins immediately
  if (winner === botPlayer) {
    return HEURISTIC_SCORES.WIN_IMMEDIATE;
  }
  
  // Priority 2: Opponent wins (this shouldn't happen if we're blocking, but check anyway)
  if (winner === opponent) {
    return -2000; // Very bad
  }
  
  // Priority 2: Block opponent's immediate win
  // Check if opponent had a winning move and our move blocked it
  if (opponentHadWinningMove) {
    // Check if opponent can still win after our move (using engine reducer for accuracy)
    const opponentCanWinAfter = checkOpponentWinningMove(simulatedState, opponent);
    if (!opponentCanWinAfter) {
      // We blocked their winning move!
      score += HEURISTIC_SCORES.BLOCK_OPPONENT_WIN;
    }
  }
  
  // Priority 2.5: Fork Detection (Hard mode only)
  // Detect if this move allows opponent to create 2+ winning threats (a fork)
  // This is critical for preventing corner-opposite-corner traps
  if (config.randomness <= 0.1) { // Hard mode threshold
    const opponentForkCount = countImmediateWinningMoves(simulatedState, opponent);
    
    if (opponentForkCount >= 2) {
      // This move allows opponent to fork - heavily penalize it
      // Penalty is high but lower than blocking an immediate win
      score -= 8500;
    }
  }
  
  // Priority 3: Creates 2-in-a-row threat for bot
  // Check if bot has exactly 2 marks in a row (threat after move)
  if (createsTwoInARowThreat(newBoard, botPlayer)) {
    score += HEURISTIC_SCORES.CREATE_TWO_IN_A_ROW;
  }
  
  // Priority 5-6: Position value (center, corner, edge)
  if (moveIndex === BOARD_POSITIONS.CENTER) {
    score += HEURISTIC_SCORES.CENTER_CONTROL;
  } else if (BOARD_POSITIONS.CORNERS.includes(moveIndex as any)) {
    score += HEURISTIC_SCORES.CORNER_CONTROL;
  } else {
    score += HEURISTIC_SCORES.EDGE_CELL;
  }
  
  // Priority 7: Enables opponent win (check if opponent can win after our move)
  const opponentCanWinAfter = checkOpponentWinningMove(simulatedState, opponent);
  if (opponentCanWinAfter && !opponentHadWinningMove) {
    // Our move enabled their win (they couldn't win before, but can now)
    score += HEURISTIC_SCORES.ENABLE_OPPONENT_WIN;
  }
  
  return score;
}

/**
 * Check if opponent has a winning move available
 * Uses pattern checking to detect 2-in-a-row threats with 1 empty cell
 * This works regardless of whose turn it is
 * 
 * @param state - Current game state
 * @param opponent - Opponent player to check
 * @returns true if opponent can win on their next move
 */
function checkOpponentWinningMove(state: Infinite3x3State, opponent: Player): boolean {
  const board = state.board;
  
  // Win patterns (8 total: 3 horizontal, 3 vertical, 2 diagonal)
  const winPatterns = [
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
    [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
    [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
  ];
  
  // Check each pattern to see if opponent has exactly 2 marks with 1 empty
  for (const pattern of winPatterns) {
    let opponentMarks = 0;
    let emptyCells = 0;
    
    for (const pos of pattern) {
      const cell = board[pos.row][pos.col];
      if (cell === opponent) {
        opponentMarks++;
      } else if (cell === null) {
        emptyCells++;
      }
    }
    
    // If opponent has 2 marks with 1 empty cell, they can win on their next turn
    if (opponentMarks === 2 && emptyCells === 1) {
      return true;
    }
  }
  
  return false;
}
