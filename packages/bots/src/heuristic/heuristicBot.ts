/**
 * Heuristic Bot - Medium difficulty
 * 
 * Now supports NxN boards (3×3, 4×4, 5×5, etc.)
 * 
 * Evaluates moves based on strategic priorities:
 * 1. Win immediately (complete N-in-a-row)
 * 2. Block opponent win
 * 3. Extend existing lines (prefer longer lines)
 * 4. Center proximity (scaled by board size)
 * 
 * Uses different evaluators based on board size:
 * - 3×3: Original evaluator with sliding rule awareness
 * - NxN: New evaluator with N-in-a-row logic
 */

import { Modes } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
import { getCurrentPlayer as getCurrentPlayerFromState } from '../core/utils.js';
import { getValidMoves } from '../core/types.js';
import { evaluateMove } from './evaluator.js';
import { evaluateMoveNxN } from './evaluatorNxN.js';
import { getPositionScore } from '../core/utils.js';
import type { Bot, GameState } from '../core/types.js';

/**
 * Heuristic Bot implementation
 */
export class HeuristicBot implements Bot {
  /**
   * Get the best move based on heuristic evaluation
   * 
   * @param state - Current game state (any board size)
   * @returns Board index for the best move
   */
  getMove(state: GameState): number {
    const validMoves = getValidMoves(state);
    
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }
    
    // Determine which player the bot is playing as
    const botPlayer = getCurrentPlayerFromState(state);
    
    // Determine board size
    const boardSize = state.board.length;
    
    // Evaluate all valid moves
    const moveScores: Array<{ index: number; score: number; positionScore: number }> = [];
    
    for (const moveIndex of validMoves) {
      let score: number;
      
      // Use appropriate evaluator based on board size
      if (boardSize === 3) {
        // For 3×3, use original evaluator (handles sliding rule)
        score = evaluateMove(state as Infinite3x3State, moveIndex, botPlayer);
      } else {
        // For NxN (4×4, 5×5, etc.), use new NxN evaluator
        score = evaluateMoveNxN(state, moveIndex, botPlayer);
      }
      
      const positionScore = getPositionScore(moveIndex, boardSize);
      moveScores.push({ index: moveIndex, score, positionScore });
    }
    
    // Sort by score (descending), then by position score (descending) for tie-breaking
    moveScores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return b.positionScore - a.positionScore; // Tie-break by position
    });
    
    // Find all moves with the best score (to add randomness among equal moves)
    const bestScore = moveScores[0].score;
    const bestMoves = moveScores.filter(m => m.score === bestScore);
    
    // Randomly select among best moves to avoid deterministic loops
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIndex].index;
  }
}

/**
 * Factory function to create a Heuristic Bot
 */
export function createHeuristicBot(): Bot {
  return new HeuristicBot();
}
