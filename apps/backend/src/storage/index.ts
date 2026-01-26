export { MatchStore } from './MatchStore';
export { LocalJsonMatchStore } from './LocalJsonMatchStore';
export { PlayerStore } from './PlayerStore';
export { LocalJsonPlayerStore } from './LocalJsonPlayerStore';

/**
 * Factory function to create a local player store
 */
import { LocalJsonPlayerStore } from './LocalJsonPlayerStore';

export function createLocalPlayerStore(dataDir?: string): LocalJsonPlayerStore {
  return new LocalJsonPlayerStore(dataDir);
}
