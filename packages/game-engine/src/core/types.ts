/**
 * Core type definitions shared across all game modes.
 */

/**
 * Player symbols - exactly two players
 */
export type Player = 'X' | 'O';

/**
 * Turn number - monotonically increasing integer
 * Used to track move order and enable replay/validation
 */
export type Turn = number;

/**
 * Board position - coordinates for placing a mark
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Move metadata - fully describes a move
 */
export interface Move {
  player: Player;
  position: Position;
  turn: Turn;
}

/**
 * Helper to get the opponent player
 */
export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/**
 * Helper to get the next player (X goes first)
 */
export function getNextPlayer(turn: Turn): Player {
  return turn % 2 === 0 ? 'X' : 'O';
}
