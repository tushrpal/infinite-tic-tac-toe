/**
 * FROZEN API: GameResult (Round-Level)
 * 
 * This represents one completed board/round.
 * 
 * WHY THIS MATTERS:
 * - Mode 2 has multiple rounds
 * - Replays are round-based
 * - Draws are explicit
 * 
 * 🔒 RULES:
 * ❌ No scoring/ranking logic
 * ❌ No player IDs
 * ❌ No metadata beyond pure gameplay facts
 * ✅ Pure round outcome only
 * 
 * Once frozen, DO NOT change shape without a major version bump.
 */

import type { Player, Move } from './Move.js';

/**
 * Result of a single completed game/round
 * Represents one board that has reached a terminal state
 */
export interface GameResult {
  /** Winner of this game/round (null = draw) */
  winner: Player | null;
  
  /** Total number of moves made in this game/round */
  totalMoves: number;
  
  /** Board size for this game/round (N for NxN) */
  boardSize: number;
  
  /** Complete move history for replay and analysis */
  moves: Move[];
}
