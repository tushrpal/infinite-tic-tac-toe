/**
 * Authentication utilities for OAuth and session management
 */

import crypto from 'crypto';
import { getPrismaClient } from '../storage/prismaClient';

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

/**
 * Generate username suggestions if the preferred one is taken
 */
export function generateUsernameSuggestions(baseUsername: string, count: number = 3): string[] {
  const suggestions: string[] = [];
  const year = new Date().getFullYear();

  suggestions.push(`${baseUsername}_${Math.floor(Math.random() * 99) + 1}`);
  suggestions.push(`${baseUsername}${year}`);
  suggestions.push(`${baseUsername}_pro`);

  return suggestions.slice(0, count);
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
