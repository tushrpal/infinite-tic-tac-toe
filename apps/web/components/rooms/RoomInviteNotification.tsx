'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { RoomInvite } from '@/ws/types';
import { getRoomModeLabel } from '@/lib/gameModes';

interface RoomInviteNotificationProps {
  invite: RoomInvite;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function RoomInviteNotification({
  invite,
  onAccept,
  onDecline,
  onDismiss,
}: RoomInviteNotificationProps) {
  const roomName = invite.room?.name ? `"${invite.room.name}"` : 'their room';
  const inviterName = invite.inviter?.displayName || 'Someone';
  const mode = invite.room?.mode ? getRoomModeLabel(invite.room.mode) : 'Unknown';
  const memberCount = invite.room?.memberCount;

  return (
    <div className="w-full max-w-md p-4 rounded-xl bg-surface-elevated border border-accent-primary/30 shadow-lg animate-slide-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold">📨 Room Invite</h3>
        <button
          onClick={onDismiss}
          className="no-touch-target text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <p className="mb-2">
        {inviterName} invited you to {roomName}
      </p>

      {invite.room && (
        <p className="text-sm text-text-secondary mb-4">
          Mode: {mode}
          {memberCount != null ? ` · ${memberCount}/8 players` : null}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={onAccept} variant="primary" size="sm" className="flex-1">
          Accept
        </Button>
        <Button onClick={onDecline} variant="secondary" size="sm" className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
}
