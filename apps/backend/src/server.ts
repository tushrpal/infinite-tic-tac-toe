import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches';
import playersRouter from './routes/players';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/matches', matchesRouter);
  app.use('/players', playersRouter);

  app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
