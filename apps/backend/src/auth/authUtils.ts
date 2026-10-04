/**
 * Authentication utilities for OAuth and session management
 */

import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../storage/prismaClient';
import { isValidUsername, sanitizeUsername } from '../utils/validation';

const SESSION_EXPIRY_DAYS = 30;
const TOKEN_BYTE_LENGTH = 32;

export type OAuthProvider = 'google' | 'discord';

export interface OAuthUserData {
  provider: OAuthProvider;
  oauthId: string;
  email: string;
  name?: string;
}

export interface SessionData {
  playerId: string;
  token: string;
  expiresAt: Date;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('base64url');
}

/**
 * Create a new session for a player
 * Returns the session token
 */
export async function createSession(playerId: string): Promise<string> {
  const prisma = getPrismaClient();
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      playerId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate a session token and return player ID if valid
 * Returns null if token is invalid or expired
 */
export async function validateSession(token: string): Promise<string | null> {
  const prisma = getPrismaClient();

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      playerId: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return session.playerId;
}

/**
 * Delete a specific session token
 */
export async function deleteSession(token: string): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

/**
 * Delete all sessions for a player
 */
export async function deleteAllPlayerSessions(playerId: string): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.session.deleteMany({ where: { playerId } });
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

/**
 * Generate a username suggestion from email
 */
export function generateUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Remove non-alphanumeric characters except underscore
  const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

  // Ensure it starts and ends with alphanumeric
  let username = sanitized.replace(/^_+|_+$/g, '');

  // Ensure minimum length
  if (username.length < 3) {
    username = `user_${username}`;
  }

  // Truncate to max length
  if (username.length > 20) {
    username = username.substring(0, 20);
  }

  // Guard against an all-underscore/empty seed still leaving a trailing
  // underscore (e.g. no email, no usable name) which fails username validation.
  return username.replace(/_+$/, '') || 'user';
}

/**
 * Generate a username suggestion when no email is available (e.g. a Discord
 * account with no verified email). Falls back through name, then the OAuth
 * provider ID, so sign-in never hard-fails just because email is missing.
 */
export function generateUsernameSeed(email?: string | null, name?: string | null, oauthId?: string): string {
  if (email) return generateUsernameFromEmail(email);
  if (name) return generateUsernameFromEmail(name);
  return generateUsernameFromEmail(`user_${oauthId || ''}`);
}

const USERNAME_MAX_LENGTH = 20;
const USERNAME_SUFFIX_TRIES = 50;
const CREATE_ATTEMPTS = 3;

/**
 * Pick a free username derived from `seed`: the seed itself, then `seed_2`,
 * `seed_3`, ..., then a random-suffixed name as a last resort. Usernames are
 * server-assigned and never edited by the user, so this always returns a name.
 */
export async function findAvailableUsername(seed: string): Promise<string> {
  const prisma = getPrismaClient();

  let base = sanitizeUsername(seed).replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
  if (base.length < 3) base = `player${base}`;
  base = base.slice(0, USERNAME_MAX_LENGTH).replace(/_+$/, '');

  for (let n = 1; n <= USERNAME_SUFFIX_TRIES; n++) {
    const suffix = n === 1 ? '' : `_${n}`;
    const candidate = `${base.slice(0, USERNAME_MAX_LENGTH - suffix.length).replace(/_+$/, '')}${suffix}`;
    if (!isValidUsername(candidate)) continue;

    const taken = await prisma.player.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `${base.slice(0, 13).replace(/_+$/, '')}_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Create a player with a server-assigned username. If a concurrent signup
 * claims the chosen name first (Prisma P2002), pick again and retry.
 */
export async function createPlayerWithAvailableUsername<T>(
  seed: string,
  create: (username: string) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const username = await findAvailableUsername(seed);
    try {
      return await create(username);
    } catch (error) {
      const raced = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!raced || attempt >= CREATE_ATTEMPTS) throw error;
    }
  }
}

/**
 * Validate OAuth provider
 */
export function isValidOAuthProvider(provider: string): provider is OAuthProvider {
  return ['google', 'discord'].includes(provider);
}

/**
 * Update player's last login timestamp
 */
export async function updateLastLogin(playerId: string): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.player.update({
    where: { id: playerId },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});
}
