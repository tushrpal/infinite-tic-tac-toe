'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { RoomMember } from '@/ws/types';

interface PlayerListProps {
  members: RoomMember[];
  hostId: string;
  currentPlayerId: string | null;
  onToggleReady: () => void;
  onInvite: () => void;
}

export function PlayerList({
  members,
  hostId,
  currentPlayerId,
  onToggleReady,
  onInvite,
}: PlayerListProps) {
  const currentMember = members.find((m) => m.playerId === currentPlayerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Players ({members.length}/8)
        </h3>
        <Button onClick={onInvite} variant="secondary" size="sm">
          + Invite
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isHost = member.playerId === hostId;
          const isCurrentPlayer = member.playerId === currentPlayerId;

          return (
            <div
              key={member.id}
              className="p-4 rounded-lg bg-surface-elevated border border-board-grid"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isHost && <span className="text-lg">👑</span>}
                    <span className="font-medium truncate">
                      {member.player.displayName}
                    </span>
                    {isCurrentPlayer && (
                      <span className="text-xs text-text-muted">(You)</span>
                    )}
                  </div>

                  <div className="text-sm text-text-secondary">
                    <p>⭐ Rating: {member.player.ratingMode1 || 'Unrated'}</p>
                  </div>

                  <div className="mt-2">
                    {member.isReady ? (
                      <span className="text-xs font-medium text-accent-success">
                        ✅ Ready
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-text-muted">
                        ⏸️ Not Ready
                      </span>
                    )}
                  </div>
                </div>

                {isCurrentPlayer && (
                  <Button
                    onClick={onToggleReady}
                    variant="secondary"
                    size="sm"
                  >
                    {member.isReady ? 'Mark Not Ready' : 'Mark Ready'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
