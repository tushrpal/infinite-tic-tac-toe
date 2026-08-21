/**
 * Bot Difficulty Resolver
 *
 * Maps player rating to appropriate bot type and difficulty level.
 * Ensures players face appropriately challenging AI opponents.
 */

import { Difficulty, type Bot, type HeuristicConfig } from './types.js';
import { createRandomBot } from '../random/randomBot.js';
import { createHeuristicBot } from '../heuristic/heuristicBot.js';
import { createMinimaxBot } from '../minimax/minimaxBot.js';
import { MEDIUM_CONFIG, HARD_CONFIG } from '../heuristic/config.js';

/**
 * Bot type identifiers
 */
export type BotType = 'random' | 'heuristic' | 'minimax';

/**
 * Result of bot difficulty resolution
 */
export interface BotSelection {
  botType: BotType;
  difficulty: Difficulty;
  instance: Bot;
  ratingRange: [number, number];
  reasoning: string;
}

/**
 * Bot difficulty configuration mapping
 * Based on player rating tiers
 */
export const BOT_DIFFICULTY_CONFIG = {
  BRONZE: {
    type: 'random' as BotType,
    difficulty: Difficulty.Easy,
    ratingRange: [0, 999] as [number, number],
    reasoning: 'Bronze players learning fundamentals',
  },
  SILVER: {
    type: 'heuristic' as BotType,
    difficulty: Difficulty.Medium,
    config: MEDIUM_CONFIG,
    ratingRange: [1000, 1499] as [number, number],
    reasoning: 'Silver players developing strategy',
  },
  GOLD: {
    type: 'heuristic' as BotType,
    difficulty: Difficulty.Medium,
    config: MEDIUM_CONFIG,
    ratingRange: [1500, 1999] as [number, number],
    reasoning: 'Gold players refining tactics',
  },
  PLATINUM: {
    type: 'heuristic' as BotType,
    difficulty: Difficulty.Hard,
    config: HARD_CONFIG,
    ratingRange: [2000, 2499] as [number, number],
    reasoning: 'Platinum players need advanced challenge',
  },
  DIAMOND: {
    type: 'minimax' as BotType,
    difficulty: Difficulty.Hard,
    depth: 9, // Full game tree for 3x3
    ratingRange: [2500, 9999] as [number, number],
    reasoning: 'Diamond players face perfect play',
  },
} as const;

/**
 * Resolve bot type and difficulty for a given player rating
 *
 * @param rating - Player's current rating
 * @returns BotSelection with bot type, difficulty, and instance
 */
export function resolveForRank(rating: number): BotSelection {
  // Determine tier based on rating
  if (rating < 1000) {
    const config = BOT_DIFFICULTY_CONFIG.BRONZE;
    return {
      botType: config.type,
      difficulty: config.difficulty,
      instance: createRandomBot(),
      ratingRange: config.ratingRange,
      reasoning: config.reasoning,
    };
  } else if (rating < 1500) {
    const config = BOT_DIFFICULTY_CONFIG.SILVER;
    return {
      botType: config.type,
      difficulty: config.difficulty,
      instance: createHeuristicBot(config.config),
      ratingRange: config.ratingRange,
      reasoning: config.reasoning,
    };
  } else if (rating < 2000) {
    const config = BOT_DIFFICULTY_CONFIG.GOLD;
    return {
      botType: config.type,
      difficulty: config.difficulty,
      instance: createHeuristicBot(config.config),
      ratingRange: config.ratingRange,
      reasoning: config.reasoning,
    };
  } else if (rating < 2500) {
    const config = BOT_DIFFICULTY_CONFIG.PLATINUM;
    return {
      botType: config.type,
      difficulty: config.difficulty,
      instance: createHeuristicBot(config.config),
      ratingRange: config.ratingRange,
      reasoning: config.reasoning,
    };
  } else {
    const config = BOT_DIFFICULTY_CONFIG.DIAMOND;
    return {
      botType: config.type,
      difficulty: config.difficulty,
      instance: createMinimaxBot(config.depth),
      ratingRange: config.ratingRange,
      reasoning: config.reasoning,
    };
  }
}

/**
 * Create a bot instance from a BotSelection
 * (Useful if you need to recreate a bot with the same config)
 *
 * @param selection - BotSelection containing bot type and difficulty
 * @returns New bot instance with the same configuration
 */
export function createBotInstance(selection: BotSelection): Bot {
  switch (selection.botType) {
    case 'random':
      return createRandomBot();
    case 'heuristic':
      const config = selection.difficulty === Difficulty.Medium ? MEDIUM_CONFIG : HARD_CONFIG;
      return createHeuristicBot(config);
    case 'minimax':
      return createMinimaxBot(9);
    default:
      throw new Error(`Unknown bot type: ${selection.botType}`);
  }
}

/**
 * Get human-readable bot name for UI display
 *
 * @param botType - Type of bot
 * @param difficulty - Difficulty level
 * @returns Display name (e.g., "Bot (Medium)")
 */
export function getBotDisplayName(botType: BotType, difficulty: Difficulty): string {
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return `Bot (${difficultyLabel})`;
}
