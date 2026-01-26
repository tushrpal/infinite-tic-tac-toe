/**
 * PlayerStore interface for backend storage
 */

import type { PlayerIdentity } from '@infinite-ttt/identity';

export interface PlayerStore {
  /**
   * Save or update a player identity.
   * Idempotent - same playerId updates existing record.
   */
  save(identity: PlayerIdentity): Promise<void>;

  /**
   * Load a player identity by ID.
   * Returns null if not found.
   */
  load(playerId: string): Promise<PlayerIdentity | null>;

  /**
   * Get all stored player identities.
   */
  getAll(): Promise<PlayerIdentity[]>;
}
