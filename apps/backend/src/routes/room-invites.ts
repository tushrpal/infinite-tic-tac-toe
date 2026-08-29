/**
 * Room Invites API Routes
 *
 * Handles sending, accepting, and declining room invitations
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { defaultLimiter } from '../middleware/rateLimiter';
import { wsManager } from '../websocket';

const router = express.Router();
const INVITE_EXPIRY_HOURS = 24;

/**
 * POST /rooms/:roomId/invite
 *
 * Invite friend(s) to a room
 */
router.post('/:roomId/invite', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const inviterId = req.playerId!;
    const { roomId } = req.params;
    const { inviteeIds } = req.body;

    if (!Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return res.status(400).json({ error: 'inviteeIds must be a non-empty array' });
    }

    if (inviteeIds.length > 10) {
      return res.status(400).json({ error: 'Cannot invite more than 10 players at once' });
    }

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        hostId: true,
        name: true,
        status: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status === 'CLOSED') {
      return res.status(409).json({ error: 'Cannot invite to closed room' });
    }

    // Verify all invitees are friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: inviteeIds.flatMap((inviteeId) => [
          { requesterId: inviterId, addresseeId: inviteeId, status: 'ACCEPTED' },
          { requesterId: inviteeId, addresseeId: inviterId, status: 'ACCEPTED' },
        ]),
      },
      select: { requesterId: true, addresseeId: true },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === inviterId ? f.addresseeId : f.requesterId
    );

    const invalidInvitees = inviteeIds.filter((id) => !friendIds.includes(id));
    if (invalidInvitees.length > 0) {
      return res.status(403).json({
        error: 'Can only invite friends',
        invalidIds: invalidInvitees,
      });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    // Create invites (skip duplicates)
    const invites = [];
    for (const inviteeId of inviteeIds) {
      try {
        const invite = await prisma.roomInvite.create({
          data: {
            roomId,
            inviterId,
            inviteeId,
            status: 'PENDING',
            expiresAt,
          },
          include: {
            inviter: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

        invites.push(invite);

        // Send WebSocket notification to invitee
        wsManager.emitRoomInviteReceived(inviteeId, {
          inviteId: invite.id,
          roomId,
          roomName: room.name,
          inviter: invite.inviter,
          expiresAt: invite.expiresAt.toISOString(),
        });
      } catch (error: any) {
        // Duplicate invite - skip
        if (error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    res.status(201).json({ invites, sent: invites.length });
  } catch (error) {
    console.error('Error creating room invites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /room-invites
 *
 * Get pending room invites for current player
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    const now = new Date();

    const received = await prisma.roomInvite.findMany({
      where: {
        inviteeId: playerId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            mode: true,
            status: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ received });
  } catch (error) {
    console.error('Error fetching room invites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /room-invites/:inviteId/respond
 *
 * Accept or decline a room invite
 */
router.post('/:inviteId/respond', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { inviteId } = req.params;
    const { action } = req.body;

    if (!action || !['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'action must be ACCEPT or DECLINE' });
    }

    const prisma = getPrismaClient();

    const invite = await prisma.roomInvite.findUnique({
      where: { id: inviteId },
      include: {
        room: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.inviteeId !== playerId) {
      return res.status(403).json({ error: 'Can only respond to invites sent to you' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invite has already been responded to' });
    }

    if (invite.expiresAt < new Date()) {
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invite has expired' });
    }

    if (invite.room.status === 'CLOSED') {
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Room is closed' });
    }

    if (action === 'ACCEPT') {
      // Accept and auto-join room
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      });

      // Add as room member
      try {
        await prisma.roomMember.create({
          data: {
            roomId: invite.roomId,
            playerId,
          },
        });
      } catch (error: any) {
        // Already a member - that's fine
        if (error.code !== 'P2002') {
          throw error;
        }
      }

      // Get player info
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
        },
      });

      // Get member count
      const memberCount = await prisma.roomMember.count({
        where: { roomId: invite.roomId },
      });

      // Notify inviter
      wsManager.emitRoomInviteAccepted(invite.inviterId, {
        inviteId,
        roomId: invite.roomId,
        invitee: player,
      });

      // Notify all room members of new member
      wsManager.emitRoomMemberJoined(invite.roomId, {
        roomId: invite.roomId,
        member: player,
        memberCount,
      });

      res.json({ message: 'Invite accepted and joined room', roomId: invite.roomId });
    } else {
      // Decline
      await prisma.roomInvite.update({
        where: { id: inviteId },
        data: { status: 'DECLINED' },
      });

      // Notify inviter
      wsManager.emitRoomInviteDeclined(invite.inviterId, {
        inviteId,
        roomId: invite.roomId,
        inviteeId: playerId,
      });

      res.json({ message: 'Invite declined' });
    }
  } catch (error) {
    console.error('Error responding to room invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
