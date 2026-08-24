/**
 * Authentication middleware for protected routes
 *
 * Validates Bearer token from Authorization header and attaches playerId to request
 */

import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../auth/authUtils';

// Extend Express Request type to include playerId
declare global {
  namespace Express {
    interface Request {
      playerId?: string;
    }
  }
}

/**
 * Middleware to require authentication for a route
 *
 * Extracts Bearer token from Authorization header, validates it,
 * and attaches playerId to request object.
 *
 * Returns 401 if:
 * - No Authorization header
 * - Invalid token format
 * - Token is invalid or expired
 *
 * Usage:
 *   router.get('/friends', requireAuth, async (req, res) => {
 *     const playerId = req.playerId; // Guaranteed to exist
 *   });
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    // Parse Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization format. Expected: Bearer <token>' });
      return;
    }

    const token = parts[1];

    // Validate session
    const playerId = await validateSession(token);

    if (!playerId) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }

    // Attach playerId to request for downstream handlers
    req.playerId = playerId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
