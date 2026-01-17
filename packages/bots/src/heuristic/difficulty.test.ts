/**
 * Tests for Difficulty Levels
 * 
 * Verifies that Easy, Medium, and Hard difficulty levels
 * behave as expected.
 */

import { describe, it, expect } from 'vitest';
import { createRandomBot, createHeuristicBot, Difficulty } from '../index.js';
import { getConfig, MEDIUM_CONFIG, HARD_CONFIG } from './config.js';
import { Modes } from '@infinite-ttt/game-engine';
import type { GameState } from '../core/types.js';

const { createInitialState, applyMove } = Modes.Infinite3x3;

describe('Difficulty Configuration', () => {
  it('should return null config for Easy difficulty', () => {
    const config = getConfig(Difficulty.Easy);
    expect(config).toBeNull();
  });

  it('should return Medium config for Medium difficulty', () => {
    const config = getConfig(Difficulty.Medium);
    expect(config).toEqual(MEDIUM_CONFIG);
  });

  it('should return Hard config for Hard difficulty', () => {
    const config = getConfig(Difficulty.Hard);
    expect(config).toEqual(HARD_CONFIG);
  });

  it('should have Hard config with much lower randomness than Medium', () => {
    expect(HARD_CONFIG.randomness).toBeLessThan(MEDIUM_CONFIG.randomness);
    expect(HARD_CONFIG.randomness).toBeLessThanOrEqual(0.05); // Nearly deterministic
  });

  it('should have Hard config with dramatically higher block weight than Medium', () => {
    expect(HARD_CONFIG.blockWeight).toBeGreaterThan(MEDIUM_CONFIG.blockWeight);
    expect(HARD_CONFIG.blockWeight).toBeGreaterThanOrEqual(9000); // 90% of win priority
  });

  it('should have Hard config with much higher extend weight than Medium', () => {
    expect(HARD_CONFIG.extendWeight).toBeGreaterThan(MEDIUM_CONFIG.extendWeight);
    expect(HARD_CONFIG.extendWeight).toBeGreaterThanOrEqual(80); // 8x stronger
  });

  it('should have Hard config with lower center weight than Medium', () => {
    expect(HARD_CONFIG.centerWeight).toBeLessThan(MEDIUM_CONFIG.centerWeight);
  });
});

describe('Easy Difficulty (Random Bot)', () => {
  it('should create a Random Bot for Easy difficulty', () => {
    const bot = createRandomBot();
    const state = createInitialState();
    
    const move = bot.getMove(state);
    
    // Should return a valid move
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('should make unpredictable moves', () => {
    const bot = createRandomBot();
    const state = createInitialState();
    
    // Collect 10 first moves to check for variation
    const moves = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const move = bot.getMove(state);
      moves.add(move);
    }
    
    // Should have at least some variation (not always the same move)
    // With 20 tries, we should see multiple different moves
    expect(moves.size).toBeGreaterThan(1);
  });

  it('should not always block obvious threats (Easy)', () => {
    const bot = createRandomBot();
    let state = createInitialState();
    
    // Set up a winning threat for O
    // X: (1,0), (2,2)
    // O: (0,0), (0,1) - O can win at (0,2)
    state = applyMove(state, 'X', { row: 1, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    state = applyMove(state, 'O', { row: 0, col: 1 });
    
    // Random bot won't always block at (0,2)
    let blockedCount = 0;
    const trials = 50;
    
    for (let i = 0; i < trials; i++) {
      const move = bot.getMove(state);
      if (move === 2) { // (0,2) = index 2
        blockedCount++;
      }
    }
    
    // Should block sometimes (by chance) but not always
    // With 6 valid moves, we'd expect ~1/6 of moves to be the block (8-9 times)
    // Allow some variance
    expect(blockedCount).toBeLessThan(trials * 0.3); // Less than 30% of the time
  });
});

describe('Medium Difficulty (Default Heuristic)', () => {
  it('should create a Heuristic Bot with default config', () => {
    const config = getConfig(Difficulty.Medium);
    const bot = createHeuristicBot(config!);
    const state = createInitialState();
    
    const move = bot.getMove(state);
    
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('should always block immediate threats', () => {
    const config = getConfig(Difficulty.Medium);
    const bot = createHeuristicBot(config!);
    let state = createInitialState();
    
    // Set up a winning threat for O
    state = applyMove(state, 'X', { row: 1, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    state = applyMove(state, 'O', { row: 0, col: 1 });
    
    // Medium bot should always block
    for (let i = 0; i < 10; i++) {
      const move = bot.getMove(state);
      expect(move).toBe(2); // Must block at (0,2)
    }
  });

  it('should always take winning moves', () => {
    const config = getConfig(Difficulty.Medium);
    const bot = createHeuristicBot(config!);
    let state = createInitialState();
    
    // Set up a winning position for X
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 0 });
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    
    // X can win at (0,2)
    for (let i = 0; i < 10; i++) {
      const move = bot.getMove(state);
      expect(move).toBe(2); // Must win at (0,2)
    }
  });

  it('should prefer center on empty board', () => {
    const config = getConfig(Difficulty.Medium);
    const bot = createHeuristicBot(config!);
    const state = createInitialState();
    
    const move = bot.getMove(state);
    expect(move).toBe(4); // Center (1,1) = index 4
  });
});

describe('Hard Difficulty (Tuned Heuristic)', () => {
  it('should create a Heuristic Bot with Hard config', () => {
    const config = getConfig(Difficulty.Hard);
    const bot = createHeuristicBot(config!);
    const state = createInitialState();
    
    const move = bot.getMove(state);
    
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('should always block immediate threats (Hard)', () => {
    const config = getConfig(Difficulty.Hard);
    const bot = createHeuristicBot(config!);
    let state = createInitialState();
    
    // Set up a winning threat for O
    state = applyMove(state, 'X', { row: 1, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    state = applyMove(state, 'O', { row: 0, col: 1 });
    
    // Hard bot should always block
    for (let i = 0; i < 10; i++) {
      const move = bot.getMove(state);
      expect(move).toBe(2); // Must block at (0,2)
    }
  });

  it('should be more deterministic than Medium (lower randomness)', () => {
    const mediumConfig = getConfig(Difficulty.Medium);
    const hardConfig = getConfig(Difficulty.Hard);
    const mediumBot = createHeuristicBot(mediumConfig!);
    const hardBot = createHeuristicBot(hardConfig!);
    
    let state = createInitialState();
    
    // Place one mark to create a non-trivial position
    state = applyMove(state, 'X', { row: 1, col: 1 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    
    // Collect moves from both bots
    const mediumMoves = new Set<number>();
    const hardMoves = new Set<number>();
    
    for (let i = 0; i < 30; i++) {
      mediumMoves.add(mediumBot.getMove(state));
      hardMoves.add(hardBot.getMove(state));
    }
    
    // Hard bot should show less variety (more deterministic)
    // This test may be flaky, but generally Hard should be more focused
    expect(hardMoves.size).toBeLessThanOrEqual(mediumMoves.size);
  });

  it('should always take winning moves (Hard)', () => {
    const config = getConfig(Difficulty.Hard);
    const bot = createHeuristicBot(config!);
    let state = createInitialState();
    
    // Set up a winning position for X
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 0 });
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    
    // X can win at (0,2)
    for (let i = 0; i < 10; i++) {
      const move = bot.getMove(state);
      expect(move).toBe(2); // Must win at (0,2)
    }
  });

  it('should prevent classic corner fork on standard 3x3 (Mode 2 / NxN)', () => {
    const hardConfig = getConfig(Difficulty.Hard);
    const hardBot = createHeuristicBot(hardConfig!);
    
    // Use a standard 3×3 game state (no sliding - Mode 2)
    const state: GameState = {
      board: [
        ['X', null, null],
        [null, 'O', null],
        [null, null, 'X'],
      ],
      currentTurn: 3,
      winner: null,
      moveHistory: [],
    };
    
    // Hard bot MUST NOT play corners that allow fork
    // Corners (0,2) and (2,0) both allow X to fork in standard 3×3
    const unsafeMoves = [2, 6]; // (0,2) and (2,0) - these allow forks
    
    for (let i = 0; i < 10; i++) {
      const move = hardBot.getMove(state);
      // Hard should NOT choose a corner that allows fork
      expect(unsafeMoves).not.toContain(move);
    }
  });

  it('should handle Mode 1 sliding naturally (fork prevention not needed)', () => {
    // Mode 1 (Infinite 3×3 with sliding) naturally prevents corner forks
    // because the 4th mark removes the oldest mark
    const hardConfig = getConfig(Difficulty.Hard);
    const hardBot = createHeuristicBot(hardConfig!);
    let state = createInitialState();
    
    // Classic fork setup
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    
    // In Mode 1, any move is relatively safe because sliding prevents the fork
    // Just verify bot makes a valid move
    const move = hardBot.getMove(state);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('should allow Medium to fail against fork (expected behavior)', () => {
    const mediumConfig = getConfig(Difficulty.Medium);
    const mediumBot = createHeuristicBot(mediumConfig!);
    let state = createInitialState();
    
    // Same fork setup
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    
    // Medium might play corners (fork-vulnerable moves)
    // This is OK - Medium is not fork-aware
    const move = mediumBot.getMove(state);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
    // No specific assertion - Medium can make any valid move
  });
});

describe('Difficulty Comparison', () => {
  it('should show different behavior across difficulty levels', () => {
    const easyBot = createRandomBot();
    const mediumBot = createHeuristicBot(getConfig(Difficulty.Medium)!);
    const hardBot = createHeuristicBot(getConfig(Difficulty.Hard)!);
    
    const state = createInitialState();
    
    // All should return valid moves
    const easyMove = easyBot.getMove(state);
    const mediumMove = mediumBot.getMove(state);
    const hardMove = hardBot.getMove(state);
    
    expect(easyMove).toBeGreaterThanOrEqual(0);
    expect(easyMove).toBeLessThan(9);
    expect(mediumMove).toBeGreaterThanOrEqual(0);
    expect(mediumMove).toBeLessThan(9);
    expect(hardMove).toBeGreaterThanOrEqual(0);
    expect(hardMove).toBeLessThan(9);
    
    // Medium and Hard should prefer center
    expect(mediumMove).toBe(4);
    expect(hardMove).toBe(4);
  });

  it('should have Hard bot block more consistently than Random bot', () => {
    const easyBot = createRandomBot();
    const hardBot = createHeuristicBot(getConfig(Difficulty.Hard)!);
    
    let state = createInitialState();
    
    // Set up a blocking scenario
    state = applyMove(state, 'X', { row: 1, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    state = applyMove(state, 'O', { row: 0, col: 1 });
    
    let easyBlockCount = 0;
    let hardBlockCount = 0;
    const trials = 20;
    
    for (let i = 0; i < trials; i++) {
      if (easyBot.getMove(state) === 2) easyBlockCount++;
      if (hardBot.getMove(state) === 2) hardBlockCount++;
    }
    
    // Hard should block every time, Easy should rarely block
    expect(hardBlockCount).toBe(trials); // 100% blocking
    expect(easyBlockCount).toBeLessThan(trials * 0.5); // Less than 50%
  });
});

describe('NxN Board Difficulty Support', () => {
  it('should work with 4x4 boards on Medium difficulty', () => {
    const config = getConfig(Difficulty.Medium);
    const bot = createHeuristicBot(config!);
    
    // Create a simple 4x4 game state
    const state: GameState = {
      board: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ],
      currentTurn: 0,
      winner: null,
      moveHistory: [],
    };
    
    const move = bot.getMove(state);
    
    // Should return valid move for 4x4 board
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(16);
  });

  it('should work with 5x5 boards on Hard difficulty', () => {
    const config = getConfig(Difficulty.Hard);
    const bot = createHeuristicBot(config!);
    
    // Create a simple 5x5 game state
    const state: GameState = {
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
      ],
      currentTurn: 0,
      winner: null,
      moveHistory: [],
    };
    
    const move = bot.getMove(state);
    
    // Should return valid move for 5x5 board
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(25);
  });
});
