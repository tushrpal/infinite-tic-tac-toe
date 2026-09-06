'use client';

/**
 * RoomInviteNotificationWrapper
 * Client component that surfaces incoming room invites as toasts app-wide
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/components/providers/PlayerProvider';
import { useSocketEvent } from '@/hooks/useWebSocket';
import { getPendingInvites, respondToInvite } from '@/lib/rooms';
import { RoomInviteNotification } from './RoomInviteNotification';
import type { RoomInvite } from '@/ws/types';

export function RoomInviteNotificationWrapper() {
  const { player } = usePlayer();
  const router = useRouter();
  const [invites, setInvites] = useState<RoomInvite[]>([]);

  // Room invites require an OAuth-linked account - anonymous players have no
  // session token, so this endpoint would just 401.
  const isAuthenticated = !!player && player.isAnonymous === false;

  const refreshInvites = useCallback(async () => {
    try {
      const pending = await getPendingInvites();
      setInvites(pending);
    } catch (err) {
      console.error('Failed to load room invites:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshInvites();
    } else {
      setInvites([]);
    }
  }, [isAuthenticated, refreshInvites]);

  // A fresh invite may arrive without the full room payload the REST
  // endpoint returns, so just refetch the list to stay in sync.
  useSocketEvent('ROOM_INVITE_RECEIVED', () => {
    refreshInvites();
  }, [refreshInvites]);

  const dismiss = useCallback((inviteId: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  }, []);

  const handleAccept = useCallback(async (invite: RoomInvite) => {
    try {
      await respondToInvite(invite.id, { action: 'ACCEPT' });
      dismiss(invite.id);
      router.push(`/rooms/${invite.roomId}`);
    } catch (err) {
      console.error('Failed to accept room invite:', err);
    }
  }, [dismiss, router]);

  const handleDecline = useCallback(async (invite: RoomInvite) => {
    try {
      await respondToInvite(invite.id, { action: 'DECLINE' });
    } catch (err) {
      console.error('Failed to decline room invite:', err);
    } finally {
      dismiss(invite.id);
    }
  }, [dismiss]);

  if (invites.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[150] space-y-3">
      {invites.map((invite) => (
        <RoomInviteNotification
          key={invite.id}
          invite={invite}
          onAccept={() => handleAccept(invite)}
          onDecline={() => handleDecline(invite)}
          onDismiss={() => dismiss(invite.id)}
        />
      ))}
    </div>
  );
}
