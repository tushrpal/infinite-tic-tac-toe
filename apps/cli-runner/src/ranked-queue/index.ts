/**
 * Ranked Queue & Matchmaking Module
 * 
 * Local-only ranked queue system that simulates online matchmaking.
 * 
 * Key Features:
 * - Mode-specific queues (Mode 1 / Mode 2)
 * - Rank-aware matchmaking (±1 tier)
 * - 30-second timeout with bot fallback
 * - Deterministic and backend-ready
 * 
 * Usage:
 * ```typescript
 * const controller = new RankedQueueController();
 * const result = await controller.findMatch("player123", "Silver II", "mode1");
 * 
 * if (result.type === "human") {
 *   // Start PvP match
 * } else {
 *   // Start bot match with result.botDifficulty
 * }
 * ```
 */

// Core Types
export type { QueueTicket, MatchmakingResult } from "./QueueTicket";

// Queue Management
export { RankedQueue } from "./RankedQueue";
export {
  RankedQueueController,
  DEFAULT_QUEUE_CONFIG,
  type QueueConfig,
  type QueueEvent,
} from "./RankedQueueController";

// Matching Logic
export { MatchmakingRules } from "./MatchmakingRules";
export { BotFallbackResolver, type BotDifficulty } from "./BotFallbackResolver";

// Examples
export * from "./examples";
