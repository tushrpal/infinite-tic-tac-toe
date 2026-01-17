/**
 * Tests for Mode 2: Expanding Board
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  createNextRoundState,
  applyMove,
  isValidMove,
  isRoundComplete,
  getRoundStartingPlayer,
  detectWinner,
  checkWin,
  type ExpandingBoardState,
} from './index';

describe('Mode 2: Expanding Board', () => {
  describe('State Creation', () => {
    it('should create initial state with 3×3 board', () => {
      const state = createInitialState();
      
      expect(state.boardSize).toBe(3);
      expect(state.roundNumber).toBe(1);
      expect(state.currentTurn).toBe(0);
      expect(state.board).toHaveLength(3);
      expect(state.board[0]).toHaveLength(3);
      expect(state.roundWinner).toBeNull();
      expect(state.moveHistory).toHaveLength(0);
      expect(state.roundHistory).toHaveLength(0);
    });
    
    it('should create initial state with custom board size', () => {
      const state = createInitialState({ initialBoardSize: 5 });
      
      expect(state.boardSize).toBe(5);
      expect(state.board).toHaveLength(5);
      expect(state.board[0]).toHaveLength(5);
    });
    
    it('should create next round with expanded board', () => {
      const state1 = createInitialState();
      const state2 = createNextRoundState(state1, 'O');
      
      expect(state2.boardSize).toBe(4);
      expect(state2.roundNumber).toBe(2);
      expect(state2.currentTurn).toBe(0);
      expect(state2.board).toHaveLength(4);
      expect(state2.board[0]).toHaveLength(4);
      expect(state2.roundWinner).toBeNull();
      expect(state2.moveHistory).toHaveLength(0);
    });
  });
  
  describe('Move Validation', () => {
    it('should allow valid moves', () => {
      const state = createInitialState();
      
      expect(isValidMove(state, 'X', { row: 0, col: 0 })).toBe(true);
      expect(isValidMove(state, 'X', { row: 1, col: 1 })).toBe(true);
      expect(isValidMove(state, 'X', { row: 2, col: 2 })).toBe(true);
    });
    
    it('should reject move by wrong player', () => {
      const state = createInitialState();
      
      // X goes first
      expect(isValidMove(state, 'O', { row: 0, col: 0 })).toBe(false);
    });
    
    it('should reject out-of-bounds moves', () => {
      const state = createInitialState();
      
      expect(isValidMove(state, 'X', { row: -1, col: 0 })).toBe(false);
      expect(isValidMove(state, 'X', { row: 0, col: -1 })).toBe(false);
      expect(isValidMove(state, 'X', { row: 3, col: 0 })).toBe(false);
      expect(isValidMove(state, 'X', { row: 0, col: 3 })).toBe(false);
    });
    
    it('should reject moves on occupied cells', () => {
      let state = createInitialState();
      state = applyMove(state, 'X', { row: 0, col: 0 });
      
      expect(isValidMove(state, 'O', { row: 0, col: 0 })).toBe(false);
    });
    
    it('should reject moves after round is won', () => {
      let state = createInitialState();
      
      // Create a winning position for X (row 0)
      state = applyMove(state, 'X', { row: 0, col: 0 }); // X
      state = applyMove(state, 'O', { row: 1, col: 0 }); // O
      state = applyMove(state, 'X', { row: 0, col: 1 }); // X
      state = applyMove(state, 'O', { row: 1, col: 1 }); // O
      state = applyMove(state, 'X', { row: 0, col: 2 }); // X wins!
      
      expect(state.roundWinner).toBe('X');
      expect(isValidMove(state, 'O', { row: 2, col: 2 })).toBe(false);
    });
  });
  
  describe('Move Application', () => {
    it('should apply valid moves correctly', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 0 });
      expect(state.board[0][0]).toBe('X');
      expect(state.currentTurn).toBe(1);
      expect(state.moveHistory).toHaveLength(1);
      expect(state.moveHistory[0].player).toBe('X');
      
      state = applyMove(state, 'O', { row: 1, col: 1 });
      expect(state.board[1][1]).toBe('O');
      expect(state.currentTurn).toBe(2);
      expect(state.moveHistory).toHaveLength(2);
    });
    
    it('should not modify state for invalid moves', () => {
      const state = createInitialState();
      const newState = applyMove(state, 'O', { row: 0, col: 0 }); // Wrong player
      
      expect(newState).toBe(state); // Same reference
      expect(state.board[0][0]).toBeNull();
      expect(state.currentTurn).toBe(0);
    });
  });
  
  describe('Win Detection - 3×3', () => {
    it('should detect horizontal win (row 0)', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 1, col: 0 });
      state = applyMove(state, 'X', { row: 0, col: 1 });
      state = applyMove(state, 'O', { row: 1, col: 1 });
      state = applyMove(state, 'X', { row: 0, col: 2 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(3);
      expect(isRoundComplete(state)).toBe(true);
    });
    
    it('should detect vertical win (col 1)', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 1 });
      state = applyMove(state, 'O', { row: 0, col: 0 });
      state = applyMove(state, 'X', { row: 1, col: 1 });
      state = applyMove(state, 'O', { row: 0, col: 2 });
      state = applyMove(state, 'X', { row: 2, col: 1 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(3);
    });
    
    it('should detect diagonal win (main diagonal)', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 1 });
      state = applyMove(state, 'X', { row: 1, col: 1 });
      state = applyMove(state, 'O', { row: 0, col: 2 });
      state = applyMove(state, 'X', { row: 2, col: 2 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(3);
    });
    
    it('should detect anti-diagonal win', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 2 });
      state = applyMove(state, 'O', { row: 0, col: 0 });
      state = applyMove(state, 'X', { row: 1, col: 1 });
      state = applyMove(state, 'O', { row: 0, col: 1 });
      state = applyMove(state, 'X', { row: 2, col: 0 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(3);
    });
    
    it('should detect O winning', () => {
      let state = createInitialState();
      
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 1, col: 0 });
      state = applyMove(state, 'X', { row: 0, col: 1 });
      state = applyMove(state, 'O', { row: 1, col: 1 });
      state = applyMove(state, 'X', { row: 2, col: 2 });
      state = applyMove(state, 'O', { row: 1, col: 2 });
      
      expect(state.roundWinner).toBe('O');
      expect(state.winningLine).toHaveLength(3);
    });
  });
  
  describe('Win Detection - 4×4', () => {
    it('should require 4-in-a-row on 4×4 board', () => {
      let state = createInitialState({ initialBoardSize: 4 });
      
      // Get 3-in-a-row (should NOT win)
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 1, col: 0 });
      state = applyMove(state, 'X', { row: 0, col: 1 });
      state = applyMove(state, 'O', { row: 1, col: 1 });
      state = applyMove(state, 'X', { row: 0, col: 2 });
      
      expect(state.roundWinner).toBeNull();
      
      // Complete 4-in-a-row (should win)
      state = applyMove(state, 'O', { row: 1, col: 2 });
      state = applyMove(state, 'X', { row: 0, col: 3 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(4);
    });
    
    it('should detect 4-in-a-row diagonal on 4×4', () => {
      let state = createInitialState({ initialBoardSize: 4 });
      
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 1 });
      state = applyMove(state, 'X', { row: 1, col: 1 });
      state = applyMove(state, 'O', { row: 0, col: 2 });
      state = applyMove(state, 'X', { row: 2, col: 2 });
      state = applyMove(state, 'O', { row: 0, col: 3 });
      state = applyMove(state, 'X', { row: 3, col: 3 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(4);
    });
  });
  
  describe('Win Detection - 5×5', () => {
    it('should require 5-in-a-row on 5×5 board', () => {
      let state = createInitialState({ initialBoardSize: 5 });
      
      // Create 5-in-a-row in column 0
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 1 });
      state = applyMove(state, 'X', { row: 1, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 2 });
      state = applyMove(state, 'X', { row: 2, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 3 });
      state = applyMove(state, 'X', { row: 3, col: 0 });
      state = applyMove(state, 'O', { row: 0, col: 4 });
      state = applyMove(state, 'X', { row: 4, col: 0 });
      
      expect(state.roundWinner).toBe('X');
      expect(state.winningLine).toHaveLength(5);
    });
  });
  
  describe('Round History', () => {
    it('should record round results in history', () => {
      let state = createInitialState();
      
      // Win round 1
      state = applyMove(state, 'X', { row: 0, col: 0 });
      state = applyMove(state, 'O', { row: 1, col: 0 });
      state = applyMove(state, 'X', { row: 0, col: 1 });
      state = applyMove(state, 'O', { row: 1, col: 1 });
      state = applyMove(state, 'X', { row: 0, col: 2 });
      
      expect(state.roundHistory).toHaveLength(1);
      expect(state.roundHistory[0].winner).toBe('X');
      expect(state.roundHistory[0].winningLine).toHaveLength(3);
    });
  });
  
  describe('Starting Player Alternation', () => {
    it('should alternate starting player each round', () => {
      expect(getRoundStartingPlayer(1, 'X')).toBe('X');
      expect(getRoundStartingPlayer(2, 'X')).toBe('O');
      expect(getRoundStartingPlayer(3, 'X')).toBe('X');
      expect(getRoundStartingPlayer(4, 'X')).toBe('O');
      
      expect(getRoundStartingPlayer(1, 'O')).toBe('O');
      expect(getRoundStartingPlayer(2, 'O')).toBe('X');
      expect(getRoundStartingPlayer(3, 'O')).toBe('O');
      expect(getRoundStartingPlayer(4, 'O')).toBe('X');
    });
  });
  
  describe('Board Expansion', () => {
    it('should expand board size correctly through multiple rounds', () => {
      let state = createInitialState();
      expect(state.boardSize).toBe(3);
      
      state = createNextRoundState(state, 'O');
      expect(state.boardSize).toBe(4);
      expect(state.roundNumber).toBe(2);
      
      state = createNextRoundState(state, 'X');
      expect(state.boardSize).toBe(5);
      expect(state.roundNumber).toBe(3);
      
      state = createNextRoundState(state, 'O');
      expect(state.boardSize).toBe(6);
      expect(state.roundNumber).toBe(4);
    });
  });
});
