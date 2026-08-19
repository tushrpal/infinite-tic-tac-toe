import { Router } from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { getGlobalLeaderboard, getLeaderboardByMode } from '../leaderboard/leaderboardService';

const router = Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parseLimit(value: unknown): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function parseMode(value: unknown): 'mode1' | 'mode2' | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (value === 'mode1' || value === 'mode2') {
    return value;
  }

  return null;
}

/**
 * GET /leaderboard
 * Optional query params: mode=mode1|mode2, limit=number
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const mode = parseMode(req.query.mode);

    if (req.query.mode && !mode) {
      return res.status(400).json({ error: 'Invalid mode. Must be mode1 or mode2.' });
    }

    const leaderboard = mode
      ? await getLeaderboardByMode(mode, limit)
      : await getGlobalLeaderboard(limit);

    // Prevent caching to ensure fresh leaderboard data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({ leaderboard, count: leaderboard.length });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

/**
 * GET /leaderboard/:playerId/rank
 * Returns global rank for the player (based on combined rating).
 */
router.get('/:playerId/rank', async (req, res) => {
  try {
    const { playerId } = req.params;
    const prisma = getPrismaClient();

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, displayName: true, ratingMode1: true, ratingMode2: true },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const playerCombinedRating = player.ratingMode1 + player.ratingMode2;

    // Count players with higher combined rating
    // Since we can't filter on computed fields, we need to fetch and calculate
    const allPlayers = await prisma.player.findMany({
      select: { ratingMode1: true, ratingMode2: true },
    });

    const higherRatedCount = allPlayers.filter(
      (p) => (p.ratingMode1 + p.ratingMode2) > playerCombinedRating
    ).length;

    const rank = higherRatedCount + 1;

    return res.status(200).json({
      rank,
      playerId: player.id,
      displayName: player.displayName ?? player.id,
      rating: playerCombinedRating,
    });
  } catch (error) {
    console.error('Error loading player rank:', error);
    return res.status(500).json({ error: 'Failed to load player rank' });
  }
});

export default router;
