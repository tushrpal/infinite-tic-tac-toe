export { MatchStore } from './MatchStore';
export { LocalJsonMatchStore } from './LocalJsonMatchStore';
export { PlayerStore } from './PlayerStore';
export { LocalJsonPlayerStore } from './LocalJsonPlayerStore';
export { PvPMatchStore } from './PvPMatchStore';
export { LocalJsonPvPMatchStore } from './LocalJsonPvPMatchStore';

/**
 * Factory function to create a local player store
 */
import { LocalJsonPlayerStore } from './LocalJsonPlayerStore';
import { LocalJsonPvPMatchStore } from './LocalJsonPvPMatchStore';

export function createLocalPlayerStore(dataDir?: string): LocalJsonPlayerStore {
  return new LocalJsonPlayerStore(dataDir);
}

export function createLocalPvPMatchStore(dataDir?: string): LocalJsonPvPMatchStore {
  return new LocalJsonPvPMatchStore(dataDir);
}
