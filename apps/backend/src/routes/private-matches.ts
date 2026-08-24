/**
 * Private Matches API Routes
 *
 * Handles creation and joining of private matches with shareable codes
 */

import express from 'express';
import crypto from 'crypto';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { privateMatchLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { wsManager } from '../websocket/index';

const router = express.Router();
const PRIVATE_MATCH_EXPIRY_MINUTES = 15;
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

// Base62 alphabet (no ambiguous characters)
const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a unique 6-character alphanumeric code for private match
 *
 * Uses crypto.randomBytes for cryptographic randomness
 * Returns base62-encoded string (no ambiguous characters like 0/O, 1/l)
 */
function generatePrivateMatchCode(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0);

  let code = '';
  let remaining = num;

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += BASE62[remaining % 62];
    remaining = Math.floor(remaining / 62);
  }

  return code.toUpperCase();
}

/**
 * POST /private-matches/create
 *
 * Create a private match with shareable link
 *
 * Request body:
 * {
 *   mode: 1 | 2
 * }
 *
 * Returns: { code, url, expiresAt }
 */
router.post('/create', requireAuth, privateMatchLimiter, async (req, res) => {
  try {
    const creatorId = req.playerId!;
    const { mode } = req.body;

    // Validate input
    if (!mode || ![1, 2].includes(mode)) {
      return res.status(400).json({ error: 'mode must be 1 or 2' });
    }

    const prisma = getPrismaClient();

    // Generate unique code with retry on collision
    let code: string | null = null;
    let attempts = 0;

    while (!code && attempts < MAX_RETRIES) {
      const candidate = generatePrivateMatchCode();

      try {
        // Check if code already exists
        const existing = await prisma.privateMatch.findUnique({
          where: { id: candidate },
        });

        if (!existing) {
          code = candidate;
          break;
        }

        attempts++;
      } catch (error) {
        attempts++;
      }
    }

    if (!code) {
      return res.status(500).json({
        error: 'Failed to generate unique match code. Please try again.',
      });
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PRIVATE_MATCH_EXPIRY_MINUTES);

    // Create private match record
    const privateMatch = await prisma.privateMatch.create({
      data: {
        id: code,
        creatorId,
        mode,
        status: 'WAITING',
        expiresAt,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        },
      },
    });

    res.status(201).json({
      code: privateMatch.id,
      url: `/join/${privateMatch.id}`,
      expiresAt: privateMatch.expiresAt,
      mode: privateMatch.mode,
      creator: privateMatch.creator,
    });
  } catch (error) {
    console.error('Error creating private match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /private-matches/join/:code
 *
 * Join a private match using the 6-character code
 *
 * Returns: Match details or error if expired/invalid
 */
router.post('/join/:code', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { code } = req.params;

    // Validate code format
    if (!code || code.length !== CODE_LENGTH) {
      return res.status(400).json({ error: 'Invalid match code format' });
    }

    const prisma = getPrismaClient();

    // Find private match
    const privateMatch = await prisma.privateMatch.findUnique({
      where: { id: code.toUpperCase() },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        },
      },
    });

    if (!privateMatch) {
      return res.status(404).json({ error: 'Match code not found' });
    }

    // Cannot join your own match
    if (privateMatch.creatorId === playerId) {
      return res.status(400).json({ error: 'Cannot join your own private match' });
    }

    // Check if expired
    if (privateMatch.expiresAt < new Date()) {
      await prisma.privateMatch.update({
        where: { id: code.toUpperCase() },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'This match link has expired' });
    }

    // Check status
    if (privateMatch.status === 'EXPIRED') {
      return res.status(400).json({ error: 'This match link has expired' });
    }

    if (privateMatch.status === 'ACTIVE') {
      // Match already started - can join as spectator
      return res.json({
        message: 'Match already in progress',
        matchId: privateMatch.matchId,
        canSpectate: true,
      });
    }

    // Join as opponent - match creation will be handled by WebSocket
    // Update status to ACTIVE
    const updatedMatch = await prisma.privateMatch.update({
      where: { id: code.toUpperCase() },
      data: { status: 'ACTIVE' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Emit real-time event to creator
    wsManager.emitPrivateMatchJoined(updatedMatch.creatorId, updatedMatch.id);

    res.json({
      privateMatch: updatedMatch,
      message: 'Joined private match successfully',
    });
  } catch (error) {
    console.error('Error joining private match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /private-matches/:code
 *
 * Get private match details (for validation before joining)
 *
 * Returns: Match details without sensitive information
 */
router.get('/:code', defaultLimiter, async (req, res) => {
  try {
    const { code } = req.params;

    // Validate code format
    if (!code || code.length !== CODE_LENGTH) {
      return res.status(400).json({ error: 'Invalid match code format' });
    }

    const prisma = getPrismaClient();

    // Find private match
    const privateMatch = await prisma.privateMatch.findUnique({
      where: { id: code.toUpperCase() },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        },
      },
    });

    if (!privateMatch) {
      return res.status(404).json({ error: 'Match code not found' });
    }

    // Check if expired
    const isExpired = privateMatch.expiresAt < new Date() || privateMatch.status === 'EXPIRED';

    res.json({
      code: privateMatch.id,
      mode: privateMatch.mode,
      status: isExpired ? 'EXPIRED' : privateMatch.status,
      creator: privateMatch.creator,
      expiresAt: privateMatch.expiresAt,
      matchId: privateMatch.matchId,
      isExpired,
    });
  } catch (error) {
    console.error('Error fetching private match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
