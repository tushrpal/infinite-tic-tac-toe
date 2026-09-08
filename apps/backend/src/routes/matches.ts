import { Router } from 'express';
import type { MatchStorage } from '../storage/MatchStorage';
import { isValidMatchResult } from '../validators/matchResultSchema';
import { defaultLimiter } from '../middleware/rateLimiter';
import { getPrismaClient } from '../storage/prismaClient';

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

function parsePagination(value: unknown, fallback: number, max: number): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

export function createMatchesRouter(store: MatchStorage) {
  const router = Router();

  router.post('/', defaultLimiter, async (req, res) => {
    if (!isValidMatchResult(req.body)) {
      return res.status(400).json({ error: 'Invalid MatchResult' });
    }

    await store.saveMatch(req.body);
    res.json({ success: true });
  });

  router.get('/', defaultLimiter, async (req, res) => {
    const limit = parsePagination(req.query.limit, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
    const offset = parsePagination(req.query.offset, 0, Number.MAX_SAFE_INTEGER);
    const { matches, hasMore } = await store.getMatches(limit, offset);
    res.json({ matches, count: matches.length, hasMore });
  });

  router.get('/:matchId', async (req, res) => {
    const match = await store.getMatch(req.params.matchId);
    if (!match) {
      return res.status(404).json({
        error: 'Match not found',
        message: 'Replay is unavailable. Only the last 3 matches per player are kept.',
      });
    }

    const humanPlayerIds = match.players
      .filter((player) => player.type === 'human')
      .map((player) => player.id);

    const prisma = getPrismaClient();
    const profiles = humanPlayerIds.length > 0
      ? await prisma.player.findMany({
          where: { id: { in: humanPlayerIds } },
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        })
      : [];

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    return res.json({
      ...match,
      players: match.players.map((player) => {
        if (player.type === 'bot') {
          return {
            ...player,
            username: 'Bot',
          };
        }

        const profile = profileById.get(player.id);
        return {
          ...player,
          username: profile?.username ?? player.id,
          displayName: profile?.displayName ?? undefined,
          rating: profile ? profile.ratingMode1 + profile.ratingMode2 : undefined,
        };
      }),
    });
  });

  return router;
}
