/**
 * Heuristic scoring constants
 * 
 * These values determine move priority in descending order.
 * Higher scores = better moves.
 */

export const HEURISTIC_SCORES = {
  /** Bot wins immediately - highest priority */
  WIN_IMMEDIATE: 10000,
  
  /** Blocks opponent's winning move - high priority */
  BLOCK_OPPONENT_WIN: 5000,
  
  /** Creates 2-in-a-row (threatening win) - medium-high priority */
  CREATE_TWO_IN_A_ROW: 300,
  
  /** Center control - good strategic position */
  CENTER_CONTROL: 100,
  
  /** Corner control - decent position */
  CORNER_CONTROL: 50,
  
  /** Edge cell - neutral position */
  EDGE_CELL: 10,
  
  /** Enables opponent win - very bad, avoid */
  ENABLE_OPPONENT_WIN: -1000,
} as const;

/**
 * Board position indices
 */
export const BOARD_POSITIONS = {
  CENTER: 4,
  CORNERS: [0, 2, 6, 8], // Top-left, top-right, bottom-left, bottom-right
  EDGES: [1, 3, 5, 7],   // Top, left, right, bottom
} as const;
