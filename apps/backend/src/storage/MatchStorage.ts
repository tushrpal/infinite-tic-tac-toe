import type { MatchResult } from '@infinite-ttt/shared';

export interface MatchStorage {
  saveMatch(matchResult: MatchResult): Promise<void>;
  getMatch(matchId: string): Promise<MatchResult | null>;
  getMatches(): Promise<MatchResult[]>;
}
