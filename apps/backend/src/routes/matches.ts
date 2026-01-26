import { Router } from 'express';
import { LocalJsonMatchStore } from '../storage/LocalJsonMatchStore';
import { isValidMatchResult } from '../validators/matchResultSchema';

const router = Router();
const store = new LocalJsonMatchStore();

router.post('/', async (req, res) => {
  if (!isValidMatchResult(req.body)) {
    return res.status(400).json({ error: 'Invalid MatchResult' });
  }

  await store.save(req.body);
  res.json({ success: true });
});

router.get('/', async (_, res) => {
  const matches = await store.getAll();
  res.json(matches);
});

export default router;
