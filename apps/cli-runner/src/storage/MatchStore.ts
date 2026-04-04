/**
 * Match Store Interface
 * 
 * Contract for persisting MatchResult objects.
 * 
 * RULES:
 * - Storage is a side-effect
 * - Game logic must not know storage exists
 * - MatchResult is the ONLY input
 * - No filtering, no aggregation, no mutation
 * - Replaceable by backend later
 * 
 * This is a ledger, not a leaderboard.
 */

import type { MatchResult } from '@infinite-ttt/shared';

/**
 * Storage interface for match results
 * 
 * Implementations could be:
 * - Local JSON files
 * - SQLite database
 * - Backend API
 * - In-memory (for testing)
 */
export interface MatchStore {
  /**
   * Save a completed match result
   * 
   * @param match - The completed match result
   */
  save(match: MatchResult): Promise<void>;
  
  /**
   * Retrieve all stored matches
   * 
   * @returns All stored matches, ordered oldest to newest
   */
  getAll(): Promise<MatchResult[]>;
  
  /**
   * Clear all stored matches
   * 
   * WARNING: This is destructive. Use with caution.
   */
  clear(): Promise<void>;
}
