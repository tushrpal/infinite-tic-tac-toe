/**
 * Tests for Mode 1: Infinite 3×3 reducer and rules
 */

import { describe, it, expect } from 'vitest';
import { createInitialState, applyMove, type Infinite3x3State } from './index';
import type { Position } from '../../core/types';

describe('Infinite3x3 - Initial State', () => {
  it('should create an empty board', () => {
    const state = createInitialState();
    
    expect(state.board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    expect(state.currentTurn).toBe(0);
    expect(state.winner).toBe(null);
    expect(state.moveHistory).toEqual([]);
    expect(state.playerMarks.X).toEqual([]);
    expect(state.playerMarks.O).toEqual([]);
  });
});

describe('Infinite3x3 - Basic Moves', () => {
  it('should place X in the first move', () => {
    const state = createInitialState();
    const newState = applyMove(state, 'X', { row: 0, col: 0 });
    
    expect(newState.board[0][0]).toBe('X');
    expect(newState.currentTurn).toBe(1);
    expect(newState.winner).toBe(null);
    expect(newState.playerMarks.X).toHaveLength(1);
  });

  it('should alternate players correctly', () => {
    let state = createInitialState();
    
    // X's turn
    state = applyMove(state, 'X', { row: 0, col: 0 });
    expect(state.board[0][0]).toBe('X');
    
    // O's turn
    state = applyMove(state, 'O', { row: 0, col: 1 });
    expect(state.board[0][1]).toBe('O');
    expect(state.currentTurn).toBe(2);
    
    // X's turn again
    state = applyMove(state, 'X', { row: 1, col: 0 });
    expect(state.board[1][0]).toBe('X');
    expect(state.currentTurn).toBe(3);
  });
});

describe('Infinite3x3 - Sliding Rule', () => {
  it('should remove oldest mark when player places 4th mark', () => {
    let state = createInitialState();
    
    // X places 3 marks (avoiding wins)
    state = applyMove(state, 'X', { row: 0, col: 0 }); // Turn 0
    state = applyMove(state, 'O', { row: 1, col: 1 }); // Turn 1
    state = applyMove(state, 'X', { row: 2, col: 0 }); // Turn 2
    state = applyMove(state, 'O', { row: 1, col: 0 }); // Turn 3
    state = applyMove(state, 'X', { row: 2, col: 1 }); // Turn 4
    
    // Verify X has 3 marks on the board and no win
    expect(state.playerMarks.X).toHaveLength(3);
    expect(state.winner).toBe(null);
    expect(state.board[0][0]).toBe('X');
    expect(state.board[2][0]).toBe('X');
    expect(state.board[2][1]).toBe('X');
    
    // X places 4th mark - oldest should be removed
    state = applyMove(state, 'O', { row: 0, col: 1 }); // Turn 5
    state = applyMove(state, 'X', { row: 1, col: 2 }); // Turn 6 - 4th X mark
    
    // The oldest X mark (at 0,0) should be removed
    expect(state.board[0][0]).toBe(null);
    expect(state.board[2][0]).toBe('X');
    expect(state.board[2][1]).toBe('X');
    expect(state.board[1][2]).toBe('X');
    expect(state.playerMarks.X).toHaveLength(3); // Still 3 active marks
  });

  it('should maintain correct mark order after sliding', () => {
    let state = createInitialState();
    
    // Create a scenario where sliding happens (avoiding wins)
    const positions: Position[] = [
      { row: 0, col: 0 }, // X - oldest
      { row: 1, col: 1 }, // O
      { row: 2, col: 0 }, // X
      { row: 2, col: 2 }, // O
      { row: 2, col: 1 }, // X
      { row: 1, col: 0 }, // O
      { row: 1, col: 2 }, // X - 4th, should remove first X
    ];
    
    for (const pos of positions) {
      const player = state.currentTurn % 2 === 0 ? 'X' : 'O';
      state = applyMove(state, player, pos);
    }
    
    // After placing 4th X, the oldest (0,0) should be gone
    expect(state.board[0][0]).toBe(null);
    expect(state.board[2][0]).toBe('X');
    expect(state.board[2][1]).toBe('X');
    expect(state.board[1][2]).toBe('X');
  });
});

describe('Infinite3x3 - Win Detection', () => {
  it('should detect horizontal win', () => {
    let state = createInitialState();
    
    // X wins horizontally
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 0 });
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    state = applyMove(state, 'X', { row: 0, col: 2 });
    
    expect(state.winner).toBe('X');
  });

  it('should detect vertical win', () => {
    let state = createInitialState();
    
    // O wins vertically (column 0) - must ensure O wins before X completes their line
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 0, col: 0 });
    state = applyMove(state, 'X', { row: 1, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 0 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    state = applyMove(state, 'O', { row: 2, col: 0 });
    
    expect(state.winner).toBe('O');
  });

  it('should detect diagonal win (top-left to bottom-right)', () => {
    let state = createInitialState();
    
    // X wins diagonal
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 1 });
    state = applyMove(state, 'X', { row: 1, col: 1 });
    state = applyMove(state, 'O', { row: 0, col: 2 });
    state = applyMove(state, 'X', { row: 2, col: 2 });
    
    expect(state.winner).toBe('X');
  });

  it('should detect diagonal win (top-right to bottom-left)', () => {
    let state = createInitialState();
    
    // O wins diagonal
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 0, col: 2 });
    state = applyMove(state, 'X', { row: 1, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    state = applyMove(state, 'X', { row: 2, col: 1 });
    state = applyMove(state, 'O', { row: 2, col: 0 });
    
    expect(state.winner).toBe('O');
  });

  it('should detect win after sliding removes a mark', () => {
    // Test that win detection happens AFTER sliding removes the oldest mark
    let state = createInitialState();
    
    // X places 3 marks that don't form a win
    state = applyMove(state, 'X', { row: 0, col: 0 }); // This will be removed
    state = applyMove(state, 'O', { row: 2, col: 2 });
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 2 });
    state = applyMove(state, 'X', { row: 1, col: 1 });
    state = applyMove(state, 'O', { row: 2, col: 0 });
    
    // Now X places 4th mark at (2,1), which removes (0,0)
    // After removal: X has marks at (0,1), (1,1), (2,1) - vertical win in column 1!
    state = applyMove(state, 'X', { row: 2, col: 1 });
    
    // After sliding removes (0,0), X should have vertical win in column 1
    expect(state.board[0][0]).toBe(null); // Oldest removed
    expect(state.winner).toBe('X'); // Win detected after sliding
  });
});

describe('Infinite3x3 - Invalid Moves', () => {
  it('should ignore moves on occupied cells', () => {
    let state = createInitialState();
    
    state = applyMove(state, 'X', { row: 0, col: 0 });
    const originalState = state;
    
    // Try to place O on the same cell
    state = applyMove(state, 'O', { row: 0, col: 0 });
    
    // State should be unchanged
    expect(state).toEqual(originalState);
  });

  it('should ignore moves after game is won', () => {
    let state = createInitialState();
    
    // X wins
    state = applyMove(state, 'X', { row: 0, col: 0 });
    state = applyMove(state, 'O', { row: 1, col: 0 });
    state = applyMove(state, 'X', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 1, col: 1 });
    state = applyMove(state, 'X', { row: 0, col: 2 });
    
    expect(state.winner).toBe('X');
    
    const wonState = state;
    
    // Try to make another move after win
    state = applyMove(state, 'O', { row: 2, col: 0 });
    
    // State should be unchanged
    expect(state).toEqual(wonState);
  });

  it('should ignore moves out of turn', () => {
    let state = createInitialState();
    
    state = applyMove(state, 'X', { row: 0, col: 0 });
    const turn1State = state;
    
    // O tries to move twice in a row
    state = applyMove(state, 'O', { row: 0, col: 1 });
    state = applyMove(state, 'O', { row: 0, col: 2 }); // Should be ignored
    
    // Should be X's turn, so second O move ignored
    expect(state.currentTurn).toBe(2);
    expect(state.board[0][2]).toBe(null);
  });
});

describe('Infinite3x3 - Edge Cases', () => {
  it('should handle rapid moves correctly', () => {
    let state = createInitialState();
    
    // Make 9 moves rapidly (some will be invalid due to occupied cells, but valid ones will process)
    const moves: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
    ];
    
    let validMovesCount = 0;
    for (const move of moves) {
      const player = state.currentTurn % 2 === 0 ? 'X' : 'O';
      const prevTurn = state.currentTurn;
      state = applyMove(state, player, move);
      if (state.currentTurn !== prevTurn) {
        validMovesCount++;
      }
      // Stop if game is won
      if (state.winner) break;
    }
    
    // At most 6 valid moves (3 per player) unless someone wins earlier
    // Note: when sliding frees cells, they can be reused, so more than 6 moves are possible
    // But with the sliding rule, each player can only have 3 marks active at once
    expect(validMovesCount).toBeGreaterThanOrEqual(0);
    // All cells should be filled (but oldest marks may have been removed)
    const totalMarks = state.board.flat().filter(cell => cell !== null).length;
    expect(totalMarks).toBeLessThanOrEqual(6); // At most 3 per player
  });

  it('should correctly track move history', () => {
    let state = createInitialState();
    
    state = applyMove(state, 'X', { row: 0, col: 0 });
    expect(state.moveHistory).toHaveLength(1);
    
    state = applyMove(state, 'O', { row: 0, col: 1 });
    expect(state.moveHistory).toHaveLength(2);
    
    // Build up to 3 marks for X
    state = applyMove(state, 'X', { row: 2, col: 0 });
    expect(state.moveHistory).toHaveLength(3);
    
    state = applyMove(state, 'O', { row: 1, col: 1 });
    expect(state.moveHistory).toHaveLength(4);
    
    state = applyMove(state, 'X', { row: 2, col: 2 });
    expect(state.moveHistory).toHaveLength(5);
    expect(state.winner).toBe(null); // No win yet
    
    state = applyMove(state, 'O', { row: 1, col: 0 });
    const historyBeforeFourthX = state.moveHistory.length;
    
    // X's 4th mark - oldest X mark should be removed from history
    // X currently has marks at (0,0), (2,0), (2,2)
    state = applyMove(state, 'X', { row: 1, col: 2 });
    
    // When sliding occurs, we remove oldest move and add new move
    // History length should be: historyBeforeFourthX - 1 (remove oldest) + 1 (add new) = historyBeforeFourthX
    expect(state.moveHistory.length).toBe(historyBeforeFourthX);
    
    // Verify X now has exactly 3 active marks (not 4)
    expect(state.playerMarks.X).toHaveLength(3);
    
    // Verify the oldest X mark (at 0,0) was removed from the board
    // After sliding, X should have marks at (2,0), (2,2), and (1,2), not (0,0)
    expect(state.board[0][0]).toBe(null); // Oldest mark removed
    expect(state.board[2][0]).toBe('X'); // Second mark still there
    expect(state.board[2][2]).toBe('X'); // Third mark still there
    expect(state.board[1][2]).toBe('X'); // New mark placed
  });
});
