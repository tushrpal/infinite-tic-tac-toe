/**
 * Room API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../../server';
import { getPrismaClient } from '../../storage/prismaClient';
import { createSession } from '../../auth/authUtils';

describe('Room API', () => {
  const app = createServer();
  let authToken: string;
  let playerId: string;
  let friendId: string;
  let friendToken: string;

  beforeAll(async () => {
    // Setup test players and auth tokens
    const prisma = getPrismaClient();

    // Create test player
    const player = await prisma.player.create({
      data: {
        id: `test-player-${Date.now()}`,
        username: `testuser-${Date.now()}`,
        isAnonymous: false,
      },
    });
    playerId = player.id;

    // Create test friend
    const friend = await prisma.player.create({
      data: {
        id: `test-friend-${Date.now()}`,
        username: `testfriend-${Date.now()}`,
        isAnonymous: false,
      },
    });
    friendId = friend.id;

    // Create friendship
    await prisma.friendship.create({
      data: {
        requesterId: playerId,
        addresseeId: friendId,
        status: 'ACCEPTED',
      },
    });

    // Create auth sessions
    const playerToken = await createSession(playerId);
    const friendSessionToken = await createSession(friendId);
    authToken = `Bearer ${playerToken}`;
    friendToken = `Bearer ${friendSessionToken}`;
  });

  afterAll(async () => {
    // Cleanup
    const prisma = getPrismaClient();
    await prisma.roomMember.deleteMany({ where: { playerId: { in: [playerId, friendId] } } });
    await prisma.room.deleteMany({ where: { hostId: { in: [playerId, friendId] } } });
    await prisma.friendship.deleteMany({ where: { requesterId: playerId } });
    await prisma.session.deleteMany({ where: { playerId: { in: [playerId, friendId] } } });
    await prisma.player.deleteMany({ where: { id: { in: [playerId, friendId] } } });
  });

  describe('POST /rooms/create', () => {
    it('should create a room successfully', async () => {
      const response = await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 1, name: 'Test Room' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.mode).toBe(1);
      expect(response.body.name).toBe('Test Room');
      expect(response.body.hostId).toBe(playerId);
      expect(response.body.status).toBe('WAITING');
    });

    it('should reject invalid mode', async () => {
      await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 3 })
        .expect(400);
    });
  });

  describe('POST /rooms/:roomId/join', () => {
    let roomId: string;

    beforeEach(async () => {
      // Create a room
      const response = await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 1 });
      roomId = response.body.id;
    });

    it('should allow friend to join room', async () => {
      await request(app)
        .post(`/rooms/${roomId}/join`)
        .set('Authorization', friendToken)
        .expect(200);

      // Verify membership
      const prisma = getPrismaClient();
      const member = await prisma.roomMember.findUnique({
        where: {
          roomId_playerId: {
            roomId,
            playerId: friendId,
          },
        },
      });
      expect(member).not.toBeNull();
    });

    it('should reject non-friend joining', async () => {
      // Create another player (not a friend)
      const prisma = getPrismaClient();
      const stranger = await prisma.player.create({
        data: {
          id: `stranger-${Date.now()}`,
          username: `stranger-${Date.now()}`,
          isAnonymous: true,
        },
      });

      const strangerSessionToken = await createSession(stranger.id);
      const strangerToken = `Bearer ${strangerSessionToken}`;

      await request(app)
        .post(`/rooms/${roomId}/join`)
        .set('Authorization', strangerToken)
        .expect(403);

      // Cleanup
      await prisma.session.deleteMany({ where: { playerId: stranger.id } });
      await prisma.player.delete({ where: { id: stranger.id } });
    });
  });

  describe('POST /rooms/:roomId/ready', () => {
    let roomId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 1 });
      roomId = response.body.id;

      await request(app)
        .post(`/rooms/${roomId}/join`)
        .set('Authorization', friendToken);
    });

    it('should toggle ready state', async () => {
      await request(app)
        .post(`/rooms/${roomId}/ready`)
        .set('Authorization', friendToken)
        .send({ isReady: true })
        .expect(200);

      const prisma = getPrismaClient();
      const member = await prisma.roomMember.findUnique({
        where: {
          roomId_playerId: {
            roomId,
            playerId: friendId,
          },
        },
      });
      expect(member?.isReady).toBe(true);
    });
  });

  describe('POST /rooms/:roomId/assign-players', () => {
    let roomId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 1 });
      roomId = response.body.id;

      await request(app)
        .post(`/rooms/${roomId}/join`)
        .set('Authorization', friendToken);
    });

    it('should allow host to assign players', async () => {
      await request(app)
        .post(`/rooms/${roomId}/assign-players`)
        .set('Authorization', authToken)
        .send({ player1Id: playerId, player2Id: friendId })
        .expect(200);

      const prisma = getPrismaClient();
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });
      expect(room?.player1Id).toBe(playerId);
      expect(room?.player2Id).toBe(friendId);
    });

    it('should reject non-host assigning players', async () => {
      await request(app)
        .post(`/rooms/${roomId}/assign-players`)
        .set('Authorization', friendToken)
        .send({ player1Id: playerId, player2Id: friendId })
        .expect(403);
    });
  });

  describe('POST /rooms/:roomId/leave', () => {
    let roomId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/rooms/create')
        .set('Authorization', authToken)
        .send({ mode: 1 });
      roomId = response.body.id;

      await request(app)
        .post(`/rooms/${roomId}/join`)
        .set('Authorization', friendToken);
    });

    it('should allow member to leave', async () => {
      await request(app)
        .post(`/rooms/${roomId}/leave`)
        .set('Authorization', friendToken)
        .expect(200);

      const prisma = getPrismaClient();
      const member = await prisma.roomMember.findUnique({
        where: {
          roomId_playerId: {
            roomId,
            playerId: friendId,
          },
        },
      });
      expect(member).toBeNull();
    });

    it('should close room when host leaves', async () => {
      await request(app)
        .post(`/rooms/${roomId}/leave`)
        .set('Authorization', authToken)
        .expect(200);

      const prisma = getPrismaClient();
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });
      expect(room?.status).toBe('CLOSED');
    });
  });
});
