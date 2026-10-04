/**
 * Players API Routes
 *
 * PostgreSQL-backed player identity and rating store.
 * Player is authoritative for identity and rating.
 */

import express from 'express';
import { randomUUID } from 'crypto';
import { getPrismaClient } from '../storage/prismaClient';
import { getPlayerProfile } from '../profile/playerProfileService';
import { getPlayerMatches } from '../profile/matchHistoryService';
import { createPlayerWithAvailableUsername } from '../auth/authUtils';
import { isValidUsername, isValidDisplayName, sanitizeUsername } from '../utils/validation';
import { requireAuth } from '../middleware/requireAuth';
import { defaultLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * GET /players/check-username/:username
 *
 * Check if username is available (for real-time validation).
 * Returns availability status and sanitized username.
 */
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const sanitized = sanitizeUsername(username);

    // Check format validity
    if (!isValidUsername(sanitized)) {
      return res.status(200).json({
        available: false,
        reason: 'invalid_format',
        message: 'Invalid username format',
      });
    }

    const prisma = getPrismaClient();

    // Check if username exists (optimized with select)
    const existing = await prisma.player.findUnique({
      where: { username: sanitized },
      select: { username: true },
    });

    return res.status(200).json({
      available: !existing,
      username: sanitized,
      reason: existing ? 'taken' : null,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ error: 'Failed to check username' });
  }
});

function safeRandomUUID(): string {
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }

  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_MATCH_LIMIT = 20;
const MAX_MATCH_LIMIT = 100;

function parseMatchLimit(value: unknown): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return DEFAULT_MATCH_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MATCH_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_MATCH_LIMIT);
}

/**
 * POST /players
 *
 * Create a new player identity with default rating.
 *
 * Request body:
 * {
 *   username: string; // Required, unique, 3-20 chars, alphanumeric + underscore
 *   displayName: string; // Required, 1-50 chars, at least 3 letters. May repeat.
 * }
 */
router.post('/', defaultLimiter, async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { username, displayName } = (req.body ?? {}) as { username?: string; displayName?: string };

    // Display names may repeat, so they are never checked for uniqueness.
    if (!displayName || !isValidDisplayName(displayName)) {
      return res.status(400).json({
        error: 'Invalid display name. Must be 1-50 characters with at least 3 letters'
      });
    }

    // Username is server-assigned. A client-supplied username is used as the
    // seed (and must be valid); otherwise the display name seeds it.
    let seed: string;
    if (username) {
      seed = sanitizeUsername(username);
      if (!isValidUsername(seed)) {
        return res.status(400).json({
          error: 'Invalid username. Must be 3-20 characters, alphanumeric and underscore only, cannot start/end with underscore'
        });
      }
    } else {
      seed = displayName;
    }

    const playerId = safeRandomUUID();

    const player = await createPlayerWithAvailableUsername(seed, (assigned) =>
      prisma.player.create({
        data: {
          id: playerId,
          username: assigned,
          displayName: displayName.trim(),
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
          isAnonymous: true,
          createdAt: true,
        },
      }),
    );

    res.status(201).json({
      playerId: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
      isAnonymous: player.isAnonymous,
      createdAt: player.createdAt,
    });
  } catch (error) {
    console.error('Error saving player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

/**
 * GET /players/:playerId/profile
 *
 * Return player profile stats.
 */
router.get('/:playerId/profile', async (req, res) => {
  try {
    const { playerId } = req.params;
    const profile = await getPlayerProfile(playerId);

    if (!profile) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.status(200).json({
      playerId: profile.playerId,
      username: profile.username,
      displayName: profile.displayName,
      rating: profile.rating,
      ratingMode1: profile.ratingMode1,
      ratingMode2: profile.ratingMode2,
      createdAt: profile.createdAt,
      matchesPlayed: profile.matchesPlayed,
      wins: profile.wins,
      losses: profile.losses,
      draws: profile.draws,
      winRate: profile.winRate,
      isAnonymous: profile.isAnonymous,
      oauthProvider: profile.oauthProvider,
    });
  } catch (error) {
    console.error('Error loading player profile:', error);
    return res.status(500).json({ error: 'Failed to load player profile' });
  }
});

/**
 * PATCH /players/:playerId
 *
 * Update player's display name.
 *
 * Request body:
 * {
 *   displayName: string;
 * }
 */
router.patch('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { displayName } = (req.body ?? {}) as { displayName?: string };

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    if (!isValidDisplayName(displayName)) {
      return res.status(400).json({
        error: 'Invalid display name. Must be 1-50 characters'
      });
    }

    const prisma = getPrismaClient();

    // Check if player exists
    const existing = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update display name
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { displayName: displayName.trim() },
      select: {
        id: true,
        username: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      playerId: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      rating: updated.ratingMode1 + updated.ratingMode2,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return res.status(500).json({ error: 'Failed to update player' });
  }
});

/**
 * GET /players/:playerId/matches
 * Optional query params: limit=number
 */
router.get('/:playerId/matches', async (req, res) => {
  try {
    const { playerId } = req.params;
    const limit = parseMatchLimit(req.query.limit);

    const matches = await getPlayerMatches(playerId, limit);

    return res.status(200).json({ matches, count: matches.length });
  } catch (error) {
    console.error('Error loading player matches:', error);
    return res.status(500).json({ error: 'Failed to load player matches' });
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
    const prisma = getPrismaClient();
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        username: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
        isAnonymous: true,
        createdAt: true,
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({
      playerId: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
      ratingMode1: player.ratingMode1,
      ratingMode2: player.ratingMode2,
      isAnonymous: player.isAnonymous,
      createdAt: player.createdAt,
    });
  } catch (error) {
    console.error('Error loading player:', error);
    res.status(500).json({ error: 'Failed to load player' });
  }
});

/**
 * GET /players
 *
 * List all players (for debugging/admin purposes).
 * Requires authentication to prevent public roster enumeration.
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      players: players.map((player) => ({
        playerId: player.id,
        displayName: player.displayName,
        rating: player.ratingMode1 + player.ratingMode2,
        createdAt: player.createdAt,
      })),
      count: players.length,
    });
  } catch (error) {
    console.error('Error listing players:', error);
    res.status(500).json({ error: 'Failed to list players' });
  }
});

export default router;
