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

const router = express.Router();

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
 * Request body (optional):
 * {
 *   displayName?: string;
 * }
 */
router.post('/', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { displayName } = (req.body ?? {}) as { displayName?: string };

    const playerId = safeRandomUUID();

    const player = await prisma.player.create({
      data: {
        id: playerId,
        displayName: displayName?.trim() || null,
      },
      select: {
        id: true,
        displayName: true,
        rating: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      playerId: player.id,
      displayName: player.displayName,
      rating: player.rating,
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
      displayName: profile.displayName,
      rating: profile.rating,
      createdAt: profile.createdAt,
      matchesPlayed: profile.matchesPlayed,
      wins: profile.wins,
      losses: profile.losses,
      draws: profile.draws,
      winRate: profile.winRate,
    });
  } catch (error) {
    console.error('Error loading player profile:', error);
    return res.status(500).json({ error: 'Failed to load player profile' });
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
        displayName: true,
        rating: true,
        createdAt: true,
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({
      playerId: player.id,
      displayName: player.displayName,
      rating: player.rating,
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
 */
router.get('/', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        rating: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      players: players.map((player) => ({
        playerId: player.id,
        displayName: player.displayName,
        rating: player.rating,
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
