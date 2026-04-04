/**
 * Helper utilities for the game UI
 */

import type { Position, Player, GameState, WinInfo } from '@/ws/types';
import { RANKS } from './constants';

// ============================================
// Position Helpers
// ============================================

/**
 * Check if two positions are equal
 */
export function positionsEqual(a: Position | null | undefined, b: Position | null | undefined): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

/**
 * Check if position is in array
 */
export function positionInArray(pos: Position, arr: Position[]): boolean {
  return arr.some((p) => positionsEqual(p, pos));
}

/**
 * Convert position to string key
 */
export function positionToKey(pos: Position): string {
  return `${pos.row}-${pos.col}`;
}

/**
 * Parse position from string key
 */
export function keyToPosition(key: string): Position {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
}

// ============================================
// Player Helpers
// ============================================

/**
 * Get opponent player
 */
export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/**
 * Get player display name
 */
export function getPlayerName(player: Player, customNames?: { X?: string; O?: string }): string {
  return customNames?.[player] ?? `Player ${player}`;
}

// ============================================
// Game State Helpers
// ============================================

/**
 * Get cell value at position
 */
export function getCellValue(state: GameState, pos: Position): Player | null {
  return state.board[pos.row]?.[pos.col] ?? null;
}

/**
 * Check if cell is playable
 */
export function isCellPlayable(state: GameState, pos: Position): boolean {
  if (state.isGameOver) return false;
  if (getCellValue(state, pos) !== null) return false;
  return true;
}

/**
 * Check if position is part of winning line
 */
export function isWinningCell(winInfo: WinInfo | null, pos: Position): boolean {
  if (!winInfo) return false;
  return positionInArray(pos, winInfo.winningCells);
}

/**
 * Get last move from history
 */
export function getLastMove(state: GameState) {
  return state.moveHistory[state.moveHistory.length - 1] ?? null;
}

/**
 * Check if position is the last move
 */
export function isLastMove(state: GameState, pos: Position): boolean {
  const lastMove = getLastMove(state);
  return lastMove ? positionsEqual(lastMove.position, pos) : false;
}

// ============================================
// Rank Helpers
// ============================================

/**
 * Get rank info from rating
 */
export function getRankFromRating(rating: number) {
  const tiers = [...RANKS.TIERS].reverse();
  return tiers.find((tier) => rating >= tier.minRating) ?? RANKS.TIERS[0];
}

/**
 * Get progress to next rank
 */
export function getRankProgress(rating: number): { current: number; next: number; progress: number } {
  const currentRank = getRankFromRating(rating);
  const tiers = RANKS.TIERS;
  const currentIndex = tiers.findIndex((t) => t.name === currentRank.name);
  const nextRank = tiers[currentIndex + 1];

  if (!nextRank) {
    return { current: rating, next: rating, progress: 100 };
  }

  const progress = ((rating - currentRank.minRating) / (nextRank.minRating - currentRank.minRating)) * 100;
  return {
    current: currentRank.minRating,
    next: nextRank.minRating,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

// ============================================
// Formatting Helpers
// ============================================

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === 'number' ? date : date.getTime();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// ============================================
// CSS Class Helpers
// ============================================

/**
 * Conditionally join class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================
// Random Helpers
// ============================================

/**
 * Generate a random ID
 */
export function generateId(prefix = ''): string {
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${random}` : random;
}

// ============================================
// Storage Helpers
// ============================================

/**
 * Safe localStorage get
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

// ============================================
// Debounce
// ============================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================
// Throttle
// ============================================

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
