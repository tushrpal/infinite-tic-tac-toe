import type { MatchResult } from '@infinite-ttt/shared';
import type { MatchListResult } from './dbMatchStorage';

export interface MatchStorage {
  saveMatch(matchResult: MatchResult): Promise<void>;
  getMatch(matchId: string): Promise<MatchResult | null>;
  getMatches(limit?: number, offset?: number): Promise<MatchListResult>;
}
