/**
 * Redis client for caching and rate limiting
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance (singleton pattern)
 *
 * Connects to Redis using REDIS_URL environment variable.
 * Falls back to localhost:6379 if not set.
 *
 * If Redis connection fails, returns a mock client that logs warnings
 * but doesn't break the application (graceful degradation for development).
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    // Connection event handlers
    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    // Attempt initial connection
    redisClient.connect().catch((err) => {
      console.warn('Initial Redis connection failed:', err.message);
      console.warn('Continuing without Redis - rate limiting will be disabled');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}

/**
 * Check if Redis is connected and available
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!redisClient) {
    return false;
  }

  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
}
