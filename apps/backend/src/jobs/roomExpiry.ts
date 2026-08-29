/**
 * Room Expiry Job
 *
 * Closes rooms that have expired or been inactive too long
 * Runs every 5 minutes
 */

import { getPrismaClient } from '../storage/prismaClient';
import { wsManager } from '../websocket';

const INACTIVITY_THRESHOLD_MINUTES = 30;

export async function closeExpiredRooms(): Promise<void> {
  try {
    const prisma = getPrismaClient();
    const now = new Date();

    // Calculate inactivity cutoff
    const inactivityCutoff = new Date();
    inactivityCutoff.setMinutes(inactivityCutoff.getMinutes() - INACTIVITY_THRESHOLD_MINUTES);

    // Find rooms to close (expired OR inactive)
    const expiredRooms = await prisma.room.findMany({
      where: {
        status: { in: ['WAITING', 'BETWEEN_GAMES'] },
        OR: [
          { expiresAt: { lt: now } },
          { lastActivityAt: { lt: inactivityCutoff } },
        ],
      },
      select: { id: true },
    });

    if (expiredRooms.length === 0) {
      return;
    }

    const roomIds = expiredRooms.map((r) => r.id);

    // Close all expired rooms
    await prisma.room.updateMany({
      where: { id: { in: roomIds } },
      data: { status: 'CLOSED' },
    });

    // Notify members of each room
    for (const roomId of roomIds) {
      wsManager.emitRoomClosed(roomId, {
        roomId,
        reason: 'expired',
      });
    }

    console.log(`🧹 Closed ${expiredRooms.length} expired/inactive room(s)`);
  } catch (error) {
    console.error('Error closing expired rooms:', error);
  }
}

export function startRoomExpiryJob(): NodeJS.Timeout {
  // Run every 5 minutes
  const interval = setInterval(() => {
    void closeExpiredRooms();
  }, 5 * 60 * 1000);

  // Run immediately on startup
  void closeExpiredRooms();

  console.log('✅ Room expiry job started (runs every 5 minutes)');

  return interval;
}
