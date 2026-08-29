import express from 'express';
import cors from 'cors';
import { createMatchesRouter } from './routes/matches';
import playersRouter from './routes/players';
import pvpRouter from './routes/pvp';
import leaderboardRouter from './routes/leaderboard';
import authRouter from './routes/auth';
import friendsRouter from './routes/friends';
import challengesRouter from './routes/challenges';
import privateMatchesRouter from './routes/private-matches';
import recentOpponentsRouter from './routes/recent-opponents';
import roomsRouter from './routes/rooms';
import roomInvitesRouter from './routes/room-invites';
import { createMatchStorage } from './storage/createMatchStorage';

export function createServer() {
  const app = express();
  const matchStorage = createMatchStorage();

  app.use(cors());
  app.use(express.json());

  app.use('/matches', createMatchesRouter(matchStorage));
  app.use('/players', playersRouter);
  app.use('/pvp', pvpRouter);
  app.use('/leaderboard', leaderboardRouter);
  app.use('/auth', authRouter);
  app.use('/friends', friendsRouter);
  app.use('/challenges', challengesRouter);
  app.use('/private-matches', privateMatchesRouter);
  app.use('/recent-opponents', recentOpponentsRouter);
  app.use('/rooms', roomsRouter);
  app.use('/room-invites', roomInvitesRouter);

  app.get('/health', (_, res) => {
    const wsUrl = process.env.WS_URL?.trim() || null;
    res.json({ status: 'ok', wsUrl });
  });

  return app;
}
