'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { assignPlayers } from '@/lib/rooms';
import type { RoomMember } from '@/ws/types';

interface PlayerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  members: RoomMember[];
  currentAssignment?: {
    player1Id: string | null;
    player2Id: string | null;
  };
  onSuccess: () => void;
}

export function PlayerAssignmentModal({
  isOpen,
  onClose,
  roomId,
  members,
  currentAssignment,
  onSuccess,
}: PlayerAssignmentModalProps) {
  const [player1Id, setPlayer1Id] = useState<string>(
    currentAssignment?.player1Id || ''
  );
  const [player2Id, setPlayer2Id] = useState<string>(
    currentAssignment?.player2Id || ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort members: ready players first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isReady && !b.isReady) return -1;
    if (!a.isReady && b.isReady) return 1;
    return 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!player1Id || !player2Id) {
      setError('Please select both players');
      return;
    }

    if (player1Id === player2Id) {
      setError('Cannot select the same player twice');
      return;
    }

    setIsSubmitting(true);

    try {
      await assignPlayers(roomId, {
        player1Id,
        player2Id,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning players:', err);
      setError('Failed to assign players. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Players for Next Game">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Player 1 (X) */}
        <div>
          <label htmlFor="player1" className="block text-sm font-medium mb-2">
            Player 1 (X)
          </label>
          <select
            id="player1"
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">Select a player</option>
            {sortedMembers.map((member) => (
              <option key={member.playerId} value={member.playerId}>
                {member.isReady ? '✅ ' : '⏸️ '}
                {member.player.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Player 2 (O) */}
        <div>
          <label htmlFor="player2" className="block text-sm font-medium mb-2">
            Player 2 (O)
          </label>
          <select
            id="player2"
            value={player2Id}
            onChange={(e) => setPlayer2Id(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">Select a player</option>
            {sortedMembers.map((member) => (
              <option key={member.playerId} value={member.playerId}>
                {member.isReady ? '✅ ' : '⏸️ '}
                {member.player.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-blue-400/10 border border-blue-400/20">
          <p className="text-sm text-text-secondary">
            ℹ️ Ready players are shown first
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !player1Id || !player2Id}
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
