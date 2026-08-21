'use client';

import { useEffect, useState, useCallback } from 'react';
import { refreshPlayer, type PlayerProfile } from '@/lib/player';

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Player data loading timed out');
    }, 5000); // 5 second timeout

    refreshPlayer()
      .then((profile) => {
        clearTimeout(timeoutId);
        setPlayer(profile);
        setIsLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('[usePlayer] Error:', err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { player, error, isLoading, refresh };
}
