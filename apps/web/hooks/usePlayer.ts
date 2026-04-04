'use client';

import { useEffect, useState } from 'react';
import { ensurePlayer, type PlayerProfile } from '@/lib/player';

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    ensurePlayer()
      .then((profile) => {
        if (!isMounted) return;
        setPlayer(profile);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { player, error, isLoading };
}
