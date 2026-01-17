/**
 * Common bot utility functions
 */

import type { Player } from '@infinite-ttt/game-engine';
import { getOpponent } from '@infinite-ttt/game-engine';
import { BOARD_POSITIONS } from './constants';
import { indexToPosition } from './types';

/**
 * Get the current player based on turn number
 */
export function getCurrentPlayer(state: { currentTurn: number }): Player {
  return state.currentTurn % 2 === 0 ? 'X' : 'O';
}

/**
 * Check if a board index is a corner
 */
export function isCorner(index: number): boolean {
  return BOARD_POSITIONS.CORNERS.includes(index as any);
}

/**
 * Check if a board index is the center
 */
export function isCenter(index: number): boolean {
  return index === BOARD_POSITIONS.CENTER;
}

/**
 * Check if a board index is an edge
 */
export function isEdge(index: number): boolean {
  return BOARD_POSITIONS.EDGES.includes(index as any);
}

/**
 * Get the base position score for a board index
 * Used as a tie-breaker when moves have similar strategic value
 */
export function getPositionScore(index: number): number {
  if (isCenter(index)) {
    return BOARD_POSITIONS.CENTER;
  }
  if (isCorner(index)) {
    return 20;
  }
  if (isEdge(index)) {
    return 10;
  }
  return 0;
}
