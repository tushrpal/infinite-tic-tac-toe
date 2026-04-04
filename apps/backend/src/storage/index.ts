export { MatchStorage } from './MatchStorage';
export { DbMatchStorage } from './dbMatchStorage';
export { createMatchStorage } from './createMatchStorage';
export { PlayerStore } from './PlayerStore';
export { LocalJsonPlayerStore } from './LocalJsonPlayerStore';

/**
 * Factory function to create a local player store
 */
import { LocalJsonPlayerStore } from './LocalJsonPlayerStore';

export function createLocalPlayerStore(dataDir?: string): LocalJsonPlayerStore {
  return new LocalJsonPlayerStore(dataDir);
}
