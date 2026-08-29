'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createRoom } from '@/lib/rooms';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<1 | 2 | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (name.length > 50) {
      newErrors.name = 'Room name must be 50 characters or less';
    }

    if (!mode) {
      newErrors.mode = 'Please select a game mode';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await createRoom({
        name: name.trim() || null,
        mode: mode!,
        maxPlayers,
      });

      onSuccess(room.id);
      onClose();

      // Reset form
      setName('');
      setMode(null);
      setMaxPlayers(4);
    } catch (error) {
      console.error('Error creating room:', error);
      setErrors({ submit: 'Failed to create room. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <div>
          <label htmlFor="room-name" className="block text-sm font-medium mb-2">
            Room Name (optional)
          </label>
          <input
            id="room-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Epic Battles, Chill Games, etc."
            maxLength={50}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-critical">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            Leave empty to use &quot;[Your Name]&apos;s Room&quot;
          </p>
        </div>

        {/* Game Mode */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Game Mode <span className="text-critical">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-board-grid hover:border-accent-primary/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="mode"
                value="1"
                checked={mode === 1}
                onChange={() => setMode(1)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">⚡ Sliding (MODE_1)</div>
                <div className="text-sm text-text-secondary">
                  Marks slide after 3 placed
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-board-grid hover:border-accent-primary/50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="mode"
                value="2"
                checked={mode === 2}
                onChange={() => setMode(2)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">🎯 Classic (MODE_2)</div>
                <div className="text-sm text-text-secondary">
                  Traditional tic-tac-toe
                </div>
              </div>
            </label>
          </div>
          {errors.mode && (
            <p className="mt-1 text-sm text-critical">{errors.mode}</p>
          )}
        </div>

        {/* Max Players */}
        <div>
          <label htmlFor="max-players" className="block text-sm font-medium mb-2">
            Max Players
          </label>
          <select
            id="max-players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num}>
                {num} players
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
          <p className="text-sm text-text-secondary">
            🔒 Only your friends can see and join this room
          </p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{errors.submit}</p>
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
            disabled={isSubmitting || !mode}
          >
            {isSubmitting ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
