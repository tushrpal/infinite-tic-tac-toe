/**
 * Tests for Bot Difficulty Resolver
 */

import { describe, it, expect } from 'vitest';
import { resolveForRank, getBotDisplayName, createBotInstance } from './botResolver.js';
import { Difficulty } from './types.js';

describe('BotDifficultyResolver', () => {
  describe('resolveForRank', () => {
    it('should assign Easy bot to Bronze players (0-999)', () => {
      const selection = resolveForRank(500);
      expect(selection.botType).toBe('random');
      expect(selection.difficulty).toBe(Difficulty.Easy);
      expect(selection.ratingRange).toEqual([0, 999]);
      expect(selection.instance).toBeDefined();
    });

    it('should assign Easy bot at rating boundary (999)', () => {
      const selection = resolveForRank(999);
      expect(selection.botType).toBe('random');
      expect(selection.difficulty).toBe(Difficulty.Easy);
    });

    it('should assign Medium bot to Silver players (1000-1499)', () => {
      const selection = resolveForRank(1200);
      expect(selection.botType).toBe('heuristic');
      expect(selection.difficulty).toBe(Difficulty.Medium);
      expect(selection.ratingRange).toEqual([1000, 1499]);
    });

    it('should assign Medium bot to Gold players (1500-1999)', () => {
      const selection = resolveForRank(1750);
      expect(selection.botType).toBe('heuristic');
      expect(selection.difficulty).toBe(Difficulty.Medium);
      expect(selection.ratingRange).toEqual([1500, 1999]);
    });

    it('should assign Hard bot to Platinum players (2000-2499)', () => {
      const selection = resolveForRank(2250);
      expect(selection.botType).toBe('heuristic');
      expect(selection.difficulty).toBe(Difficulty.Hard);
      expect(selection.ratingRange).toEqual([2000, 2499]);
    });

    it('should assign Minimax bot to Diamond players (2500+)', () => {
      const selection = resolveForRank(2600);
      expect(selection.botType).toBe('minimax');
      expect(selection.difficulty).toBe(Difficulty.Hard);
      expect(selection.ratingRange).toEqual([2500, 9999]);
    });

    it('should handle very high ratings', () => {
      const selection = resolveForRank(5000);
      expect(selection.botType).toBe('minimax');
      expect(selection.difficulty).toBe(Difficulty.Hard);
    });

    it('should handle zero rating', () => {
      const selection = resolveForRank(0);
      expect(selection.botType).toBe('random');
      expect(selection.difficulty).toBe(Difficulty.Easy);
    });

    it('should include reasoning for each tier', () => {
      const bronze = resolveForRank(500);
      const silver = resolveForRank(1200);
      const diamond = resolveForRank(2600);

      expect(bronze.reasoning).toBeTruthy();
      expect(silver.reasoning).toBeTruthy();
      expect(diamond.reasoning).toBeTruthy();
    });
  });

  describe('createBotInstance', () => {
    it('should recreate a random bot from selection', () => {
      const selection = resolveForRank(500);
      const newInstance = createBotInstance(selection);
      expect(newInstance).toBeDefined();
      expect(typeof newInstance.getMove).toBe('function');
    });

    it('should recreate a heuristic bot from selection', () => {
      const selection = resolveForRank(1500);
      const newInstance = createBotInstance(selection);
      expect(newInstance).toBeDefined();
    });

    it('should recreate a minimax bot from selection', () => {
      const selection = resolveForRank(2600);
      const newInstance = createBotInstance(selection);
      expect(newInstance).toBeDefined();
    });
  });

  describe('getBotDisplayName', () => {
    it('should generate display name for easy bot', () => {
      const name = getBotDisplayName('random', Difficulty.Easy);
      expect(name).toBe('Bot (Easy)');
    });

    it('should generate display name for medium bot', () => {
      const name = getBotDisplayName('heuristic', Difficulty.Medium);
      expect(name).toBe('Bot (Medium)');
    });

    it('should generate display name for hard bot', () => {
      const name = getBotDisplayName('minimax', Difficulty.Hard);
      expect(name).toBe('Bot (Hard)');
    });
  });
});
