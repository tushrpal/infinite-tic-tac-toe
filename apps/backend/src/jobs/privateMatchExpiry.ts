/**
 * Private Match Expiry Background Job
 *
 * Checks for expired private match links every 60 seconds and updates their status
 */

import { getPrismaClient } from '../storage/prismaClient';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the private match expiry job
 */
export function startPrivateMatchExpiryJob(): void {
  if (intervalId) {
    console.log('⚠️ Private match expiry job already running');
    return;
  }

  // Run immediately on start
  void processExpiredPrivateMatches();

  // Then run every 60 seconds
  intervalId = setInterval(() => {
    void processExpiredPrivateMatches();
  }, 60000);

  console.log('✅ Private match expiry job started (60s interval)');
}

/**
 * Stop the private match expiry job
 */
export function stopPrivateMatchExpiryJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Private match expiry job stopped');
  }
}

/**
 * Process expired private matches
 */
async function processExpiredPrivateMatches(): Promise<void> {
  try {
    const prisma = getPrismaClient();
    const now = new Date();

    // Find all waiting private matches that have expired
    const expiredMatches = await prisma.privateMatch.findMany({
      where: {
        status: 'WAITING',
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (expiredMatches.length === 0) {
      return;
    }

    // Update all expired private matches to EXPIRED status
    const matchCodes = expiredMatches.map((m) => m.id);

    await prisma.privateMatch.updateMany({
      where: {
        id: {
          in: matchCodes,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    console.log(`⏰ Expired ${expiredMatches.length} private match link(s)`);
  } catch (error) {
    console.error('❌ Error processing expired private matches:', error);
  }
}
