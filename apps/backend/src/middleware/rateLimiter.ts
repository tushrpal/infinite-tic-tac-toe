/**
 * Rate limiting middleware for social features
 *
 * Uses rate-limiter-flexible with Redis backend for distributed rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedisClient, isRedisAvailable } from '../storage/redisClient';

// Rate limit configurations (points per duration)
export const RATE_LIMITS = {
  FRIEND_REQUEST: { points: 10, duration: 3600 }, // 10 requests per hour
  CHALLENGE: { points: 20, duration: 3600 }, // 20 requests per hour
  PRIVATE_MATCH: { points: 30, duration: 3600 }, // 30 requests per hour
  DEFAULT: { points: 60, duration: 60 }, // 60 requests per minute for other endpoints
};

// Cache of rate limiter instances
const limiters = new Map<string, RateLimiterRedis>();

/**
 * Get or create a rate limiter instance for a given key
 */
function getRateLimiter(
  keyPrefix: string,
  points: number,
  duration: number
): RateLimiterRedis {
  const cacheKey = `${keyPrefix}-${points}-${duration}`;

  if (limiters.has(cacheKey)) {
    return limiters.get(cacheKey)!;
  }

  const limiter = new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix,
    points,
    duration,
    blockDuration: 0, // Don't block, just return 429
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * Create rate limiting middleware with custom configuration
 *
 * @param keyPrefix - Prefix for Redis keys (e.g., 'rl:friend_request')
 * @param points - Number of requests allowed
 * @param duration - Time window in seconds
 * @param keyGenerator - Optional function to generate rate limit key from request
 */
export function createRateLimiter(
  keyPrefix: string,
  points: number,
  duration: number,
  keyGenerator?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip rate limiting if Redis is not available (development fallback)
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      console.warn(`Rate limiter skipped (Redis unavailable): ${keyPrefix}`);
      next();
      return;
    }

    try {
      // Generate rate limit key (default: use playerId from auth middleware)
      const key = keyGenerator ? keyGenerator(req) : req.playerId || req.ip || 'anonymous';

      const limiter = getRateLimiter(keyPrefix, points, duration);
      const rateLimiterRes = await limiter.consume(key, 1);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
      );

      next();
    } catch (error) {
      // Rate limiter throws RateLimiterRes when limit exceeded
      if (error && typeof error === 'object' && 'msBeforeNext' in error) {
        const rateLimiterRes = error as unknown as RateLimiterRes;
        const retryAfterSeconds = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

        res.setHeader('X-RateLimit-Limit', points);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('Retry-After', retryAfterSeconds);
        res.setHeader(
          'X-RateLimit-Reset',
          new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
        );

        res.status(429).json({
          error: 'Too many requests',
          retryAfter: retryAfterSeconds,
          message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
        });
        return;
      }

      // Unexpected error - log and allow request through (fail open)
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

// Pre-configured rate limiters for social features
export const friendRequestLimiter = createRateLimiter(
  'rl:friend_request',
  RATE_LIMITS.FRIEND_REQUEST.points,
  RATE_LIMITS.FRIEND_REQUEST.duration
);

export const challengeLimiter = createRateLimiter(
  'rl:challenge',
  RATE_LIMITS.CHALLENGE.points,
  RATE_LIMITS.CHALLENGE.duration
);

export const privateMatchLimiter = createRateLimiter(
  'rl:private_match',
  RATE_LIMITS.PRIVATE_MATCH.points,
  RATE_LIMITS.PRIVATE_MATCH.duration
);

export const defaultLimiter = createRateLimiter(
  'rl:default',
  RATE_LIMITS.DEFAULT.points,
  RATE_LIMITS.DEFAULT.duration
);
