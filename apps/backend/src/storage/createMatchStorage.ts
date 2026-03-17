import 'dotenv/config';
import type { MatchStorage } from './MatchStorage';
import { DbMatchStorage } from './dbMatchStorage';

export function createMatchStorage(): MatchStorage {
  if (!process.env.DATABASE_URL) {
    throw new Error('[storage] DATABASE_URL is required; PostgreSQL is the only match storage source');
  }

  return new DbMatchStorage();
}
