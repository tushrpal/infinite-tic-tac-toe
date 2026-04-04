/**
 * Heuristic Bot - Configurable difficulty
 * 
 * Now supports NxN boards (3×3, 4×4, 5×5, etc.) and difficulty configuration
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
 * 
 * Difficulty is controlled via HeuristicConfig which tunes:
 * - Randomness (move selection variance)
 * - Block weight (blocking priority)
 * - Extend weight (line building aggression)
 * - Center weight (positional bias)
 */

import { Modes } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
import { getCurrentPlayer as getCurrentPlayerFromState } from '../core/utils.js';
import { getValidMoves } from '../core/types.js';
import type { HeuristicConfig } from '../core/types.js';
import { evaluateMove } from './evaluator.js';
import { evaluateMoveNxN } from './evaluatorNxN.js';
import { getPositionScore } from '../core/utils.js';
import type { Bot, GameState } from '../core/types.js';
import { DEFAULT_CONFIG } from './config.js';

/**
 * Heuristic Bot implementation with configurable difficulty
 */
export class HeuristicBot implements Bot {
  private config: HeuristicConfig;

  /**
   * Create a new Heuristic Bot with optional configuration
   * 
   * @param config - Optional configuration (defaults to Medium difficulty)
   */
  constructor(config?: HeuristicConfig) {
    this.config = config ?? DEFAULT_CONFIG;
  }

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
      
      // Detect Mode 1 (Infinite3x3 with sliding) vs Mode 2 (standard NxN)
      // Mode 1 has playerMarks field, Mode 2 doesn't
      const isMode1 = 'playerMarks' in state && state.playerMarks !== undefined;
      
      // Use appropriate evaluator
      if (isMode1 && boardSize === 3) {
        // Mode 1: 3×3 with sliding rule - use original evaluator
        score = evaluateMove(state as Infinite3x3State, moveIndex, botPlayer, this.config);
      } else {
        // Mode 2: Standard NxN (any size) - use NxN evaluator
        score = evaluateMoveNxN(state, moveIndex, botPlayer, this.config);
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
    
    // Apply randomness based on configuration
    const bestScore = moveScores[0].score;
    let candidateMoves = moveScores.filter(m => m.score === bestScore);
    
    // Intelligently limit candidate pool based on randomness setting
    // Lower randomness = fewer candidates = more deterministic play
    if (this.config.randomness <= 0.05) {
      // Hard: Nearly deterministic - only consider absolute best move(s)
      // Allow slight variation (top 1-2) to prevent mirroring
      candidateMoves = candidateMoves.slice(0, Math.min(2, candidateMoves.length));
    } else if (this.config.randomness < 0.2) {
      // Moderate-Hard: Top 2-3 moves
      candidateMoves = candidateMoves.slice(0, Math.min(3, candidateMoves.length));
    } else if (this.config.randomness < 0.5) {
      // Medium: Consider top 3-4 moves with best score
      candidateMoves = candidateMoves.slice(0, Math.min(4, candidateMoves.length));
    }
    // For higher randomness, keep all moves with best score
    
    // Randomly select among candidate moves
    const randomIndex = Math.floor(Math.random() * candidateMoves.length);
    return candidateMoves[randomIndex].index;
  }
}

/**
 * Factory function to create a Heuristic Bot
 * 
 * @param config - Optional configuration for difficulty tuning
 */
export function createHeuristicBot(config?: HeuristicConfig): Bot {
  return new HeuristicBot(config);
}

