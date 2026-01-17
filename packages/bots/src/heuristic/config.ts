/**
 * Difficulty Configuration for Heuristic Bot
 * 
 * Defines strategic parameters for each difficulty level:
 * - Easy: Uses Random Bot (not configured here)
 * - Medium: Current balanced behavior (baseline)
 * - Hard: Aggressively tuned for strong play
 * 
 * Philosophy:
 * - Easy = Random (no heuristics)
 * - Medium = Fair heuristic baseline
 * - Hard = Same heuristic, sharper priorities
 * 
 * Key Principle: Configuration over branching
 * - One heuristic system
 * - Behavior emerges from weights
 * - Mode-agnostic (works for Mode 1 & 2)
 */

import { Difficulty, type HeuristicConfig } from '../core/types.js';

/**
 * Medium difficulty configuration (baseline)
 * This preserves the current bot behavior
 * 
 * Characteristics:
 * - Moderate randomness (30% variance among top moves)
 * - Strong blocking (900 vs 10000 win)
 * - Standard line extension
 * - Normal center preference
 */
export const MEDIUM_CONFIG: HeuristicConfig = {
  randomness: 0.3,      // Select randomly among top 3-4 equal moves
  blockWeight: 900,     // Strong blocking priority (90% of win value)
  extendWeight: 10,     // Standard line extension value
  centerWeight: 1.0,    // Normal center bias
};

/**
 * Hard difficulty configuration
 * Dramatically reduces randomness and massively increases strategic focus
 * 
 * Key characteristics:
 * - Near-deterministic play (5% randomness)
 * - Blocking is 90% as valuable as winning
 * - Aggressively extends lines (8x stronger than Medium)
 * - Reduced positional bias (focuses on threats)
 */
export const HARD_CONFIG: HeuristicConfig = {
  randomness: 0.05,     // Nearly deterministic - 95% best move selection
  blockWeight: 9000,    // Blocking is critical (90% of win priority)
  extendWeight: 80,     // Extremely aggressive line building (8x Medium)
  centerWeight: 0.5,    // Significantly reduced center bias
};

/**
 * Get configuration for specified difficulty level
 * Easy difficulty returns null (should use Random Bot instead)
 */
export function getConfig(difficulty: Difficulty): HeuristicConfig | null {
  switch (difficulty) {
    case Difficulty.Easy:
      return null; // Easy uses Random Bot
    case Difficulty.Medium:
      return MEDIUM_CONFIG;
    case Difficulty.Hard:
      return HARD_CONFIG;
    default:
      return MEDIUM_CONFIG;
  }
}

/**
 * Default configuration (Medium)
 */
export const DEFAULT_CONFIG = MEDIUM_CONFIG;
