import fs from 'fs/promises';
import path from 'path';
import { MatchResult } from '@infinite-ttt/shared';
import { MatchStore } from './MatchStore';

const FILE_PATH = path.resolve(__dirname, '../../data/matches.json');

export class LocalJsonMatchStore implements MatchStore {
  async save(match: MatchResult) {
    const data = await this.getAll();
    data.push(match);
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
  }

  async getAll(): Promise<MatchResult[]> {
    try {
      const raw = await fs.readFile(FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
