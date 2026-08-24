/**
 * Recent Opponents Types
 */

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW';

export interface RecentOpponent {
  opponentId: string;
  opponentUsername: string;
  opponentDisplayName?: string;
  opponentRating: number;
  lastPlayedAt: string;
  matchOutcome: MatchOutcome;
  matchMode: string;
  isOnline?: boolean;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
}

export interface RecentOpponentsResponse {
  opponents: RecentOpponent[];
}
