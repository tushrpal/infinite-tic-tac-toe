import type { PlayerIdentity } from './PlayerIdentity';

/**
 * IdentityStore interface for loading and saving player identities.
 * Implementations can use local files, remote APIs, or other storage mechanisms.
 */
export interface IdentityStore {
  /**
   * Load the current player identity.
   * Returns null if no identity exists yet.
   */
  load(): Promise<PlayerIdentity | null>;

  /**
   * Save a player identity.
   * - Should be idempotent (safe to call multiple times)
   * - Should never overwrite playerId if it already exists
   * - Should allow displayName updates
   */
  save(identity: PlayerIdentity): Promise<void>;
}
