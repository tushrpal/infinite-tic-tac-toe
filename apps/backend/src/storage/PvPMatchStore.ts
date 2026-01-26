/**
 * PvPMatch - Backend representation of an online match
 * 
 * Backend responsibilities:
 * - Store current game snapshot
 * - Enforce turn ownership
 * - Track match lifecycle
 * 
 * Backend does NOT:
 * - Apply game rules
 * - Validate move legality
 * - Calculate winners
 * - Manage ranking
 */
export interface PvPMatch {
  matchId: string;
  mode: 'mode1' | 'mode2';
  boardSize: number;
  players: {
    X: string; // playerId
    O: string; // playerId
  };
  currentPlayer: 'X' | 'O';
  gameState: any; // Game-specific state (backend doesn't care about structure)
  lastUpdated: number;
  status: 'waiting' | 'active' | 'completed';
  /** Optional field to store final match result when completed */
  matchResult?: any; // MatchResult from @infinite-ttt/shared
}

export interface PvPMatchStore {
  /**
   * Create a new match in waiting state
   */
  create(match: Omit<PvPMatch, 'matchId' | 'lastUpdated'>): Promise<PvPMatch>;

  /**
   * Get match by ID
   */
  getById(matchId: string): Promise<PvPMatch | null>;

  /**
   * Find a waiting match for a specific mode
   */
  findWaiting(mode: 'mode1' | 'mode2'): Promise<PvPMatch | null>;

  /**
   * Update match state after a move
   */
  update(matchId: string, updates: Partial<PvPMatch>): Promise<void>;

  /**
   * Mark match as completed
   */
  complete(matchId: string, matchResult: any): Promise<void>;

  /**
   * Get all active matches
   */
  getActive(): Promise<PvPMatch[]>;
}
