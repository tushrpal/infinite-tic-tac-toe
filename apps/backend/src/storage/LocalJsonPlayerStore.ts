/**
 * Local JSON file-based player storage for backend
 * 
 * Stores players in ./data/players.json
 * Simple in-memory cache with file persistence
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { PlayerIdentity } from '@infinite-ttt/identity';
import type { PlayerStore } from './PlayerStore';

export class LocalJsonPlayerStore implements PlayerStore {
  private filePath: string;
  private players: Map<string, PlayerIdentity> = new Map();
  private initialized = false;

  constructor(dataDir: string = './data') {
    this.filePath = path.join(dataDir, 'players.json');
  }

  /**
   * Initialize the store by loading from file
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Try to load existing data
      try {
        const content = await fs.readFile(this.filePath, 'utf-8');
        const players = JSON.parse(content) as PlayerIdentity[];
        
        // Populate in-memory map
        for (const player of players) {
          this.players.set(player.playerId, player);
        }
        
        console.log(`Loaded ${players.length} players from storage`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist yet - create empty
          await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
          console.log('Created new players.json file');
        } else {
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize player store:', error);
      throw error;
    }
  }

  /**
   * Persist current state to file
   */
  private async persist(): Promise<void> {
    const players = Array.from(this.players.values());
    await fs.writeFile(this.filePath, JSON.stringify(players, null, 2), 'utf-8');
  }

  async save(identity: PlayerIdentity): Promise<void> {
    await this.initialize();
    
    // Update or insert
    this.players.set(identity.playerId, identity);
    
    await this.persist();
  }

  async load(playerId: string): Promise<PlayerIdentity | null> {
    await this.initialize();
    
    return this.players.get(playerId) || null;
  }

  async getAll(): Promise<PlayerIdentity[]> {
    await this.initialize();
    
    return Array.from(this.players.values());
  }
}
