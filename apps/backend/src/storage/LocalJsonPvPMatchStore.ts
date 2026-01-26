import { PvPMatch, PvPMatchStore } from './PvPMatchStore';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

/**
 * Local JSON-based storage for PvP matches
 * Simple file-based storage for development/testing
 */
export class LocalJsonPvPMatchStore implements PvPMatchStore {
  private filePath: string;
  private matches: Map<string, PvPMatch> = new Map();

  constructor(dataDir: string = './data') {
    this.filePath = path.join(dataDir, 'pvp-matches.json');
  }

  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const matchArray: PvPMatch[] = JSON.parse(data);
      this.matches = new Map(matchArray.map(m => [m.matchId, m]));
    } catch (error) {
      // File doesn't exist yet, start with empty map
      this.matches = new Map();
    }
  }

  private async save(): Promise<void> {
    const matchArray = Array.from(this.matches.values());
    await fs.writeFile(this.filePath, JSON.stringify(matchArray, null, 2));
  }

  async create(match: Omit<PvPMatch, 'matchId' | 'lastUpdated'>): Promise<PvPMatch> {
    const newMatch: PvPMatch = {
      ...match,
      matchId: uuid(),
      lastUpdated: Date.now(),
    };
    this.matches.set(newMatch.matchId, newMatch);
    await this.save();
    return newMatch;
  }

  async getById(matchId: string): Promise<PvPMatch | null> {
    return this.matches.get(matchId) || null;
  }

  async findWaiting(mode: 'mode1' | 'mode2'): Promise<PvPMatch | null> {
    for (const match of this.matches.values()) {
      if (match.status === 'waiting' && match.mode === mode) {
        return match;
      }
    }
    return null;
  }

  async update(matchId: string, updates: Partial<PvPMatch>): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }
    const updated = {
      ...match,
      ...updates,
      lastUpdated: Date.now(),
    };
    this.matches.set(matchId, updated);
    await this.save();
  }

  async complete(matchId: string, matchResult: any): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }
    const updated = {
      ...match,
      status: 'completed' as const,
      matchResult,
      lastUpdated: Date.now(),
    };
    this.matches.set(matchId, updated);
    await this.save();
  }

  async getActive(): Promise<PvPMatch[]> {
    return Array.from(this.matches.values())
      .filter(m => m.status === 'active' || m.status === 'waiting');
  }
}
