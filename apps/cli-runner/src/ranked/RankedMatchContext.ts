import { RankedPlayer } from "./RankedPlayer";

/**
 * Context required for computing rank delta from a match.
 * Contains player state before the match.
 */
export interface RankedMatchContext {
  /** Player 1 before the match */
  player1: RankedPlayer;

  /** Player 2 before the match */
  player2: RankedPlayer;

  /** True if this is a ranked match */
  isRanked: boolean;

  /**
   * Game mode
   * Mode 1: Infinite 3x3
   * Mode 2: Expanding board
   */
  mode: 1 | 2;
}

/**
 * Create a RankedMatchContext instance.
 * @param player1 Player 1 state
 * @param player2 Player 2 state
 * @param isRanked Whether this is a ranked match
 * @param mode Game mode
 * @returns RankedMatchContext instance
 */
export function createRankedMatchContext(
  player1: RankedPlayer,
  player2: RankedPlayer,
  isRanked: boolean,
  mode: 1 | 2
): RankedMatchContext {
  return {
    player1,
    player2,
    isRanked,
    mode,
  };
}
