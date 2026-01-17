/**
 * Heuristic Bot - Medium difficulty
 * 
 * Evaluates moves based on strategic priorities:
 * 1. Win immediately
 * 2. Block opponent win
 * 3. Create 2-in-a-row threats
 * 4. Control center/corners
 * 5. Avoid enabling opponent wins
 * 
 * Uses engine reducer for move simulation to account for sliding rule.
 */

import { Modes } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
import { getCurrentPlayer as getCurrentPlayerFromState } from '../core/utils';
import { getValidMoves } from '../core/types';
import { evaluateMove } from './evaluator';
import { getPositionScore } from '../core/utils';
import type { Bot } from '../core/types';

/**
 * Heuristic Bot implementation
 */
export class HeuristicBot implements Bot {
  /**
   * Get the best move based on heuristic evaluation
   * 
   * @param state - Current game state
   * @returns Board index (0-8) for the best move
   */
  getMove(state: Infinite3x3State): number {
    const validMoves = getValidMoves(state);
    
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }
    
    // Determine which player the bot is playing as
    const botPlayer = getCurrentPlayerFromState(state);
    
    // Evaluate all valid moves
    const moveScores: Array<{ index: number; score: number; positionScore: number }> = [];
    
    for (const moveIndex of validMoves) {
      const score = evaluateMove(state, moveIndex, botPlayer);
      const positionScore = getPositionScore(moveIndex);
      moveScores.push({ index: moveIndex, score, positionScore });
    }
    
    // Sort by score (descending), then by position score (descending) for tie-breaking
    moveScores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return b.positionScore - a.positionScore; // Tie-break by position
    });
    
    // Return the best move (first in sorted array)
    return moveScores[0].index;
  }
}

/**
 * Factory function to create a Heuristic Bot
 */
export function createHeuristicBot(): Bot {
  return new HeuristicBot();
}
