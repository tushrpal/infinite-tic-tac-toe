import { Router } from 'express';
import type { MatchStorage } from '../storage/MatchStorage';
import { isValidMatchResult } from '../validators/matchResultSchema';

export function createMatchesRouter(store: MatchStorage) {
  const router = Router();

  router.post('/', async (req, res) => {
    if (!isValidMatchResult(req.body)) {
      return res.status(400).json({ error: 'Invalid MatchResult' });
    }

    await store.saveMatch(req.body);
    res.json({ success: true });
  });

  router.get('/', async (_, res) => {
    const matches = await store.getMatches();
    res.json(matches);
  });

  router.get('/:matchId', async (req, res) => {
    const match = await store.getMatch(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    return res.json(match);
  });

  return router;
}
