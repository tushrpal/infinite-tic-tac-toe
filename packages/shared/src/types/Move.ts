/**
 * FROZEN API: Move
 * 
 * A move is atomic and immutable. This represents a single action taken by a player.
 * 
 * 🔒 RULES:
 * - No scoring
 * - No validation state
 * - No UI metadata (except optional timestamp)
 * - Bots, engine, replay, backend all depend on this
 * 
 * Once frozen, DO NOT change shape without a major version bump.
 */

/**
 * Player symbols - exactly two players
 */
export type Player = 'X' | 'O';

/**
 * A single move in the game
 * Represents one action by a player at a specific position
 */
export interface Move {
  /** Board index (0 to N*N-1, flat array representation) */
  index: number;
  
  /** Player who made this move */
  player: Player;
  
  /** Turn number (incremental, 0-indexed) */
  turn: number;
  
  /** Optional timestamp for UI/replay purposes only */
  timestamp?: number;
}
