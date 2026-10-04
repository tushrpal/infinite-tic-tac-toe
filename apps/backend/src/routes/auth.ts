/**
 * Authentication API Routes
 *
 * Handles OAuth login, session management, and account linking.
 */

import express from 'express';
import { getPrismaClient } from '../storage/prismaClient';
import { Prisma } from '@prisma/client';
import {
  createSession,
  validateSession,
  deleteSession,
  deleteAllPlayerSessions,
  generateUsernameFromEmail,
  generateUsernameSeed,
  createPlayerWithAvailableUsername,
  isValidOAuthProvider,
  updateLastLogin,
  type OAuthUserData,
} from '../auth/authUtils';
import { isValidDisplayName, isValidUsername, sanitizeUsername } from '../utils/validation';
import { randomUUID } from 'crypto';

/** True when `error` is a Prisma unique-constraint violation (code P2002). */
function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

const router = express.Router();

function safeRandomUUID(): string {
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * POST /auth/oauth/callback
 *
 * Handle OAuth callback after user authenticates with provider.
 *
 * Request body:
 * {
 *   provider: 'google' | 'discord';
 *   oauthId: string;        // Provider's user ID
 *   email?: string;         // May be absent, e.g. an unverified Discord email
 *   name?: string;          // User's display name from provider
 *   playerId?: string;      // Current anonymous player, if any - will be
 *                           // linked to this OAuth identity instead of
 *                           // creating a brand-new account.
 * }
 *
 * Response:
 * - Existing user: { playerId, username, sessionToken, isNewUser: false }
 * - New user: { isNewUser: true, suggestedUsername, oauthData }
 */
router.post('/oauth/callback', async (req, res) => {
  try {
    const { provider, oauthId, email, name, playerId } = req.body as {
      provider?: string;
      oauthId?: string;
      email?: string;
      name?: string;
      playerId?: string;
    };

    console.log('OAuth callback received:', { provider, oauthId, email, name, playerId });

    // Validate input. Email is intentionally not required here - some
    // providers (e.g. Discord accounts with no verified email) never send
    // one, and oauthId is what actually identifies the account.
    if (!provider || !oauthId) {
      return res.status(400).json({
        error: 'Missing required fields: provider, oauthId',
      });
    }

    if (!isValidOAuthProvider(provider)) {
      return res.status(400).json({
        error: 'Invalid OAuth provider. Must be: google or discord',
      });
    }

    const prisma = getPrismaClient();

    // Check if user exists with this OAuth identity
    const existingPlayer = await prisma.player.findUnique({
      where: {
        oauthProvider_oauthId: {
          oauthProvider: provider,
          oauthId,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
      },
    });

    console.log('Existing player search result:', existingPlayer);

    if (existingPlayer) {
      // Returning user - create session and return
      const sessionToken = await createSession(existingPlayer.id);
      await updateLastLogin(existingPlayer.id);

      console.log('Existing user login successful:', {
        playerId: existingPlayer.id,
        username: existingPlayer.username
      });

      return res.status(200).json({
        playerId: existingPlayer.id,
        username: existingPlayer.username,
        displayName: existingPlayer.displayName,
        rating: existingPlayer.ratingMode1 + existingPlayer.ratingMode2,
        sessionToken,
        isNewUser: false,
      });
    }

    // No account is linked to this OAuth identity yet. If the caller already
    // has an anonymous player (they registered a username before signing in
    // with OAuth), link this OAuth identity to that player instead of
    // treating them as a brand-new signup - this preserves their username.
    if (playerId) {
      const anonymousPlayer = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
          oauthProvider: true,
        },
      });

      if (anonymousPlayer && !anonymousPlayer.oauthProvider) {
        try {
          await prisma.player.update({
            where: { id: anonymousPlayer.id },
            data: {
              oauthProvider: provider,
              oauthId,
              oauthEmail: email || null,
              isAnonymous: false,
              lastLoginAt: new Date(),
            },
          });

          const sessionToken = await createSession(anonymousPlayer.id);

          console.log('Linked anonymous player to new OAuth identity:', {
            playerId: anonymousPlayer.id,
            username: anonymousPlayer.username,
          });

          return res.status(200).json({
            playerId: anonymousPlayer.id,
            username: anonymousPlayer.username,
            displayName: anonymousPlayer.displayName,
            rating: anonymousPlayer.ratingMode1 + anonymousPlayer.ratingMode2,
            sessionToken,
            isNewUser: false,
          });
        } catch (linkError) {
          // Another concurrent request (e.g. a double-fired effect, or two
          // tabs) may have linked this exact OAuth identity to a different
          // player microseconds earlier, tripping the unique constraint.
          // Fall back to logging into whichever account actually won.
          if (!isUniqueConstraintError(linkError)) throw linkError;

          const winner = await prisma.player.findUnique({
            where: { oauthProvider_oauthId: { oauthProvider: provider, oauthId } },
            select: { id: true, username: true, displayName: true, ratingMode1: true, ratingMode2: true },
          });

          if (winner) {
            const sessionToken = await createSession(winner.id);
            return res.status(200).json({
              playerId: winner.id,
              username: winner.username,
              displayName: winner.displayName,
              rating: winner.ratingMode1 + winner.ratingMode2,
              sessionToken,
              isNewUser: false,
            });
          }

          throw linkError;
        }
      }
    }

    // New OAuth user - return suggested username and OAuth data
    // Frontend will show username selection modal
    const suggestedUsername = generateUsernameSeed(email, name, oauthId);

    console.log('New OAuth user, suggesting username:', suggestedUsername);

    return res.status(200).json({
      isNewUser: true,
      suggestedUsername,
      oauthData: {
        provider,
        oauthId,
        email: email || '',
        name: name || null,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Failed to process OAuth callback' });
  }
});

/**
 * POST /auth/oauth/register
 *
 * Complete OAuth registration with chosen username.
 * Called after new user selects a username.
 *
 * Request body:
 * {
 *   provider: string;
 *   oauthId: string;
 *   email?: string;         // May be absent, e.g. an unverified Discord email
 *   username: string;       // User's chosen username
 *   displayName?: string;
 * }
 */
router.post('/oauth/register', async (req, res) => {
  try {
    const { provider, oauthId, email, username, displayName } = req.body as {
      provider?: string;
      oauthId?: string;
      email?: string;
      username?: string;
      displayName?: string;
    };

    // Validate input. Email is intentionally not required - see /oauth/callback.
    if (!provider || !oauthId || !username) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!isValidOAuthProvider(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    const sanitized = sanitizeUsername(username);
    if (!isValidUsername(sanitized)) {
      return res.status(400).json({
        error: 'Invalid username. Must be 3-20 characters, alphanumeric and underscore only',
      });
    }

    // Display names may repeat, so they are only checked for format.
    if (!displayName || !isValidDisplayName(displayName)) {
      return res.status(400).json({
        error: 'Invalid display name. Must be 1-50 characters with at least 3 letters',
      });
    }

    const prisma = getPrismaClient();

    // Create new player with OAuth identity. The username is server-assigned:
    // if the seed is taken, a free variant is used instead of failing signup.
    const playerId = safeRandomUUID();
    const player = await createPlayerWithAvailableUsername(sanitized, (username) =>
      prisma.player.create({
        data: {
          id: playerId,
          username,
          displayName: displayName.trim(),
          oauthProvider: provider,
          oauthId,
          oauthEmail: email || null,
          isAnonymous: false,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          ratingMode1: true,
          ratingMode2: true,
        },
      }),
    );

    // Create session
    const sessionToken = await createSession(player.id);

    return res.status(201).json({
      playerId: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
      sessionToken,
    });
  } catch (error) {
    console.error('OAuth registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
});

/**
 * POST /auth/link-account
 *
 * Link an anonymous account to OAuth identity.
 * Upgrades anonymous user to authenticated account.
 *
 * Request body:
 * {
 *   playerId: string;       // Anonymous player's ID
 *   provider: string;
 *   oauthId: string;
 *   email?: string;         // May be absent, e.g. an unverified Discord email
 * }
 */
router.post('/link-account', async (req, res) => {
  try {
    const { playerId, provider, oauthId, email } = req.body as {
      playerId?: string;
      provider?: string;
      oauthId?: string;
      email?: string;
    };

    if (!playerId || !provider || !oauthId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidOAuthProvider(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    const prisma = getPrismaClient();

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        username: true,
        isAnonymous: true,
        oauthProvider: true,
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if already linked to an OAuth provider
    if (player.oauthProvider) {
      return res.status(400).json({
        error: `Account is already linked to ${player.oauthProvider}. Unlink first to link a different provider.`
      });
    }

    // Check if this OAuth identity is already used by another account
    const existingOAuth = await prisma.player.findUnique({
      where: {
        oauthProvider_oauthId: {
          oauthProvider: provider,
          oauthId,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    });

    if (existingOAuth) {
      return res.status(409).json({
        error: 'This account is already linked to another player',
        code: 'OAUTH_ALREADY_LINKED',
        existingAccount: {
          username: existingOAuth.username,
          displayName: existingOAuth.displayName,
        },
      });
    }

    // Link OAuth to existing player
    await prisma.player.update({
      where: { id: playerId },
      data: {
        oauthProvider: provider,
        oauthId,
        oauthEmail: email || null,
        isAnonymous: false,
        lastLoginAt: new Date(),
      },
    });

    // Create new session
    const sessionToken = await createSession(playerId);

    return res.status(200).json({
      success: true,
      playerId,
      username: player.username,
      sessionToken,
    });
  } catch (error) {
    console.error('Account linking error:', error);
    return res.status(500).json({ error: 'Failed to link account' });
  }
});

/**
 * GET /auth/session
 *
 * Validate session token and return player data.
 * Use Authorization header: Bearer <token>
 */
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const playerId = await validateSession(token);

    if (!playerId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const prisma = getPrismaClient();
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        username: true,
        displayName: true,
        ratingMode1: true,
        ratingMode2: true,
        isAnonymous: true,
        createdAt: true,
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update last login
    await updateLastLogin(playerId);

    return res.status(200).json({
      playerId: player.id,
      username: player.username,
      displayName: player.displayName,
      rating: player.ratingMode1 + player.ratingMode2,
      ratingMode1: player.ratingMode1,
      ratingMode2: player.ratingMode2,
      isAnonymous: player.isAnonymous,
      createdAt: player.createdAt,
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ error: 'Failed to validate session' });
  }
});

/**
 * POST /auth/logout
 *
 * Delete the current session token.
 * Use Authorization header: Bearer <token>
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    await deleteSession(token);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * POST /auth/logout-all
 *
 * Delete all sessions for the authenticated player.
 * Use Authorization header: Bearer <token>
 */
router.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const playerId = await validateSession(token);

    if (!playerId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    await deleteAllPlayerSessions(playerId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

export default router;
