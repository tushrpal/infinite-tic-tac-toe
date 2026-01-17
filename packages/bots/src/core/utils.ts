/**
 * Common bot utility functions
 */

import type { Player } from '@infinite-ttt/game-engine';
import { getOpponent } from '@infinite-ttt/game-engine';
import { BOARD_POSITIONS } from './constants.js';
import { indexToPosition } from './types.js';

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
 * 
 * Scaled by board size:
 * - 3×3: Center=30, Corners=20, Edges=10
 * - 4×4: Center positions higher, symmetry considered
 * - 5×5+: Center region prioritized, corners less important
 */
export function getPositionScore(index: number, boardSize: number = 3): number {
  if (boardSize === 3) {
    // Use legacy logic for 3×3
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
  
  // For NxN boards, calculate based on distance to center
  const { row, col } = indexToPosition(index, boardSize);
  const center = (boardSize - 1) / 2;
  const maxDistance = Math.sqrt(2 * center * center);
  const distance = Math.sqrt(
    Math.pow(row - center, 2) + Math.pow(col - center, 2)
  );
  
  // Normalize to 0-30 range (center = 30, corners = ~0)
  const score = 30 * (1 - distance / maxDistance);
  
  return Math.round(score);
}
