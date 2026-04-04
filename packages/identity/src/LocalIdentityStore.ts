import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { IdentityStore } from './IdentityStore.js';
import type { PlayerIdentity } from './PlayerIdentity.js';

/**
 * LocalIdentityStore stores player identity in ~/.infinite-ttt/player.json
 * 
 * Behavior:
 * - Creates the file if missing
 * - Never overwrites playerId
 * - Allows displayName updates
 */
export class LocalIdentityStore implements IdentityStore {
  private readonly filePath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const homeDir = os.homedir();
      const configDir = path.join(homeDir, '.infinite-ttt');
      this.filePath = path.join(configDir, 'player.json');
    }
  }

  async load(): Promise<PlayerIdentity | null> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const identity = JSON.parse(content) as PlayerIdentity;
      
      // Validate required fields
      if (!identity.playerId || !identity.displayName || !identity.createdAt) {
        console.warn('Invalid identity file, ignoring');
        return null;
      }
      
      return identity;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet - this is expected on first run
        return null;
      }
      throw error;
    }
  }

  async save(identity: PlayerIdentity): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    // Load existing identity to preserve playerId
    const existing = await this.load();
    
    const toSave: PlayerIdentity = {
      playerId: existing?.playerId || identity.playerId, // Never overwrite playerId
      displayName: identity.displayName, // Allow name updates
      createdAt: existing?.createdAt || identity.createdAt, // Preserve original creation time
    };

    await fs.writeFile(this.filePath, JSON.stringify(toSave, null, 2), 'utf-8');
  }

  /**
   * Get the file path where identity is stored.
   * Useful for debugging or user inspection.
   */
  getFilePath(): string {
    return this.filePath;
  }
}
