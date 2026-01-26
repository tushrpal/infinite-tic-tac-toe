import { QueueTicket } from "./QueueTicket";
import { MatchmakingRules } from "./MatchmakingRules";

/**
 * Manages the ranked queue state
 * Handles player enqueue/dequeue and matchmaking attempts
 */
export class RankedQueue {
  private queue: QueueTicket[] = [];

  /**
   * Adds a player to the queue
   */
  enqueue(ticket: QueueTicket): void {
    this.queue.push(ticket);
  }

  /**
   * Removes a player from the queue by ID
   */
  dequeue(playerId: string): QueueTicket | null {
    const index = this.queue.findIndex((t) => t.playerId === playerId);
    if (index === -1) {
      return null;
    }

    const [ticket] = this.queue.splice(index, 1);
    return ticket;
  }

  /**
   * Attempts to find a match for a player
   * Returns the matched opponent if found, null otherwise
   * Automatically removes both players from queue if match is found
   */
  attemptMatch(playerId: string): QueueTicket | null {
    const playerIndex = this.queue.findIndex((t) => t.playerId === playerId);
    if (playerIndex === -1) {
      return null;
    }

    const player = this.queue[playerIndex];

    // Get all other players in queue
    const candidates = this.queue.filter((t) => t.playerId !== playerId);

    // Find best match
    const opponent = MatchmakingRules.findBestMatch(player, candidates);

    if (opponent) {
      // Remove both players from queue
      this.dequeue(playerId);
      this.dequeue(opponent.playerId);
    }

    return opponent;
  }

  /**
   * Gets current queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Gets time spent in queue for a player (in ms)
   */
  getWaitTime(playerId: string): number | null {
    const ticket = this.queue.find((t) => t.playerId === playerId);
    if (!ticket) {
      return null;
    }

    return Date.now() - ticket.enteredAt;
  }

  /**
   * Checks if a player is in the queue
   */
  hasPlayer(playerId: string): boolean {
    return this.queue.some((t) => t.playerId === playerId);
  }

  /**
   * Gets a copy of all tickets in queue (for debugging)
   */
  getSnapshot(): readonly QueueTicket[] {
    return [...this.queue];
  }

  /**
   * Clears the entire queue (for testing/reset)
   */
  clear(): void {
    this.queue = [];
  }
}
