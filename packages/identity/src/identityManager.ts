import type { IdentityStore } from './IdentityStore';
import type { PlayerIdentity } from './PlayerIdentity';
import { createPlayerIdentity } from './PlayerIdentity';

/**
 * IdentityManager handles the core identity logic:
 * - Load existing identity
 * - Create new identity if missing (with user input)
 * - Allow renaming
 * 
 * This is deterministic and side-effect isolated.
 */
export class IdentityManager {
  private store: IdentityStore;
  private currentIdentity: PlayerIdentity | null = null;

  constructor(store: IdentityStore) {
    this.store = store;
  }

  /**
   * Initialize the identity system.
   * Loads existing identity or prompts for creation.
   * 
   * @param promptForName - Callback to prompt user for display name if needed
   * @returns The current player identity
   */
  async initialize(promptForName: () => Promise<string>): Promise<PlayerIdentity> {
    // Try to load existing identity
    this.currentIdentity = await this.store.load();

    if (this.currentIdentity) {
      return this.currentIdentity;
    }

    // No identity exists - create new one
    const displayName = await promptForName();
    this.currentIdentity = createPlayerIdentity(displayName);
    await this.store.save(this.currentIdentity);

    return this.currentIdentity;
  }

  /**
   * Get the current player identity.
   * Throws if not initialized.
   */
  getCurrentPlayer(): PlayerIdentity {
    if (!this.currentIdentity) {
      throw new Error('Identity not initialized. Call initialize() first.');
    }
    return this.currentIdentity;
  }

  /**
   * Get the current player identity, or null if not initialized.
   * Use this for optional identity checks.
   */
  getCurrentPlayerOrNull(): PlayerIdentity | null {
    return this.currentIdentity;
  }

  /**
   * Rename the current player.
   * Updates displayName while preserving playerId and createdAt.
   */
  async renamePlayer(newDisplayName: string): Promise<void> {
    if (!this.currentIdentity) {
      throw new Error('Identity not initialized. Call initialize() first.');
    }

    this.currentIdentity = {
      ...this.currentIdentity,
      displayName: newDisplayName,
    };

    await this.store.save(this.currentIdentity);
  }

  /**
   * Check if identity is initialized.
   */
  isInitialized(): boolean {
    return this.currentIdentity !== null;
  }
}
