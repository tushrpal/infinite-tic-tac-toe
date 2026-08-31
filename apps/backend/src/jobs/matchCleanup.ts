/**
 * Background job to clean up expired active matches
 *
 * Removes matches from the ActiveMatch table that have exceeded their expiry time.
 * Runs every 5 minutes to prevent database bloat.
 */

import { getPrismaClient } from '../storage/prismaClient';

let intervalId: NodeJS.Timeout | null = null;

export function startMatchCleanupJob(): void {
  if (intervalId) {
    console.warn('Match cleanup job already running');
    return;
  }

  console.log('Starting match cleanup job (runs every 5 minutes)');

  intervalId = setInterval(async () => {
    try {
      const prisma = getPrismaClient();

      // Delete matches that have expired
      const result = await prisma.activeMatch.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        console.log(`🗑️  Cleaned up ${result.count} expired match(es)`);
      }
    } catch (error) {
      console.error('Match cleanup job failed:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

export function stopMatchCleanupJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Match cleanup job stopped');
  }
}
