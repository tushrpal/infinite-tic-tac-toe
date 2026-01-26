import { RankTier } from "../ranked/RankTier";

/**
 * Represents a player's entry in the ranked queue
 */
export interface QueueTicket {
  /** Unique player identifier */
  playerId: string;
  
  /** Player's current rank tier */
  rankTier: RankTier;
  
  /** Game mode */
  mode: "mode1" | "mode2";
  
  /** Timestamp when player entered queue (ms since epoch) */
  enteredAt: number;
}

/**
 * Result of matchmaking attempt
 */
export type MatchmakingResult =
  | { type: "human"; playerA: QueueTicket; playerB: QueueTicket }
  | { type: "bot"; human: QueueTicket; botDifficulty: "easy" | "medium" | "hard" };
