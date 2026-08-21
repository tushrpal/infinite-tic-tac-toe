/**
 * Bot Controller
 *
 * Manages bot instances for active matches.
 * Handles bot move computation and lifecycle management.
 */

import type { Bot, GameState } from '@infinite-ttt/bots';
import { getValidMoves } from '@infinite-ttt/bots';

/**
 * Bot Controller manages all active bot instances
 * Maps matchId → Bot instance for active bot matches
 */
export class BotController {
  private bots: Map<string, Bot> = new Map();

  /**
   * Register a bot instance for a match
   *
   * @param matchId - Unique match identifier
   * @param bot - Bot instance to use for this match
   */
  registerBot(matchId: string, bot: Bot): void {
    if (this.bots.has(matchId)) {
      console.warn(`Bot already registered for match ${matchId}, replacing`);
    }
    this.bots.set(matchId, bot);
  }

  /**
   * Check if a bot is registered for a match
   *
   * @param matchId - Match identifier
   * @returns True if bot is registered
   */
  hasBot(matchId: string): boolean {
    return this.bots.has(matchId);
  }

  /**
   * Get the bot instance for a match
   *
   * @param matchId - Match identifier
   * @returns Bot instance or undefined if not found
   */
  getBot(matchId: string): Bot | undefined {
    return this.bots.get(matchId);
  }

  /**
   * Compute the next move for a bot
   *
   * @param matchId - Match identifier
   * @param gameState - Current game state
   * @returns Board index for the bot's move
   * @throws Error if bot not found or move computation fails
   */
  async computeMove(matchId: string, gameState: GameState): Promise<number> {
    const bot = this.bots.get(matchId);

    if (!bot) {
      throw new Error(`No bot registered for match ${matchId}`);
    }

    try {
      const moveIndex = bot.getMove(gameState);

      // Validate move is within valid range
      const validMoves = getValidMoves(gameState);
      if (!validMoves.includes(moveIndex)) {
        throw new Error(`Bot returned invalid move: ${moveIndex}`);
      }

      return moveIndex;
    } catch (error) {
      console.error('Bot error in match', matchId, error);

      // Fallback: return random valid move
      const validMoves = getValidMoves(gameState);
      if (validMoves.length === 0) {
        throw new Error('No valid moves available');
      }

      const fallbackMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      console.warn(`Bot fallback: selecting random move ${fallbackMove}`);

      return fallbackMove;
    }
  }

  /**
   * Remove bot instance and clean up resources
   * Should be called when match ends
   *
   * @param matchId - Match identifier
   */
  cleanup(matchId: string): void {
    const deleted = this.bots.delete(matchId);
    if (deleted) {
      console.log(`Cleaned up bot for match ${matchId}`);
    }
  }

  /**
   * Get count of active bot matches
   *
   * @returns Number of registered bots
   */
  getActiveCount(): number {
    return this.bots.size;
  }

  /**
   * Clear all bots (for testing or shutdown)
   */
  clearAll(): void {
    const count = this.bots.size;
    this.bots.clear();
    console.log(`Cleared ${count} bot instances`);
  }
}

/**
 * Singleton bot controller instance
 */
export const botController = new BotController();
