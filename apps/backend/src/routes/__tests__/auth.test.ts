/**
 * Auth API Integration Tests
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../server';
import { getPrismaClient } from '../../storage/prismaClient';

describe('Auth API', () => {
  const app = createServer();
  const createdPlayerIds: string[] = [];

  afterAll(async () => {
    const prisma = getPrismaClient();
    await prisma.session.deleteMany({ where: { playerId: { in: createdPlayerIds } } });
    await prisma.player.deleteMany({ where: { id: { in: createdPlayerIds } } });
  });

  describe('POST /auth/oauth/callback', () => {
    it('links an existing anonymous player to a new OAuth identity instead of asking to register again', async () => {
      const prisma = getPrismaClient();

      // Simulate a user who already registered an anonymous username before OAuth.
      const anonymous = await prisma.player.create({
        data: {
          id: `test-anon-${Date.now()}`,
          username: `existinguser${Date.now()}`,
          isAnonymous: true,
        },
      });
      createdPlayerIds.push(anonymous.id);

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          provider: 'google',
          oauthId: `google-oauth-id-${Date.now()}`,
          email: 'existinguser@example.com',
          name: 'Existing User',
          playerId: anonymous.id,
        })
        .expect(200);

      // The pre-existing username must be preserved, and the user must NOT
      // be asked to register a new username.
      expect(response.body.isNewUser).toBe(false);
      expect(response.body.playerId).toBe(anonymous.id);
      expect(response.body.username).toBe(anonymous.username);
      expect(response.body.sessionToken).toBeTruthy();

      const updated = await prisma.player.findUnique({ where: { id: anonymous.id } });
      expect(updated?.oauthProvider).toBe('google');
      expect(updated?.isAnonymous).toBe(false);
    });

    it('logs a returning OAuth user in without touching an unrelated anonymous playerId', async () => {
      const prisma = getPrismaClient();
      const oauthId = `google-returning-${Date.now()}`;

      const existing = await prisma.player.create({
        data: {
          id: `test-existing-${Date.now()}`,
          username: `returninguser${Date.now()}`,
          isAnonymous: false,
          oauthProvider: 'google',
          oauthId,
          oauthEmail: 'returning@example.com',
        },
      });
      createdPlayerIds.push(existing.id);

      const unrelatedAnonymous = await prisma.player.create({
        data: {
          id: `test-unrelated-${Date.now()}`,
          username: `unrelateduser${Date.now()}`,
          isAnonymous: true,
        },
      });
      createdPlayerIds.push(unrelatedAnonymous.id);

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          provider: 'google',
          oauthId,
          email: 'returning@example.com',
          playerId: unrelatedAnonymous.id,
        })
        .expect(200);

      expect(response.body.isNewUser).toBe(false);
      expect(response.body.playerId).toBe(existing.id);
      expect(response.body.username).toBe(existing.username);

      const unrelatedAfter = await prisma.player.findUnique({ where: { id: unrelatedAnonymous.id } });
      expect(unrelatedAfter?.oauthProvider).toBeNull();
      expect(unrelatedAfter?.isAnonymous).toBe(true);
    });

    it('falls back to isNewUser when the given playerId already has an OAuth provider linked', async () => {
      const prisma = getPrismaClient();

      const alreadyLinked = await prisma.player.create({
        data: {
          id: `test-already-linked-${Date.now()}`,
          username: `alreadylinked${Date.now()}`,
          isAnonymous: false,
          oauthProvider: 'discord',
          oauthId: `discord-${Date.now()}`,
        },
      });
      createdPlayerIds.push(alreadyLinked.id);

      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          provider: 'google',
          oauthId: `google-new-${Date.now()}`,
          email: 'new@example.com',
          playerId: alreadyLinked.id,
        })
        .expect(200);

      expect(response.body.isNewUser).toBe(true);
      expect(response.body.suggestedUsername).toBeTruthy();

      const unchanged = await prisma.player.findUnique({ where: { id: alreadyLinked.id } });
      expect(unchanged?.oauthProvider).toBe('discord');
    });

    it('does not require an email - Discord accounts without a verified email must still be able to sign in', async () => {
      const response = await request(app)
        .post('/auth/oauth/callback')
        .send({
          provider: 'discord',
          oauthId: `discord-no-email-${Date.now()}`,
          email: '',
          name: 'NoEmailUser',
        })
        .expect(200);

      expect(response.body.isNewUser).toBe(true);
      expect(response.body.suggestedUsername).toBeTruthy();
    });
  });

  describe('POST /auth/oauth/register', () => {
    it('completes registration for a provider account with no email (e.g. unverified Discord email)', async () => {
      const prisma = getPrismaClient();
      const oauthId = `discord-register-no-email-${Date.now()}`;
      const username = `noemail${Date.now().toString().slice(-8)}`;

      const response = await request(app)
        .post('/auth/oauth/register')
        .send({
          provider: 'discord',
          oauthId,
          email: '',
          username,
          displayName: 'No Email User',
        })
        .expect(201);

      expect(response.body.username).toBe(username);
      expect(response.body.sessionToken).toBeTruthy();
      createdPlayerIds.push(response.body.playerId);

      const created = await prisma.player.findUnique({ where: { id: response.body.playerId } });
      expect(created?.oauthId).toBe(oauthId);
      expect(created?.oauthEmail).toBeFalsy();
    });
  });
});
