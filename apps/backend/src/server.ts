import express from 'express';
import cors from 'cors';
import { createMatchesRouter } from './routes/matches';
import playersRouter from './routes/players';
import pvpRouter from './routes/pvp';
import { createMatchStorage } from './storage/createMatchStorage';

export function createServer() {
  const app = express();
  const matchStorage = createMatchStorage();

  app.use(cors());
  app.use(express.json());

  app.use('/matches', createMatchesRouter(matchStorage));
  app.use('/players', playersRouter);
  app.use('/pvp', pvpRouter);

  app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
