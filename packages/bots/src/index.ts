/**
 * Public exports for the bots package
 * 
 * This is the main entry point for bot implementations.
 */

// Core bot types and interfaces
export type { Bot } from './core/types';
export { getValidMoves, positionToIndex, indexToPosition } from './core/types';

// Bot implementations
export { RandomBot, createRandomBot } from './random/randomBot';
export { HeuristicBot, createHeuristicBot } from './heuristic/heuristicBot';

// Utility types (for advanced users)
export type { RandomGenerator } from './random/randomBot';
