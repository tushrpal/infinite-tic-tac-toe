/**
 * Friends API Routes
 *
 * Handles friend requests, friendships, and blocking
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { friendRequestLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { wsManager } from '../websocket';

const router = express.Router();
const FRIEND_LIMIT = 200;

/**
 * POST /friends/request
 *
 * Send a friend request to another player
 *
 * Request body:
 * {
 *   addresseeId: string
 * }
 *
 * Returns: Created friendship record
 */
router.post('/request', requireAuth, friendRequestLimiter, async (req, res) => {
  try {
    const requesterId = req.playerId!;
    const { addresseeId } = req.body;

    // Validate input
    if (!addresseeId || typeof addresseeId !== 'string') {
      return res.status(400).json({ error: 'addresseeId is required' });
    }

    // Cannot friend yourself
    if (addresseeId === requesterId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const prisma = getPrismaClient();

    // Check if addressee exists
    const addressee = await prisma.player.findUnique({
      where: { id: addresseeId },
      select: { id: true, username: true, isAnonymous: true },
    });

    if (!addressee) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check for existing friendship (any status, either direction)
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return res.status(409).json({ error: 'Already friends with this player' });
      }
      if (existingFriendship.status === 'PENDING') {
        return res.status(409).json({ error: 'Friend request already pending' });
      }
      if (existingFriendship.status === 'BLOCKED') {
        return res.status(403).json({ error: 'Cannot send friend request to this player' });
      }
    }

    // Check friend limit for requester
    const requesterFriendCount = await prisma.friendship.count({
      where: {
        OR: [
          { requesterId, status: 'ACCEPTED' },
          { addresseeId: requesterId, status: 'ACCEPTED' },
        ],
      },
    });

    if (requesterFriendCount >= FRIEND_LIMIT) {
      return res.status(400).json({
        error: `Friend limit reached (${FRIEND_LIMIT} friends maximum)`,
      });
    }

    // Check friend limit for addressee
    const addresseeFriendCount = await prisma.friendship.count({
      where: {
        OR: [
          { requesterId: addresseeId, status: 'ACCEPTED' },
          { addresseeId, status: 'ACCEPTED' },
        ],
      },
    });

    if (addresseeFriendCount >= FRIEND_LIMIT) {
      return res.status(400).json({
        error: 'Target player has reached friend limit',
      });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, username: true, displayName: true, ratingMode1: true },
        },
        addressee: {
          select: { id: true, username: true, displayName: true, ratingMode1: true },
        },
      },
    });

    // Emit real-time event to addressee
    wsManager.emitFriendRequestReceived(addresseeId, {
      friendshipId: friendship.id,
      requesterId: friendship.requester.id,
      requesterUsername: friendship.requester.username,
      requesterDisplayName: friendship.requester.displayName,
      requesterRating: friendship.requester.ratingMode1,
      addresseeId: friendship.addressee.id,
      addresseeUsername: friendship.addressee.username,
      addresseeDisplayName: friendship.addressee.displayName,
      addresseeRating: friendship.addressee.ratingMode1,
      status: 'PENDING',
      createdAt: friendship.createdAt.toISOString(),
    });

    res.status(201).json(friendship);
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /friends/search
 *
 * Search for players by username (min 2 chars), excluding self and blocked players
 *
 * Query params: q=string
 *
 * Returns: Array of PlayerSearchResult
 */
router.get('/search', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (q.length < 2) {
      return res.json([]);
    }

    const prisma = getPrismaClient();

    const [players, relationships] = await Promise.all([
      prisma.player.findMany({
        where: {
          username: { contains: q, mode: 'insensitive' },
          id: { not: playerId },
        },
        select: { id: true, username: true, displayName: true, ratingMode1: true },
        take: 20,
      }),
      prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: playerId }, { addresseeId: playerId }],
        },
        select: { requesterId: true, addresseeId: true, status: true },
      }),
    ]);

    const relByOther = new Map<string, { status: string; direction: 'out' | 'in' }>();
    for (const r of relationships) {
      const otherId = r.requesterId === playerId ? r.addresseeId : r.requesterId;
      relByOther.set(otherId, {
        status: r.status,
        direction: r.requesterId === playerId ? 'out' : 'in',
      });
    }

    const results = players
      .filter((p) => relByOther.get(p.id)?.status !== 'BLOCKED')
      .map((p) => {
        const rel = relByOther.get(p.id);
        let relationshipStatus: 'none' | 'friend' | 'pending_sent' | 'pending_received' = 'none';
        if (rel?.status === 'ACCEPTED') {
          relationshipStatus = 'friend';
        } else if (rel?.status === 'PENDING') {
          relationshipStatus = rel.direction === 'out' ? 'pending_sent' : 'pending_received';
        }

        return {
          playerId: p.id,
          username: p.username,
          displayName: p.displayName ?? undefined,
          rating: p.ratingMode1,
          relationshipStatus,
        };
      });

    res.json(results);
  } catch (error) {
    console.error('Error searching players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /friends
 *
 * Get current player's friends list (status=ACCEPTED only)
 *
 * Returns: Array of friends with online status
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: playerId, status: 'ACCEPTED' },
          { addresseeId: playerId, status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
            lastLoginAt: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to friend objects (the other player in each friendship)
    const friends = friendships.map((f) => {
      const friend = f.requesterId === playerId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        friend,
        since: f.respondedAt || f.createdAt,
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /friends/requests
 *
 * Get pending friend requests (incoming and outgoing)
 *
 * Returns: { incoming: [], outgoing: [] }
 */
router.get('/requests', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    const [incoming, outgoing] = await Promise.all([
      // Incoming requests (others sent to me)
      prisma.friendship.findMany({
        where: {
          addresseeId: playerId,
          status: 'PENDING',
        },
        include: {
          requester: {
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
      // Outgoing requests (I sent to others)
      prisma.friendship.findMany({
        where: {
          requesterId: playerId,
          status: 'PENDING',
        },
        include: {
          addressee: {
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

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /friends/respond
 *
 * Accept or decline a friend request
 *
 * Request body:
 * {
 *   friendshipId: string,
 *   action: 'ACCEPT' | 'DECLINE'
 * }
 *
 * Returns: Updated friendship record (if accepted) or success message (if declined)
 */
router.post('/respond', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { friendshipId, action } = req.body;

    // Validate input
    if (!friendshipId || typeof friendshipId !== 'string') {
      return res.status(400).json({ error: 'friendshipId is required' });
    }

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'action must be ACCEPT or DECLINE' });
    }

    const prisma = getPrismaClient();

    // Find friendship and verify it's addressed to current player
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.addresseeId !== playerId) {
      return res.status(403).json({ error: 'You can only respond to requests sent to you' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request has already been responded to' });
    }

    if (action === 'ACCEPT') {
      // Accept the request
      const updatedFriendship = await prisma.friendship.update({
        where: { id: friendshipId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
        include: {
          requester: {
            select: { id: true, username: true, displayName: true, ratingMode1: true },
          },
          addressee: {
            select: { id: true, username: true, displayName: true, ratingMode1: true },
          },
        },
      });

      // Emit real-time event to requester
      wsManager.emitFriendRequestAccepted(friendship.requesterId, {
        friendshipId: updatedFriendship.id,
        friendId: updatedFriendship.addressee.id,
        friendUsername: updatedFriendship.addressee.username,
        friendDisplayName: updatedFriendship.addressee.displayName,
        friendRating: updatedFriendship.addressee.ratingMode1,
        isOnline: false, // Will be updated by online status tracking
      });

      res.json(updatedFriendship);
    } else {
      // Decline and delete the request
      await prisma.friendship.delete({
        where: { id: friendshipId },
      });

      // Emit real-time event to requester
      wsManager.emitFriendRequestDeclined(friendship.requesterId, friendshipId);

      res.json({ message: 'Friend request declined' });
    }
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /friends/:friendshipId
 *
 * Remove a friend or cancel a pending request
 *
 * Can be called by either party in the friendship
 */
router.delete('/:friendshipId', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { friendshipId } = req.params;

    const prisma = getPrismaClient();

    // Find friendship and verify player is involved
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Verify player is either requester or addressee
    if (friendship.requesterId !== playerId && friendship.addresseeId !== playerId) {
      return res.status(403).json({ error: 'You are not part of this friendship' });
    }

    // Determine the other player
    const otherPlayerId = friendship.requesterId === playerId
      ? friendship.addresseeId
      : friendship.requesterId;

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    // Emit real-time event to the other player
    wsManager.emitFriendRemoved(otherPlayerId, friendshipId);

    res.json({ message: 'Friendship removed successfully' });
  } catch (error) {
    console.error('Error removing friendship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /friends/block
 *
 * Block a player (prevents friend requests and challenges)
 *
 * Request body:
 * {
 *   blockedId: string
 * }
 *
 * Creates or updates friendship record with BLOCKED status
 * Also deletes any existing friendships or pending requests
 */
router.post('/block', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const blockerId = req.playerId!;
    const { blockedId } = req.body;

    // Validate input
    if (!blockedId || typeof blockedId !== 'string') {
      return res.status(400).json({ error: 'blockedId is required' });
    }

    // Cannot block yourself
    if (blockedId === blockerId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const prisma = getPrismaClient();

    // Check if blocked player exists
    const blockedPlayer = await prisma.player.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });

    if (!blockedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Delete any existing friendships (either direction)
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: blockerId },
        ],
      },
    });

    // Create block record
    const blockRecord = await prisma.friendship.create({
      data: {
        requesterId: blockerId,
        addresseeId: blockedId,
        status: 'BLOCKED',
      },
    });

    res.json({ message: 'Player blocked successfully', blockRecord });
  } catch (error) {
    console.error('Error blocking player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
