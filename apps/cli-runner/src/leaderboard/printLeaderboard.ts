/**
 * Leaderboard CLI Formatter
 * 
 * Renders leaderboard entries to the console.
 * 
 * RULES:
 * - Display only
 * - No computation
 * - No side effects beyond console output
 * - Readable formatting
 */

import type { LeaderboardEntry } from './LeaderboardEntry.js';
import type { LeaderboardFilters } from './filters.js';

/**
 * Format win rate as percentage string
 * 
 * @param winRate - Win rate (0-1)
 * @returns Formatted percentage (e.g., "58.3%")
 */
function formatWinRate(winRate: number): string {
  return `${(winRate * 100).toFixed(1)}%`;
}

/**
 * Pad string to specified length (right-aligned for numbers)
 * 
 * @param value - Value to pad
 * @param length - Target length
 * @param rightAlign - Whether to right-align (default: false)
 * @returns Padded string
 */
function pad(value: string | number, length: number, rightAlign = false): string {
  const str = String(value);
  const padding = ' '.repeat(Math.max(0, length - str.length));
  return rightAlign ? padding + str : str + padding;
}

/**
 * Get filter description for header
 * 
 * @param filters - Active filters
 * @returns Human-readable filter description
 */
function getFilterDescription(filters?: LeaderboardFilters): string {
  const parts: string[] = [];
  
  if (filters?.mode) {
    parts.push(filters.mode.toUpperCase());
  }
  
  if (filters?.difficulty) {
    parts.push(filters.difficulty.toUpperCase());
  }
  
  return parts.length > 0 ? parts.join(' — ') : 'ALL MODES';
}

/**
 * Print leaderboard to console
 * 
 * @param entries - Sorted leaderboard entries
 * @param filters - Active filters (for header display)
 * @param matchCount - Total matches used for computation
 */
export function printLeaderboard(
  entries: LeaderboardEntry[],
  filters?: LeaderboardFilters,
  matchCount?: number
): void {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log(`🏆 LOCAL LEADERBOARD — ${getFilterDescription(filters)}`);
  console.log('═'.repeat(60));
  
  // Show match count if provided
  if (matchCount !== undefined) {
    console.log(`Matches analyzed: ${matchCount}`);
    console.log('─'.repeat(60));
  }
  
  // Check if empty
  if (entries.length === 0) {
    console.log('\nNo matches found matching the filters.');
    console.log('Play some games to populate the leaderboard!\n');
    console.log('═'.repeat(60));
    console.log('\n');
    return;
  }
  
  // Header
  console.log(
    pad('Player', 20) +
    pad('Games', 8, true) +
    pad('Wins', 7, true) +
    pad('Losses', 8, true) +
    pad('Draws', 7, true) +
    pad('Win%', 10, true)
  );
  console.log('─'.repeat(60));
  
  // Rows
  for (const entry of entries) {
    const playerDisplay = entry.playerType === 'human' 
      ? entry.playerId 
      : `${entry.playerId}`;
    
    console.log(
      pad(playerDisplay, 20) +
      pad(entry.gamesPlayed, 8, true) +
      pad(entry.wins, 7, true) +
      pad(entry.losses, 8, true) +
      pad(entry.draws, 7, true) +
      pad(formatWinRate(entry.winRate), 10, true)
    );
  }
  
  console.log('═'.repeat(60));
  console.log('\n');
}

/**
 * Print leaderboard summary (no table, just overview)
 * 
 * @param entries - Leaderboard entries
 * @param filters - Active filters
 */
export function printLeaderboardSummary(
  entries: LeaderboardEntry[],
  filters?: LeaderboardFilters
): void {
  const totalPlayers = entries.length;
  const totalGames = entries.reduce((sum, e) => sum + e.gamesPlayed, 0);
  
  console.log('\n');
  console.log('═'.repeat(60));
  console.log(`📊 LEADERBOARD SUMMARY — ${getFilterDescription(filters)}`);
  console.log('═'.repeat(60));
  console.log(`Total Players: ${totalPlayers}`);
  console.log(`Total Games: ${totalGames}`);
  
  if (entries.length > 0) {
    const topPlayer = entries[0];
    console.log(`\n👑 Top Player: ${topPlayer.playerId} (${formatWinRate(topPlayer.winRate)} win rate)`);
  }
  
  console.log('═'.repeat(60));
  console.log('\n');
}
