/**
 * Tests for Bot Controller
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BotController } from './botController.js';
import { createRandomBot } from '@infinite-ttt/bots';
import type { GameState } from '@infinite-ttt/bots';

describe('BotController', () => {
  let controller: BotController;

  beforeEach(() => {
    controller = new BotController();
  });

  describe('registerBot', () => {
    it('should register a bot for a match', () => {
      const bot = createRandomBot();
      controller.registerBot('match123', bot);

      expect(controller.hasBot('match123')).toBe(true);
      expect(controller.getActiveCount()).toBe(1);
    });

    it('should replace existing bot if registered twice', () => {
      const bot1 = createRandomBot();
      const bot2 = createRandomBot();

      controller.registerBot('match123', bot1);
      controller.registerBot('match123', bot2);

      expect(controller.hasBot('match123')).toBe(true);
      expect(controller.getActiveCount()).toBe(1);
    });

    it('should handle multiple matches', () => {
      controller.registerBot('match1', createRandomBot());
      controller.registerBot('match2', createRandomBot());
      controller.registerBot('match3', createRandomBot());

      expect(controller.getActiveCount()).toBe(3);
    });
  });

  describe('hasBot', () => {
    it('should return false for non-existent match', () => {
      expect(controller.hasBot('nonexistent')).toBe(false);
    });

    it('should return true for registered match', () => {
      controller.registerBot('match123', createRandomBot());
      expect(controller.hasBot('match123')).toBe(true);
    });
  });

  describe('getBot', () => {
    it('should return undefined for non-existent match', () => {
      expect(controller.getBot('nonexistent')).toBeUndefined();
    });

    it('should return bot instance for registered match', () => {
      const bot = createRandomBot();
      controller.registerBot('match123', bot);

      const retrieved = controller.getBot('match123');
      expect(retrieved).toBeDefined();
      expect(retrieved).toBe(bot);
    });
  });

  describe('computeMove', () => {
    const createTestState = (): GameState => ({
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      currentTurn: 1,
      winner: null,
      moveHistory: [],
    });

    it('should compute a valid move', async () => {
      const bot = createRandomBot();
      controller.registerBot('match123', bot);

      const state = createTestState();
      const move = await controller.computeMove('match123', state);

      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });

    it('should throw if bot not registered', async () => {
      const state = createTestState();

      await expect(
        controller.computeMove('nonexistent', state)
      ).rejects.toThrow('No bot registered');
    });

    it('should return fallback move if bot errors', async () => {
      const errorBot = {
        getMove: () => {
          throw new Error('Bot exploded');
        },
      };

      controller.registerBot('match123', errorBot);
      const state = createTestState();

      const move = await controller.computeMove('match123', state);

      // Should still return a valid move (fallback)
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });

    it('should validate bot moves are legal', async () => {
      const invalidBot = {
        getMove: () => 999, // Invalid move
      };

      controller.registerBot('match123', invalidBot);
      const state = createTestState();

      const move = await controller.computeMove('match123', state);

      // Should fallback to valid move
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });
  });

  describe('cleanup', () => {
    it('should remove bot for a match', () => {
      controller.registerBot('match123', createRandomBot());
      expect(controller.hasBot('match123')).toBe(true);

      controller.cleanup('match123');
      expect(controller.hasBot('match123')).toBe(false);
      expect(controller.getActiveCount()).toBe(0);
    });

    it('should not error if match does not exist', () => {
      expect(() => controller.cleanup('nonexistent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove all bots', () => {
      controller.registerBot('match1', createRandomBot());
      controller.registerBot('match2', createRandomBot());
      controller.registerBot('match3', createRandomBot());

      expect(controller.getActiveCount()).toBe(3);

      controller.clearAll();

      expect(controller.getActiveCount()).toBe(0);
      expect(controller.hasBot('match1')).toBe(false);
      expect(controller.hasBot('match2')).toBe(false);
      expect(controller.hasBot('match3')).toBe(false);
    });
  });
});
