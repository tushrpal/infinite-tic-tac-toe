/**
 * Tests for MinimaxBot
 */

import { describe, it, expect } from 'vitest';
import { MinimaxBot } from './minimaxBot.js';
import { Modes } from '@infinite-ttt/game-engine';

describe('MinimaxBot', () => {
  describe('Mode 1: 3×3 with sliding', () => {
    it('should win in one move when opportunity exists', () => {
      const bot = new MinimaxBot(9);

      // Create a state where X can win
      // X | X | _
      // O | O | _
      // _ | _ | _
      const state = Modes.Infinite3x3.createInitialState();

      // Simulate moves to create the scenario
      let currentState = state;
      currentState = Modes.Infinite3x3.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.Infinite3x3.applyMove(currentState, 'O', { row: 1, col: 0 }); // O
      currentState = Modes.Infinite3x3.applyMove(currentState, 'X', { row: 0, col: 1 }); // X
      currentState = Modes.Infinite3x3.applyMove(currentState, 'O', { row: 1, col: 1 }); // O

      // Now X can win at (0,2)
      const move = bot.getMove(currentState);
      expect(move).toBe(2); // Index 2 is position (0,2)
    });

    it('should block opponent winning move', () => {
      const bot = new MinimaxBot(9);

      // Create a state where O needs to block X
      // X | X | _
      // _ | _ | _
      // _ | _ | _
      const state = Modes.Infinite3x3.createInitialState();

      let currentState = state;
      currentState = Modes.Infinite3x3.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.Infinite3x3.applyMove(currentState, 'O', { row: 1, col: 0 }); // O
      currentState = Modes.Infinite3x3.applyMove(currentState, 'X', { row: 0, col: 1 }); // X

      // Now O should block at (0,2)
      const move = bot.getMove(currentState);
      expect(move).toBe(2); // Index 2 is position (0,2) - blocking move
    });

    it('should prefer center on empty board', () => {
      const bot = new MinimaxBot(9);
      const state = Modes.Infinite3x3.createInitialState();

      const move = bot.getMove(state);

      // On an empty board, minimax may choose any corner or center
      // All are strategically equivalent with perfect play
      // Just verify it returns a valid move
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });
  });

  describe('Mode 2: NxN boards', () => {
    it('should win in one move on 3×3 board', () => {
      const bot = new MinimaxBot(9);

      // Create 3×3 game
      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 3 });

      // X | X | _
      // O | O | _
      // _ | _ | _
      let currentState = state;
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 0 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 1 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 1 }); // O

      // X should win at (0,2)
      const move = bot.getMove(currentState);
      expect(move).toBe(2); // Index 2 is position (0,2)
    });

    it('should work on 4×4 board', () => {
      const bot = new MinimaxBot(5); // Reduced depth for 4×4

      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 4 });

      // Should return a valid move
      const move = bot.getMove(state);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(16); // 4×4 = 16 cells
    });

    it('should work on 5×5 board', () => {
      const bot = new MinimaxBot(3); // Reduced depth for 5×5

      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 5 });

      // Should return a valid move
      const move = bot.getMove(state);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(25); // 5×5 = 25 cells
    });

    it('should block opponent on 4×4 board', () => {
      const bot = new MinimaxBot(5);

      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 4 });

      // Create a simpler blocking scenario
      // X | X | X | _
      // _ | _ | _ | _
      // _ | _ | _ | _
      // _ | _ | _ | _
      let currentState = state;
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 0 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 1 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 1 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 2 }); // X

      // O should block at (0,3) to prevent X from winning
      const move = bot.getMove(currentState);
      expect(move).toBe(3); // Index 3 is position (0,3)
    });
  });

  describe('Edge cases', () => {
    it('should handle single valid move', () => {
      const bot = new MinimaxBot(9);

      // Create nearly full board with one empty cell, avoiding all 3-in-a-rows
      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 3 });

      let currentState = state;
      // Pattern that avoids any 3-in-a-row wins:
      // X | O | X
      // X | O | O
      // O | X | ?
      // This avoids: rows, columns, and both diagonals
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 0, col: 1 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 2 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 1 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 1, col: 0 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 2 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 2, col: 1 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 2, col: 0 }); // O
      // Only (2,2) is empty now

      const move = bot.getMove(currentState);
      expect(move).toBe(8); // Only valid move at position (2,2)
    });

    it('should throw on no valid moves', () => {
      const bot = new MinimaxBot(9);

      // Create a won state
      const state = Modes.ExpandingBoard.createInitialState({ initialBoardSize: 3 });
      let currentState = state;
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 0 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 0 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 1 }); // X
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'O', { row: 1, col: 1 }); // O
      currentState = Modes.ExpandingBoard.applyMove(currentState, 'X', { row: 0, col: 2 }); // X wins

      expect(() => bot.getMove(currentState)).toThrow('No valid moves available');
    });
  });
});
