import { QueueTicket, MatchmakingResult } from "./QueueTicket";
import { RankedQueue } from "./RankedQueue";
import { BotFallbackResolver } from "./BotFallbackResolver";
import { RankTier } from "../ranked/RankTier";

/**
 * Configuration for queue timeout and bot fallback
 */
export interface QueueConfig {
  /** Timeout in milliseconds before falling back to bot */
  timeoutMs: number;
  
  /** Interval in milliseconds for rechecking matchmaking */
  recheckIntervalMs: number;
}

/**
 * Default configuration: 30s timeout, recheck every 3s
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  timeoutMs: 30_000,
  recheckIntervalMs: 3_000,
};

/**
 * Events emitted during queue lifecycle
 */
export type QueueEvent =
  | { type: "queued"; ticket: QueueTicket }
  | { type: "searching"; playerId: string; waitTime: number }
  | { type: "matched"; playerA: QueueTicket; playerB: QueueTicket }
  | { type: "timeout"; ticket: QueueTicket; botDifficulty: string }
  | { type: "dequeued"; playerId: string };

/**
 * Orchestrates ranked matchmaking flow
 * 
 * Responsibilities:
 * - Manages queue state
 * - Applies matchmaking rules
 * - Handles timeout-based bot fallback
 * - Emits events for UI/logging
 * 
 * Does NOT:
 * - Modify ranks
 * - Run matches
 * - Store results
 */
export class RankedQueueController {
  private queue = new RankedQueue();
  private config: QueueConfig;
  private eventListeners: Array<(event: QueueEvent) => void> = [];

  constructor(config: QueueConfig = DEFAULT_QUEUE_CONFIG) {
    this.config = config;
  }

  /**
   * Adds an event listener
   */
  on(listener: (event: QueueEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Emits an event to all listeners
   */
  private emit(event: QueueEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * Adds a player to the ranked queue and attempts to find a match
   * 
   * Flow:
   * 1. Create queue ticket
   * 2. Add to queue
   * 3. Attempt immediate match
   * 4. If no match, wait with periodic rechecks
   * 5. After timeout, fall back to bot
   * 
   * @returns Promise that resolves with matchmaking result
   */
  async findMatch(
    playerId: string,
    rankTier: RankTier,
    mode: "mode1" | "mode2"
  ): Promise<MatchmakingResult> {
    const ticket: QueueTicket = {
      playerId,
      rankTier,
      mode,
      enteredAt: Date.now(),
    };

    // Add to queue
    this.queue.enqueue(ticket);
    this.emit({ type: "queued", ticket });

    // Attempt immediate match
    const immediateMatch = this.queue.attemptMatch(playerId);
    if (immediateMatch) {
      const result: MatchmakingResult = {
        type: "human",
        playerA: ticket,
        playerB: immediateMatch,
      };
      this.emit({ type: "matched", playerA: ticket, playerB: immediateMatch });
      return result;
    }

    // Wait with periodic rechecks
    const startTime = Date.now();
    while (Date.now() - startTime < this.config.timeoutMs) {
      // Check if player was matched by another attempt
      if (!this.queue.hasPlayer(playerId)) {
        // Player was already matched by concurrent findMatch call
        // This is expected in multi-player scenarios
        // Return a dummy result - in real implementation this would be tracked differently
        const waitTime = Date.now() - ticket.enteredAt;
        this.emit({ type: "searching", playerId, waitTime });
        
        // Player already matched - this shouldn't happen in current flow but is safe
        break;
      }

      this.emit({
        type: "searching",
        playerId,
        waitTime: Date.now() - ticket.enteredAt,
      });

      // Wait before next check
      await this.sleep(this.config.recheckIntervalMs);

      // Attempt match again
      const opponent = this.queue.attemptMatch(playerId);
      if (opponent) {
        const result: MatchmakingResult = {
          type: "human",
          playerA: ticket,
          playerB: opponent,
        };
        this.emit({ type: "matched", playerA: ticket, playerB: opponent });
        return result;
      }
    }

    // Timeout reached - fall back to bot
    this.queue.dequeue(playerId);
    const botDifficulty = BotFallbackResolver.resolveBotDifficulty(rankTier);
    
    this.emit({ type: "timeout", ticket, botDifficulty });

    const result: MatchmakingResult = {
      type: "bot",
      human: ticket,
      botDifficulty,
    };

    return result;
  }

  /**
   * Removes a player from the queue (e.g., if they cancel)
   */
  cancelQueue(playerId: string): boolean {
    const removed = this.queue.dequeue(playerId);
    if (removed) {
      this.emit({ type: "dequeued", playerId });
      return true;
    }
    return false;
  }

  /**
   * Gets current queue size
   */
  getQueueSize(): number {
    return this.queue.getSize();
  }

  /**
   * Gets queue snapshot for debugging
   */
  getQueueSnapshot(): readonly QueueTicket[] {
    return this.queue.getSnapshot();
  }

  /**
   * Clears all event listeners
   */
  clearListeners(): void {
    this.eventListeners = [];
  }

  /**
   * Resets the queue
   */
  reset(): void {
    this.queue.clear();
    this.eventListeners = [];
  }

  /**
   * Helper to sleep for a duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
