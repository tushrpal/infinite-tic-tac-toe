'use client';

import { useState, useEffect } from 'react';
import { useWebSocket, useSocketEvent } from './useWebSocket';
import {
  adaptMatchResult,
  adaptMatchState,
  type MatchResultUIState,
  type MatchUIState,
} from '@/lib/adapters/gameAdapter';
import type { MatchState } from '@/ws/types';

interface UseSpectatorMatchOptions {
  matchId: string;
}

interface UseSpectatorMatchReturn {
  matchState: MatchUIState | null;
  rawMatchState: MatchState | null;
  result: MatchResultUIState | null;
  isLoading: boolean;
  error: string | null;
}

export function useSpectatorMatch(
  options: UseSpectatorMatchOptions,
): UseSpectatorMatchReturn {
  const { matchId } = options;
  const { socket, isConnected } = useWebSocket();

  const [rawMatchState, setRawMatchState] = useState<MatchState | null>(null);
  const [result, setResult] = useState<MatchResultUIState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !matchId) {
      return;
    }

    setIsLoading(true);
    const joined = socket.spectateMatch(matchId);
    if (!joined) {
      setError('Unable to join spectator session');
      setIsLoading(false);
    }

    return () => {
      socket.stopSpectating(matchId);
    };
  }, [isConnected, matchId, socket]);

  useSocketEvent(
    'MATCH_JOINED',
    (payload) => {
      if (payload.matchState.matchId !== matchId) return;
      setRawMatchState(payload.matchState);
      setError(null);
      setIsLoading(false);
    },
    [matchId],
  );

  useSocketEvent(
    'GAME_STATE_UPDATE',
    (payload) => {
      if (payload.matchId !== matchId) return;
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gameState: payload.gameState,
        };
      });
      setIsLoading(false);
    },
    [matchId],
  );

  useSocketEvent(
    'MATCH_END',
    (payload) => {
      if (payload.matchId !== matchId) return;

      setResult(adaptMatchResult(payload.result, null));
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'completed',
          gameState: payload.finalGameState,
        };
      });
      setIsLoading(false);
    },
    [matchId],
  );

  useSocketEvent(
    'SPECTATOR_JOINED',
    (payload) => {
      if (payload.matchId !== matchId) return;
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          spectatorCount: payload.spectatorCount,
        };
      });
    },
    [matchId],
  );

  useSocketEvent(
    'SPECTATOR_LEFT',
    (payload) => {
      if (payload.matchId !== matchId) return;
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          spectatorCount: payload.spectatorCount,
        };
      });
    },
    [matchId],
  );

  useSocketEvent(
    'ERROR',
    (payload) => {
      if (!rawMatchState) {
        setError(payload.message);
        setIsLoading(false);
      }
    },
    [rawMatchState],
  );

  return {
    matchState: rawMatchState ? adaptMatchState(rawMatchState, null) : null,
    rawMatchState,
    result,
    isLoading,
    error,
  };
}

export default useSpectatorMatch;
