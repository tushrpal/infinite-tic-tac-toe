/**
 * Recent Opponents API Routes
 *
 * Tracks and retrieves the last 20 unique opponents for each player
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { defaultLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * GET /recent-opponents
 *
 * Get last 20 unique opponents with match details
 *
 * Returns: Array of recent opponents sorted by lastPlayedAt DESC
 * Each entry includes:
 * - opponent profile (username, displayName, rating)
 * - match details (id, mode, outcome from current player's perspective)
 * - lastPlayedAt timestamp
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    // Fetch recent opponents with player and match details
    const recentOpponents = await prisma.recentOpponent.findMany({
      where: {
        playerId,
      },
      include: {
        opponent: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
            isAnonymous: true,
          },
        },
        match: {
          select: {
            id: true,
            mode: true,
            isRanked: true,
            winner: true,
            roundsPlayed: true,
            totalMoves: true,
            createdAtMs: true,
          },
        },
      },
      orderBy: {
        lastPlayedAt: 'desc',
      },
      take: 20,
    });

    // Map to response format with outcome from player's perspective
    const opponents = recentOpponents.map((ro) => {
      let outcome: 'won' | 'lost' | 'draw';

      if (!ro.match.winner) {
        outcome = 'draw';
      } else if (ro.match.winner === playerId) {
        outcome = 'won';
      } else {
        outcome = 'lost';
      }

      return {
        id: ro.id,
        opponent: ro.opponent,
        match: {
          id: ro.match.id,
          mode: ro.match.mode,
          isRanked: ro.match.isRanked,
          outcome,
          roundsPlayed: ro.match.roundsPlayed,
          totalMoves: ro.match.totalMoves,
          playedAt: new Date(Number(ro.match.createdAtMs)),
        },
        lastPlayedAt: ro.lastPlayedAt,
      };
    });

    res.json(opponents);
  } catch (error) {
    console.error('Error fetching recent opponents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
