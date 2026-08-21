/**
 * Bot module exports
 *
 * Core bot infrastructure for the backend:
 * - BotController: Manages bot instances for active matches
 * - Bot types and utilities
 */

export { BotController, botController } from './botController.js';
export type { BotInfo } from './types.js';
export { isBotInfo } from './types.js';
