/**
 * Public exports for the game engine package
 * 
 * This is the main entry point. Only exports that are part of
 * the stable public API should be exposed here.
 */

// Core types and utilities
export * from './core/types';
export * from './core/errors';

// Game modes
export * as Modes from './modes';

// Re-export commonly used types from Mode 1 for convenience
export type { Infinite3x3State, Board, Cell } from './modes/infinite-3x3/state';
