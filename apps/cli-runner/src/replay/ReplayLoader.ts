/**
 * ReplayLoader - Loads MatchResult from storage
 * 
 * RULES:
 * - Read-only access to storage
 * - No data mutation
 * - Returns null if not found
 */

import type { MatchResult } from '@infinite-ttt/shared';
import type { MatchStore } from '../storage/MatchStore.js';

/**
 * Load a specific match by ID
 * 
 * @param store - Match storage instance
 * @param matchId - The match ID to load
 * @returns The match result, or null if not found
 */
export async function loadMatch(
  store: MatchStore,
  matchId: string
): Promise<MatchResult | null> {
  const allMatches = await store.getAll();
  const match = allMatches.find((m) => m.matchId === matchId);
  return match ?? null;
}

/**
 * Load the most recent match
 * 
 * @param store - Match storage instance
 * @returns The most recent match, or null if no matches exist
 */
export async function loadLastMatch(
  store: MatchStore
): Promise<MatchResult | null> {
  const allMatches = await store.getAll();
  
  if (allMatches.length === 0) {
    return null;
  }
  
  // Get the match with the highest createdAt timestamp
  const lastMatch = allMatches.reduce((latest, current) => 
    current.createdAt > latest.createdAt ? current : latest
  );
  
  return lastMatch;
}

/**
 * Load all matches, ordered by creation time (newest first)
 * 
 * @param store - Match storage instance
 * @returns All matches, ordered newest to oldest
 */
export async function loadAllMatches(
  store: MatchStore
): Promise<MatchResult[]> {
  const allMatches = await store.getAll();
  
  // Sort by creation time, newest first
  return [...allMatches].sort((a, b) => b.createdAt - a.createdAt);
}
