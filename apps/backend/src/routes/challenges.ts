/**
 * Challenges API Routes
 *
 * Handles challenge creation, acceptance, and management between friends
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { challengeLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { wsManager } from '../websocket';

const router = express.Router();
const CHALLENGE_EXPIRY_MINUTES = 5;
const MAX_PENDING_CHALLENGES = 3;

/**
 * POST /challenges/create
 *
 * Challenge a friend to a match
 *
 * Request body:
 * {
 *   challengedId: string,
 *   mode: 1 | 2
 * }
 *
 * Returns: Created challenge record
 */
router.post('/create', requireAuth, challengeLimiter, async (req, res) => {
  try {
    const challengerId = req.playerId!;
    const { challengedId, mode } = req.body;

    // Validate input
    if (!challengedId || typeof challengedId !== 'string') {
      return res.status(400).json({ error: 'challengedId is required' });
    }

    if (!mode || ![1, 2].includes(mode)) {
      return res.status(400).json({ error: 'mode must be 1 or 2' });
    }

    // Cannot challenge yourself
    if (challengedId === challengerId) {
      return res.status(400).json({ error: 'Cannot challenge yourself' });
    }

    const prisma = getPrismaClient();

    // Check if challenged player exists
    const challengedPlayer = await prisma.player.findUnique({
      where: { id: challengedId },
      select: { id: true, username: true, displayName: true },
    });

    if (!challengedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Verify friendship exists (status=ACCEPTED)
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: challengerId, addresseeId: challengedId, status: 'ACCEPTED' },
          { requesterId: challengedId, addresseeId: challengerId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return res.status(403).json({ error: 'Can only challenge players who are your friends' });
    }

    // Check for existing pending challenge to this player
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        challengerId,
        challengedId,
        status: 'PENDING',
      },
    });

    if (existingChallenge) {
      return res.status(409).json({ error: 'You already have a pending challenge to this player' });
    }

    // Check challenger's pending challenge limit
    const pendingCount = await prisma.challenge.count({
      where: {
        challengerId,
        status: 'PENDING',
      },
    });

    if (pendingCount >= MAX_PENDING_CHALLENGES) {
      return res.status(400).json({
        error: `Maximum ${MAX_PENDING_CHALLENGES} pending challenges allowed`,
      });
    }

    // Create challenge with expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CHALLENGE_EXPIRY_MINUTES);

    const challenge = await prisma.challenge.create({
      data: {
        challengerId,
        challengedId,
        mode,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        challenger: {
          select: { id: true, username: true, displayName: true, ratingMode1: true, ratingMode2: true },
        },
        challenged: {
          select: { id: true, username: true, displayName: true, ratingMode1: true, ratingMode2: true },
        },
      },
    });

    // Emit real-time event to challenged player
    wsManager.emitChallengeReceived(challengedId, {
      challengeId: challenge.id,
      challengerId: challenge.challenger.id,
      challengerUsername: challenge.challenger.username,
      challengerDisplayName: challenge.challenger.displayName,
      challengerRating: mode === 1 ? challenge.challenger.ratingMode1 : challenge.challenger.ratingMode2,
      challengedId: challenge.challenged.id,
      challengedUsername: challenge.challenged.username,
      challengedDisplayName: challenge.challenged.displayName,
      challengedRating: mode === 1 ? challenge.challenged.ratingMode1 : challenge.challenged.ratingMode2,
      mode: `mode${mode}` as 'mode1' | 'mode2',
      status: 'PENDING',
      expiresAt: challenge.expiresAt.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /challenges
 *
 * Get active challenges (sent and received, status=PENDING)
 *
 * Returns: { sent: [], received: [] }
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    const now = new Date();

    const [sent, received] = await Promise.all([
      // Challenges sent by current player
      prisma.challenge.findMany({
        where: {
          challengerId: playerId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
        include: {
          challenged: {
            select: {
              id: true,
              username: true,
              displayName: true,
              ratingMode1: true,
              ratingMode2: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Challenges received by current player
      prisma.challenge.findMany({
        where: {
          challengedId: playerId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
        include: {
          challenger: {
            select: {
              id: true,
              username: true,
              displayName: true,
              ratingMode1: true,
              ratingMode2: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ sent, received });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /challenges/respond
 *
 * Accept or decline a challenge
 *
 * Request body:
 * {
 *   challengeId: string,
 *   action: 'ACCEPT' | 'DECLINE'
 * }
 *
 * Returns: Challenge record with matchId (if accepted) or success message (if declined)
 */
router.post('/respond', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { challengeId, action } = req.body;

    // Validate input
    if (!challengeId || typeof challengeId !== 'string') {
      return res.status(400).json({ error: 'challengeId is required' });
    }

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'action must be ACCEPT or DECLINE' });
    }

    const prisma = getPrismaClient();

    // Find challenge and verify it's addressed to current player
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: {
          select: { id: true, username: true },
        },
        challenged: {
          select: { id: true, username: true },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.challengedId !== playerId) {
      return res.status(403).json({ error: 'You can only respond to challenges sent to you' });
    }

    if (challenge.status !== 'PENDING') {
      return res.status(400).json({ error: 'This challenge has already been responded to' });
    }

    // Check if expired
    if (challenge.expiresAt < new Date()) {
      await prisma.challenge.update({
        where: { id: challengeId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'This challenge has expired' });
    }

    if (action === 'ACCEPT') {
      // Accept challenge - match creation will be handled by WebSocket
      // For now, just mark as accepted and return the challenge
      // The WebSocket handler will create the actual match
      const updatedChallenge = await prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: 'ACCEPTED',
        },
        include: {
          challenger: {
            select: { id: true, username: true, displayName: true },
          },
          challenged: {
            select: { id: true, username: true, displayName: true },
          },
        },
      });

      // Emit real-time event to challenger
      // Note: matchId will be set when WebSocket creates the actual match
      wsManager.emitChallengeAccepted(
        challenge.challengerId,
        challengeId,
        '' // matchId not yet available
      );

      res.json(updatedChallenge);
    } else {
      // Decline challenge
      await prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: 'DECLINED',
        },
      });

      // Emit real-time event to challenger
      wsManager.emitChallengeDeclined(
        challenge.challengerId,
        challengeId
      );

      res.json({ message: 'Challenge declined' });
    }
  } catch (error) {
    console.error('Error responding to challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /challenges/:challengeId
 *
 * Cancel a pending challenge (challenger only)
 */
router.delete('/:challengeId', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { challengeId } = req.params;

    const prisma = getPrismaClient();

    // Find challenge and verify player is the challenger
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: {
          select: { id: true, username: true },
        },
        challenged: {
          select: { id: true, username: true },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.challengerId !== playerId) {
      return res.status(403).json({ error: 'Only the challenger can cancel a challenge' });
    }

    if (challenge.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending challenges' });
    }

    // Cancel the challenge
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Emit real-time event to challenged player
    wsManager.emitChallengeCancelled(
      challenge.challengedId,
      challengeId
    );

    res.json({ message: 'Challenge cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
