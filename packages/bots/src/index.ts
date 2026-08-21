/**
 * Public exports for the bots package
 *
 * This is the main entry point for bot implementations.
 */

// Core bot types and interfaces
export type { Bot, GameState, HeuristicConfig } from './core/types.js';
export { Difficulty } from './core/types.js';
export { getValidMoves, positionToIndex, indexToPosition } from './core/types.js';

// Bot implementations
export { RandomBot, createRandomBot } from './random/randomBot.js';
export { HeuristicBot, createHeuristicBot } from './heuristic/heuristicBot.js';
export { MinimaxBot, createMinimaxBot } from './minimax/minimaxBot.js';

// Difficulty configuration
export { getConfig, MEDIUM_CONFIG, HARD_CONFIG, DEFAULT_CONFIG } from './heuristic/config.js';

// Bot difficulty resolver (NEW for matchmaking integration)
export type { BotSelection, BotType } from './core/botResolver.js';
export {
  resolveForRank,
  createBotInstance,
  getBotDisplayName,
  BOT_DIFFICULTY_CONFIG
} from './core/botResolver.js';

// Utility types (for advanced users)
export type { RandomGenerator } from './random/randomBot.js';
