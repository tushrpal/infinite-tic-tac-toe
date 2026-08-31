'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface RoomCodeDisplayProps {
  code: string;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-surface-elevated border border-board-grid">
      <div className="text-sm text-text-secondary mb-2">Room Code</div>
      <div className="flex items-center gap-3">
        <div className="flex-1 px-4 py-3 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
          <div className="text-2xl font-mono font-bold tracking-wider text-accent-primary text-center">
            {code}
          </div>
        </div>
        <Button onClick={handleCopy} variant="secondary" size="sm">
          {copied ? '✓ Copied' : '📋 Copy'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Share this code with friends to let them join
      </p>
    </div>
  );
}
