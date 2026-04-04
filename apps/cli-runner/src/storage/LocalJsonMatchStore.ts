/**
 * Local JSON File Match Store
 * 
 * File-based implementation of MatchStore.
 * 
 * BEHAVIOR:
 * - Stores matches in a JSON file
 * - Append-only (never overwrites existing matches)
 * - Creates file if it doesn't exist
 * - Preserves order (oldest → newest)
 * 
 * STORAGE FORMAT:
 * [
 *   { "matchId": "...", "mode": "mode1", ... },
 *   { "matchId": "...", "mode": "mode2", ... }
 * ]
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { MatchResult } from '@infinite-ttt/shared';
import type { MatchStore } from './MatchStore.js';

export class LocalJsonMatchStore implements MatchStore {
  private readonly filePath: string;
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  
  /**
   * Save a match result to the JSON file
   * 
   * Thread-safe append operation:
   * 1. Read existing matches
   * 2. Append new match
   * 3. Write back to file
   * 
   * @param match - The match result to save
   */
  async save(match: MatchResult): Promise<void> {
    // Ensure directory exists
    await this.ensureDirectory();
    
    // Read existing matches
    const matches = await this.readMatches();
    
    // Append new match
    matches.push(match);
    
    // Write back to file
    await fs.writeFile(
      this.filePath,
      JSON.stringify(matches, null, 2),
      'utf-8'
    );
  }
  
  /**
   * Retrieve all stored matches
   * 
   * @returns All stored matches, ordered oldest to newest
   */
  async getAll(): Promise<MatchResult[]> {
    return this.readMatches();
  }
  
  /**
   * Clear all stored matches
   * 
   * WARNING: This deletes the file. Use with caution.
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  /**
   * Read matches from file
   * 
   * Returns empty array if file doesn't exist.
   */
  private async readMatches(): Promise<MatchResult[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as MatchResult[];
    } catch (error: any) {
      // File doesn't exist yet
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * Ensure the directory for the file exists
   */
  private async ensureDirectory(): Promise<void> {
    const dir = dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error: any) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
