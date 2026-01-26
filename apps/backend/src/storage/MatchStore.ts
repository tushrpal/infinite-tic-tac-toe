import { MatchResult } from '@infinite-ttt/shared';

export interface MatchStore {
  save(match: MatchResult): Promise<void>;
  getAll(): Promise<MatchResult[]>;
}
