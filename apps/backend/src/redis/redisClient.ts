import Redis from 'ioredis';

let cachedRedisClient: Redis | null = null;

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl && process.env.NODE_ENV === 'production') {
    throw new Error('REDIS_URL is required in production');
  }

  const client = redisUrl
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        connectTimeout: 10000,
        retryStrategy: (times: number) => Math.min(times * 100, 2000),
      })
    : new Redis({
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        connectTimeout: 10000,
        retryStrategy: (times: number) => Math.min(times * 100, 2000),
      });

  client.on('connect', () => {
    console.log('Redis connected');
  });

  client.on('reconnecting', () => {
    console.log('Redis reconnecting');
  });

  client.on('end', () => {
    console.warn('Redis connection ended');
  });

  client.on('error', (error: unknown) => {
    console.error('Redis error (check REDIS_URL and network):', error);
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!cachedRedisClient) {
    cachedRedisClient = createRedisClient();
  }

  return cachedRedisClient;
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    // Check if client is in a ready state
    if (client.status === 'ready') {
      return true;
    }
    // Try a simple ping to verify connection
    await client.ping();
    return true;
  } catch (error) {
    return false;
  }
}

export const redisClient = getRedisClient();
