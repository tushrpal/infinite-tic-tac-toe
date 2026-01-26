/**
 * Players API Routes
 * 
 * Minimal player identity storage.
 * No authentication, no validation beyond basic structure.
 * Intentionally simple for local-first architecture.
 */

import express from 'express';
import type { PlayerIdentity } from '@infinite-ttt/identity';
import { createLocalPlayerStore } from '../storage';

const router = express.Router();
const playerStore = createLocalPlayerStore();

/**
 * POST /players
 * 
 * Store or update player identity.
 * 
 * Rules:
 * - Idempotent (same playerId → update displayName only)
 * - No auth checks
 * - No trust logic
 * - No uniqueness enforcement beyond playerId
 * 
 * Request body:
 * {
 *   playerId: string;
 *   displayName: string;
 *   createdAt: number;
 * }
 */
router.post('/', async (req, res) => {
  try {
    const identity = req.body as PlayerIdentity;
    
    // Basic validation
    if (!identity.playerId || !identity.displayName || !identity.createdAt) {
      return res.status(400).json({
        error: 'Missing required fields: playerId, displayName, createdAt',
      });
    }
    
    // Store or update
    await playerStore.save(identity);
    
    res.status(200).json({ success: true, playerId: identity.playerId });
  } catch (error) {
    console.error('Error saving player:', error);
    res.status(500).json({ error: 'Failed to save player' });
  }
});

/**
 * GET /players/:playerId
 * 
 * Retrieve player identity by ID.
 * Returns 404 if not found.
 */
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const identity = await playerStore.load(playerId);
    
    if (!identity) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.status(200).json(identity);
  } catch (error) {
    console.error('Error loading player:', error);
    res.status(500).json({ error: 'Failed to load player' });
  }
});

/**
 * GET /players
 * 
 * List all players (for debugging/admin purposes).
 */
router.get('/', async (req, res) => {
  try {
    const players = await playerStore.getAll();
    res.status(200).json({ players, count: players.length });
  } catch (error) {
    console.error('Error listing players:', error);
    res.status(500).json({ error: 'Failed to list players' });
  }
});

export default router;
