/**
 * Challenge Expiry Background Job
 *
 * Checks for expired challenges every 30 seconds and updates their status
 */

import { getPrismaClient } from '../storage/prismaClient';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the challenge expiry job
 */
export function startChallengeExpiryJob(): void {
  if (intervalId) {
    console.log('⚠️ Challenge expiry job already running');
    return;
  }

  // Run immediately on start
  void processExpiredChallenges();

  // Then run every 30 seconds
  intervalId = setInterval(() => {
    void processExpiredChallenges();
  }, 30000);

  console.log('✅ Challenge expiry job started (30s interval)');
}

/**
 * Stop the challenge expiry job
 */
export function stopChallengeExpiryJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Challenge expiry job stopped');
  }
}

/**
 * Process expired challenges
 */
async function processExpiredChallenges(): Promise<void> {
  try {
    const prisma = getPrismaClient();
    const now = new Date();

    // Find all pending challenges that have expired
    const expiredChallenges = await prisma.challenge.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        challengerId: true,
        challengedId: true,
      },
    });

    if (expiredChallenges.length === 0) {
      return;
    }

    // Update all expired challenges to EXPIRED status
    const challengeIds = expiredChallenges.map((c) => c.id);

    await prisma.challenge.updateMany({
      where: {
        id: {
          in: challengeIds,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`⏰ Expired ${expiredChallenges.length} challenge(s)`);

    // Note: WebSocket notifications for expired challenges would be sent here
    // but require access to WebSocketManager instance, which we'll handle
    // by having WebSocketManager call this or by using an event emitter
  } catch (error) {
    console.error('❌ Error processing expired challenges:', error);
  }
}
