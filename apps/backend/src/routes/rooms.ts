/**
 * Rooms API Routes
 *
 * Handles friend room creation, joining, player management, and game starts
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { requireAuth } from '../middleware/requireAuth';
import { roomLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { wsManager } from '../websocket';

const router = express.Router();
const ROOM_EXPIRY_HOURS = 3;
const ROOM_INACTIVITY_MINUTES = 30;

/**
 * POST /rooms/create
 *
 * Create a new friend room
 */
router.post('/create', requireAuth, roomLimiter, async (req, res) => {
  try {
    const hostId = req.playerId!;
    const { name, mode } = req.body;

    if (!mode || ![1, 2].includes(mode)) {
      return res.status(400).json({ error: 'mode must be 1 or 2' });
    }

    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'name must be a string' });
    }

    const prisma = getPrismaClient();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ROOM_EXPIRY_HOURS);

    const room = await prisma.room.create({
      data: {
        hostId,
        name: name || null,
        mode,
        status: 'WAITING',
        expiresAt,
      },
      include: {
        host: {
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

    // Host automatically becomes first member
    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        playerId: hostId,
      },
    });

    // Emit creation event to host
    wsManager.emitRoomCreated(hostId, {
      roomId: room.id,
      host: room.host,
      name: room.name,
      mode: room.mode,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /rooms
 *
 * List active rooms where player is a member
 */
router.get('/', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            playerId,
          },
        },
        status: { in: ['WAITING', 'ACTIVE', 'BETWEEN_GAMES'] },
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        members: {
          select: {
            playerId: true,
            isReady: true,
          },
        },
      },
    });

    const roomsWithCount = rooms.map((room) => ({
      ...room,
      memberCount: room.members.length,
    }));

    res.json(roomsWithCount);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /rooms/available
 *
 * List joinable rooms created by friends
 */
router.get('/available', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const prisma = getPrismaClient();

    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: playerId, status: 'ACCEPTED' },
          { addresseeId: playerId, status: 'ACCEPTED' },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === playerId ? f.addresseeId : f.requesterId
    );

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const now = new Date();

    // Find rooms created by friends that are joinable
    const rooms = await prisma.room.findMany({
      where: {
        hostId: { in: friendIds },
        status: { in: ['WAITING', 'BETWEEN_GAMES'] },
        expiresAt: { gt: now },
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        members: {
          select: {
            playerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out rooms player is already in
    const availableRooms = rooms
      .filter((room) => !room.members.some((m) => m.playerId === playerId))
      .map((room) => ({
        ...room,
        memberCount: room.members.length,
      }));

    res.json(availableRooms);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /rooms/:roomId
 *
 * Get detailed room state
 */
router.get('/:roomId', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        },
        player1: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        player2: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                displayName: true,
                ratingMode1: true,
                ratingMode2: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Verify player is a member or friends with host
    const isMember = room.members.some((m) => m.playerId === playerId);

    if (!isMember) {
      // Check friendship
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: playerId, addresseeId: room.hostId, status: 'ACCEPTED' },
            { requesterId: room.hostId, addresseeId: playerId, status: 'ACCEPTED' },
          ],
        },
      });

      if (!friendship) {
        return res.status(403).json({ error: 'Not authorized to view this room' });
      }
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/join
 *
 * Join a room as a member
 */
router.post('/:roomId/join', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          select: { playerId: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status === 'CLOSED') {
      return res.status(409).json({ error: 'Room is closed' });
    }

    // Check if already a member
    if (room.members.some((m) => m.playerId === playerId)) {
      return res.status(409).json({ error: 'Already a member of this room' });
    }

    // Verify friendship with host
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: playerId, addresseeId: room.hostId, status: 'ACCEPTED' },
          { requesterId: room.hostId, addresseeId: playerId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return res.status(403).json({ error: 'Can only join rooms created by friends' });
    }

    // Add member
    await prisma.roomMember.create({
      data: {
        roomId,
        playerId,
      },
    });

    // Get player info for broadcast
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

    // Broadcast to all room members
    wsManager.emitRoomMemberJoined(roomId, {
      roomId,
      member: player,
      memberCount: room.members.length + 1,
    });

    res.json({ message: 'Joined room successfully', roomId });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/leave
 *
 * Leave a room
 */
router.post('/:roomId/leave', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          select: { playerId: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.members.some((m) => m.playerId === playerId)) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    // If host leaves, close the room
    if (room.hostId === playerId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'CLOSED' },
      });

      // Notify all members
      wsManager.emitRoomClosed(roomId, {
        roomId,
        reason: 'host_left',
      });

      // Remove all members
      await prisma.roomMember.deleteMany({
        where: { roomId },
      });

      return res.json({ message: 'Room closed (host left)' });
    }

    // Regular member leaving
    await prisma.roomMember.delete({
      where: {
        roomId_playerId: {
          roomId,
          playerId,
        },
      },
    });

    // Broadcast to remaining members
    wsManager.emitRoomMemberLeft(roomId, {
      roomId,
      memberId: playerId,
      memberCount: room.members.length - 1,
    });

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/close
 *
 * Close a room (host only)
 */
router.post('/:roomId/close', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'Only the host can close the room' });
    }

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'CLOSED' },
    });

    // Notify all members
    wsManager.emitRoomClosed(roomId, {
      roomId,
      reason: 'host_closed',
    });

    res.json({ message: 'Room closed successfully' });
  } catch (error) {
    console.error('Error closing room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/ready
 *
 * Toggle ready state for next game
 */
router.post('/:roomId/ready', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;
    const { isReady } = req.body;

    if (typeof isReady !== 'boolean') {
      return res.status(400).json({ error: 'isReady must be a boolean' });
    }

    const prisma = getPrismaClient();

    const member = await prisma.roomMember.findUnique({
      where: {
        roomId_playerId: {
          roomId,
          playerId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    await prisma.roomMember.update({
      where: {
        roomId_playerId: {
          roomId,
          playerId,
        },
      },
      data: { isReady },
    });

    // Count ready members
    const readyCount = await prisma.roomMember.count({
      where: {
        roomId,
        isReady: true,
      },
    });

    // Broadcast to all members
    wsManager.emitRoomReadyStateChanged(roomId, {
      roomId,
      playerId,
      isReady,
      readyCount,
    });

    res.json({ message: 'Ready state updated', isReady, readyCount });
  } catch (error) {
    console.error('Error updating ready state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/assign-players
 *
 * Assign which two players play next (host only)
 */
router.post('/:roomId/assign-players', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;
    const { player1Id, player2Id } = req.body;

    if (!player1Id || !player2Id) {
      return res.status(400).json({ error: 'player1Id and player2Id are required' });
    }

    if (player1Id === player2Id) {
      return res.status(400).json({ error: 'Cannot assign same player twice' });
    }

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          select: { playerId: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'Only the host can assign players' });
    }

    if (room.status === 'ACTIVE') {
      return res.status(409).json({ error: 'Cannot assign players during active game' });
    }

    // Verify both players are members
    const memberIds = room.members.map((m) => m.playerId);
    if (!memberIds.includes(player1Id) || !memberIds.includes(player2Id)) {
      return res.status(400).json({ error: 'Both players must be room members' });
    }

    // Update room
    await prisma.room.update({
      where: { id: roomId },
      data: {
        player1Id,
        player2Id,
      },
    });

    // Get player info
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({
        where: { id: player1Id },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
        },
      }),
      prisma.player.findUnique({
        where: { id: player2Id },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
        },
      }),
    ]);

    // Broadcast to all members
    wsManager.emitRoomPlayersAssigned(roomId, {
      roomId,
      player1,
      player2,
    });

    res.json({ message: 'Players assigned', player1, player2 });
  } catch (error) {
    console.error('Error assigning players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /rooms/:roomId/start-game
 *
 * Start the next game (host only)
 */
router.post('/:roomId/start-game', requireAuth, defaultLimiter, async (req, res) => {
  try {
    const playerId = req.playerId!;
    const { roomId } = req.params;

    const prisma = getPrismaClient();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        player1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            ratingMode1: true,
            ratingMode2: true,
          },
        },
        player2: {
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

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== playerId) {
      return res.status(403).json({ error: 'Only the host can start games' });
    }

    if (room.status === 'ACTIVE') {
      return res.status(409).json({ error: 'Game already in progress' });
    }

    if (!room.player1Id || !room.player2Id) {
      return res.status(400).json({ error: 'Must assign two players before starting' });
    }

    // Create match via WebSocket manager (placeholder - actual implementation in Task 3)
    const matchId = `match_room_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Update room status and set currentMatchId
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'ACTIVE',
        currentMatchId: matchId,
        lastActivityAt: new Date(),
      },
    });

    // Reset all ready states
    await prisma.roomMember.updateMany({
      where: { roomId },
      data: { isReady: false },
    });

    // Broadcast game starting
    wsManager.emitRoomGameStarting(roomId, {
      roomId,
      matchId,
      player1: room.player1,
      player2: room.player2,
    });

    res.json({ message: 'Game started', matchId, roomId });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
