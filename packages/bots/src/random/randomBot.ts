/**
 * Random Bot - Easy difficulty
 * 
 * Selects randomly from all valid moves.
 * Used for baseline testing and engine stress-testing.
 */

import { Modes } from '@infinite-ttt/game-engine';

type Infinite3x3State = ReturnType<typeof Modes.Infinite3x3.createInitialState>;
import type { Bot } from '../core/types';
import { getValidMoves } from '../core/types';

/**
 * Random number generator function type
 * Allows injecting randomness for testing
 */
export type RandomGenerator = () => number;

/**
 * Default random generator using Math.random
 */
const defaultRandom: RandomGenerator = () => Math.random();

/**
 * Random Bot implementation
 */
export class RandomBot implements Bot {
  private random: RandomGenerator;

  /**
   * Create a new Random Bot
   * 
   * @param random - Optional random number generator (defaults to Math.random)
   */
  constructor(random?: RandomGenerator) {
    this.random = random ?? defaultRandom;
  }

  /**
   * Get a random valid move
   * 
   * @param state - Current game state
   * @returns Board index (0-8) for a randomly selected valid move
   */
  getMove(state: Infinite3x3State): number {
    const validMoves = getValidMoves(state);
    
    if (validMoves.length === 0) {
      // Should never happen if engine is working correctly, but handle gracefully
      throw new Error('No valid moves available');
    }
    
    // Select a random index from valid moves
    const randomIndex = Math.floor(this.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}

/**
 * Factory function to create a Random Bot with default randomness
 */
export function createRandomBot(): Bot {
  return new RandomBot();
}
