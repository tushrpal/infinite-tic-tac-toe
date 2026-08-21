/**
 * Bot-related type definitions for the backend
 */

import type { BotType } from '@infinite-ttt/bots';
import { Difficulty } from '@infinite-ttt/bots';

/**
 * Bot information for a match participant
 */
export interface BotInfo {
  playerId: string;
  username: string;
  isBot: true;
  botType: BotType;
  difficulty: Difficulty;
  rating: number;
}

/**
 * Type guard to check if a player is a bot
 */
export function isBotInfo(player: any): player is BotInfo {
  return player?.isBot === true;
}
