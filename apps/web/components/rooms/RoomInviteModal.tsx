'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { invitePlayers } from '@/lib/rooms';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  isOnline: boolean;
  inRoom?: boolean;
  roomName?: string | null;
}

interface RoomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  friends: Friend[];
  roomMemberIds?: string[];
  onSuccess: () => void;
}

export function RoomInviteModal({
  isOpen,
  onClose,
  roomId,
  friends,
  roomMemberIds = [],
  onSuccess,
}: RoomInviteModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (friendId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedIds(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedIds.size === 0) {
      setError('Please select at least one friend');
      return;
    }

    setIsSubmitting(true);

    try {
      await invitePlayers(roomId, {
        playerIds: Array.from(selectedIds),
      });

      onSuccess();
      onClose();

      // Reset
      setSelectedIds(new Set());
      setSearchQuery('');
    } catch (err) {
      console.error('Error sending invites:', err);
      setError('Failed to send invites. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends to Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search friends..."
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Friend List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredFriends.length === 0 ? (
            <p className="text-center text-text-muted py-4">No friends found</p>
          ) : (
            filteredFriends.map((friend) => {
              const isInThisRoom = roomMemberIds.includes(friend.id);
              const isDisabled = isInThisRoom;

              return (
                <label
                  key={friend.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-board-grid transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-accent-primary/50 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(friend.id)}
                    onChange={() => toggleSelection(friend.id)}
                    disabled={isDisabled}
                    className="w-4 h-4"
                    aria-label={friend.displayName}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{friend.displayName}</span>
                      <span
                        className={`text-xs ${
                          friend.isOnline ? 'text-accent-success' : 'text-text-muted'
                        }`}
                      >
                        ({friend.isOnline ? 'Online' : 'Offline'})
                      </span>
                    </div>
                    {friend.inRoom && friend.roomName && (
                      <p className="text-sm text-text-secondary mt-1">
                        🏠 In {friend.roomName}
                      </p>
                    )}
                    {isInThisRoom && (
                      <p className="text-sm text-text-muted mt-1">Already in this room</p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Selected Count */}
        <p className="text-sm text-text-secondary">
          {selectedIds.size} friend{selectedIds.size !== 1 ? 's' : ''} selected
        </p>

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
            disabled={isSubmitting || selectedIds.size === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send Invites'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
