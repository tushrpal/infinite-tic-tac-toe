'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { RoomListItem } from '@/ws/types';

interface RoomCardProps {
  room: RoomListItem;
  onJoin: (roomId: string) => void;
  isMember?: boolean;
}

export function RoomCard({ room, onJoin, isMember = false }: RoomCardProps) {
  const displayName = room.name || `${room.host.displayName || room.host.username}'s Room`;
  const modeLabel = room.mode === 1 ? 'Sliding' : 'Classic';

  const statusConfig = {
    WAITING: { label: 'Open', color: 'text-accent-success' },
    ACTIVE: { label: 'In Game', color: 'text-blue-400' },
    BETWEEN_GAMES: { label: 'Between Games', color: 'text-accent-warning' },
    CLOSED: { label: 'Closed', color: 'text-text-muted' },
  };

  const status = statusConfig[room.status];

  return (
    <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold truncate">🏠 {displayName}</h3>
            <span className={`text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="text-sm text-text-secondary space-y-1">
            <p>Host: {room.host.username} · Mode: {modeLabel}</p>
            <p>👥 {room.memberCount}/{room.maxPlayers} players</p>
          </div>
        </div>

        <Button
          onClick={() => onJoin(room.id)}
          variant="primary"
          size="sm"
        >
          {isMember ? 'Open Room' : 'Join Room'}
        </Button>
      </div>
    </div>
  );
}
