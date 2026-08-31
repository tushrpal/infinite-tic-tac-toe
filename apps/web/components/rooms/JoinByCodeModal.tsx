'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { joinRoomByCode } from '@/lib/rooms';

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinByCodeModal({ isOpen, onClose }: JoinByCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const room = await joinRoomByCode(code.trim().toUpperCase());
      onClose();
      router.push(`/rooms/${room.id}`);
    } catch (err: any) {
      console.error('Error joining room by code:', err);
      if (err.message?.includes('404')) {
        setError('Room not found with that code');
      } else if (err.message?.includes('409')) {
        setError('Room is full or closed');
      } else {
        setError('Failed to join room. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room by Code">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="room-code" className="block text-sm font-medium mb-2">
            Enter Room Code
          </label>
          <input
            id="room-code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-board-grid focus:border-accent-primary focus:outline-none transition-colors text-center text-2xl font-mono font-bold tracking-widest uppercase"
            autoFocus
          />
          <p className="mt-2 text-xs text-text-muted">
            Enter the 6-character code shared by your friend
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

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
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
