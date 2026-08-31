import 'dotenv/config';
import { createServer } from './server';
import { createServer as createHttpServer } from 'http';
import { wsManager } from './websocket';
import { getPrismaClient } from './storage/prismaClient';
import { getRedisClient } from './redis/redisClient';
import { startChallengeExpiryJob, stopChallengeExpiryJob } from './jobs/challengeExpiry';
import { startPrivateMatchExpiryJob, stopPrivateMatchExpiryJob } from './jobs/privateMatchExpiry';
import { startRoomExpiryJob, stopRoomExpiryJob } from './jobs/roomExpiry';

const DEFAULT_PORT = 3000;

function resolvePort(value: string | undefined): number {
  const parsed = Number(value ?? DEFAULT_PORT);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return Math.floor(parsed);
}

const PORT = resolvePort(process.env.PORT);
const WS_URL = process.env.WS_URL?.trim() || `ws://localhost:${PORT}`;

const app = createServer();

// Create HTTP server and attach WebSocket server
const httpServer = createHttpServer(app);
wsManager.initialize(httpServer);

async function bootstrapDependencies(): Promise<void> {
  const prisma = getPrismaClient();
  const redis = getRedisClient();

  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL (check DATABASE_URL):', error);
    throw error;
  }

  try {
    await redis.ping();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis error (check REDIS_URL and network):', error);
    console.warn('⚠️  Continuing without Redis - rate limiting and match recovery will be disabled');
    // Don't throw - Redis is optional for basic functionality
  }
}

void bootstrapDependencies()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      console.log(`WebSocket endpoint: ${WS_URL}`);

      // Start background jobs
      startChallengeExpiryJob();
      startPrivateMatchExpiryJob();
      startRoomExpiryJob();
    });
  })
  .catch(() => {
    process.exit(1);
  });

httpServer.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  const prisma = getPrismaClient();
  const redis = getRedisClient();

  // Stop background jobs
  stopChallengeExpiryJob();
  stopPrivateMatchExpiryJob();
  stopRoomExpiryJob();

  httpServer.close(async () => {
    try {
      await prisma.$disconnect();
      try {
        await redis.quit();
      } catch (redisError) {
        console.warn('Redis quit failed (may already be disconnected):', redisError);
      }
      console.log('HTTP server shut down');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});
