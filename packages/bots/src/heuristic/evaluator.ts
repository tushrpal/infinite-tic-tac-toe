/**
 * Heuristic evaluation logic for Medium difficulty bot
 * 
 * Evaluates board states and moves based on strategic priorities.
 */

import { Modes } from '@infinite-ttt/game-engine';
import type { Player } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
type Board = Infinite3x3State['board'];
import { getOpponent } from '@infinite-ttt/game-engine';
import { indexToPosition } from '../core/types';
import { getCurrentPlayer } from '../core/utils';
import { HEURISTIC_SCORES, BOARD_POSITIONS } from '../core/constants';

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
 * Evaluate a move by simulating it and scoring the resulting state
 * 
 * @param state - Current game state
 * @param moveIndex - Board index (0-8) of the move to evaluate
 * @param botPlayer - The player the bot is playing as
 * @returns Numeric score for this move (higher = better)
 */
export function evaluateMove(
  state: Infinite3x3State,
  moveIndex: number,
  botPlayer: Player
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
