/**
 * Storage Layer Exports
 * 
 * Factory and exports for match storage.
 */

import { join } from 'path';
import { LocalJsonMatchStore } from './LocalJsonMatchStore.js';
import type { MatchStore } from './MatchStore.js';

export type { MatchStore } from './MatchStore.js';
export { LocalJsonMatchStore } from './LocalJsonMatchStore.js';

/**
 * Create a local JSON match store
 * 
 * Default location: apps/cli-runner/data/matches.json
 * 
 * @param filePath - Optional custom file path
 * @returns A configured MatchStore instance
 */
export function createLocalMatchStore(filePath?: string): MatchStore {
  const defaultPath = join(process.cwd(), 'data', 'matches.json');
  return new LocalJsonMatchStore(filePath || defaultPath);
}
