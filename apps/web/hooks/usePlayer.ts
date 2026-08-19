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

    refreshPlayer()
      .then((profile) => {
        setPlayer(profile);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { player, error, isLoading, refresh };
}
