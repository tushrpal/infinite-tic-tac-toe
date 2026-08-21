'use client';

/**
 * useGameState Hook
 * Manages game state for a match, driven entirely by server events
 */

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket, useSocketEvent } from './useWebSocket';
import { adaptMatchState, adaptMatchResult, type MatchUIState, type MatchResultUIState } from '@/lib/adapters/gameAdapter';
import { getStoredPlayerId } from '@/lib/player';
import type { MatchState, Player, Position, GameState, MatchResult, Move } from '@/ws/types';

interface UseGameStateOptions {
  matchId: string;
  onMatchEnd?: (result: MatchResultUIState) => void;
  onMoveRejected?: (reason: string) => void;
  onOpponentDisconnected?: (reconnectTimeout: number) => void;
  onOpponentReconnected?: () => void;
  onReconnected?: () => void;
  onRematchStarting?: (newMatchId: string) => void;
}

interface UseGameStateReturn {
  matchState: MatchUIState | null;
  result: MatchResultUIState | null;
  yourPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  makeMove: (position: Position) => void;
  forfeit: () => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;
  rematchRequested: boolean;
  opponentRequestedRematch: boolean;
}

// Get playerId from localStorage for reconnection
function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  return getStoredPlayerId() || '';
}

export function useGameState(options: UseGameStateOptions): UseGameStateReturn {
  const { matchId, onMatchEnd, onMoveRejected, onOpponentDisconnected, onOpponentReconnected, onReconnected, onRematchStarting } = options;
  
  const { socket, isConnected } = useWebSocket();
  
  const [rawMatchState, setRawMatchState] = useState<MatchState | null>(null);
  const [yourPlayer, setYourPlayer] = useState<Player | null>(null);
  const [result, setResult] = useState<MatchResultUIState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRequestedRematch, setOpponentRequestedRematch] = useState(false);

  // Check for pending match data (from MATCH_FOUND before navigation)
  useEffect(() => {
    const pendingMatch = socket.getPendingMatch(matchId);
    if (pendingMatch) {
      setRawMatchState(pendingMatch.matchState);
      setYourPlayer(pendingMatch.yourPlayer);
      setIsLoading(false);
      setError(null);
    }
  }, [socket, matchId]);

  // ALWAYS join match to register this WebSocket with the server
  // This ensures the server knows which connection belongs to which player
  useEffect(() => {
    if (isConnected && matchId) {
      const playerId = getPlayerId();
      if (playerId) {
        console.log('[useGameState] Joining match to register connection', { matchId, playerId: playerId.slice(0, 12) });
        socket.joinMatch(matchId, playerId);
        socket.setActiveMatch(matchId);
      }
    }

    return () => {
      if (matchId) {
        socket.leaveMatch(matchId);
        socket.setActiveMatch(null);
      }
    };
  }, [isConnected, matchId, socket]);

  // Handle match found (when initially matched)
  useSocketEvent('MATCH_FOUND', (payload) => {
    if (payload.matchId === matchId) {
      setRawMatchState(payload.matchState);
      setYourPlayer(payload.yourPlayer);
      setIsLoading(false);
      setError(null);
    }
  }, [matchId]);

  // Handle match joined (for reconnection)
  useSocketEvent('MATCH_JOINED', (payload) => {
    if (payload.matchState.matchId === matchId) {
      setRawMatchState(payload.matchState);
      setYourPlayer(payload.yourPlayer);
      setIsLoading(false);
      setError(null);
    }
  }, [matchId]);

  // Handle RECONNECTED (server confirmed reconnection)
  useSocketEvent('RECONNECTED', (payload) => {
    if (payload.matchId === matchId) {
      setYourPlayer(payload.role);
      setIsLoading(false);
      setError(null);
      console.log(`[useGameState] Reconnected to match ${matchId} as ${payload.role}`);
      onReconnected?.();
    }
  }, [matchId, onReconnected]);

  // Handle game state updates
  useSocketEvent('GAME_STATE_UPDATE', (payload) => {
    if (payload.matchId === matchId) {
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gameState: payload.gameState,
        };
      });
    }
  }, [matchId]);

  // Handle move updates (delta updates for performance)
  useSocketEvent('MOVE_UPDATE', (payload) => {
    if (payload.matchId === matchId) {
      setRawMatchState((prev) => {
        if (!prev) return prev;

        // Apply move to board
        const newBoard = prev.gameState.board.map(row => [...row]);
        newBoard[payload.position.row][payload.position.col] = payload.player;

        // Handle removed position (for sliding rule)
        if (payload.removedPosition) {
          newBoard[payload.removedPosition.row][payload.removedPosition.col] = null;
        }

        // Create move entry
        const newMove: Move = {
          position: payload.position,
          player: payload.player,
          timestamp: Date.now(),
          moveNumber: payload.moveNumber,
          removedPosition: payload.removedPosition,
        };

        // Update game state
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            board: newBoard,
            currentPlayer: payload.player === 'X' ? 'O' : 'X', // Toggle player
            moveHistory: [...prev.gameState.moveHistory, newMove],
            moveCount: payload.moveNumber,
            isGameOver: payload.isGameOver,
            winner: payload.winner,
            winInfo: payload.winInfo,
            isDraw: payload.isDraw,
          },
        };
      });
    }
  }, [matchId]);

  // Handle move rejected
  useSocketEvent('MOVE_REJECTED', (payload) => {
    if (payload.matchId === matchId) {
      onMoveRejected?.(payload.reason);
    }
  }, [matchId, onMoveRejected]);

  // Handle match end
  useSocketEvent('MATCH_END', (payload) => {
    if (payload.matchId === matchId) {
      const resultUI = adaptMatchResult(payload.result, yourPlayer);
      setResult(resultUI);
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'completed',
          gameState: payload.finalGameState,
        };
      });
      onMatchEnd?.(resultUI);
    }
  }, [matchId, yourPlayer, onMatchEnd]);

  // Handle player disconnected
  useSocketEvent('PLAYER_DISCONNECTED', (payload) => {
    if (payload.matchId === matchId) {
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [payload.player]: prev.players[payload.player]
              ? { ...prev.players[payload.player]!, isConnected: false }
              : null,
          },
        };
      });
      onOpponentDisconnected?.(payload.reconnectTimeout);
    }
  }, [matchId, onOpponentDisconnected]);

  // Handle player reconnected
  useSocketEvent('PLAYER_RECONNECTED', (payload) => {
    if (payload.matchId === matchId) {
      setRawMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [payload.player]: prev.players[payload.player]
              ? { ...prev.players[payload.player]!, isConnected: true }
              : null,
          },
        };
      });
      onOpponentReconnected?.();
    }
  }, [matchId, onOpponentReconnected]);

  // Handle rematch events
  useSocketEvent('REMATCH_REQUESTED', (payload) => {
    if (payload.matchId === matchId) {
      if (payload.requestedBy !== yourPlayer) {
        setOpponentRequestedRematch(true);
      }
    }
  }, [matchId, yourPlayer]);

  useSocketEvent('REMATCH_STARTING', (payload) => {
    // Store the new match data for the new page to pick up
    socket.setPendingMatch({
      matchId: payload.newMatchId,
      yourPlayer: payload.yourPlayer,
      matchState: payload.matchState,
    });
    
    setRematchRequested(false);
    setOpponentRequestedRematch(false);
    
    // Navigate to new match
    onRematchStarting?.(payload.newMatchId);
  }, [socket, onRematchStarting]);

  useSocketEvent('REMATCH_DECLINED', (payload) => {
    if (payload.matchId === matchId) {
      setRematchRequested(false);
      setOpponentRequestedRematch(false);
    }
  }, [matchId]);

  // Handle errors
  useSocketEvent('ERROR', (payload) => {
    setError(payload.message);
    setIsLoading(false);
  }, []);

  // Actions
  const makeMove = useCallback((position: Position) => {
    console.log('[useGameState] makeMove called', { position, rawMatchState, isGameOver: rawMatchState?.gameState?.isGameOver });
    if (rawMatchState?.gameState && !rawMatchState.gameState.isGameOver) {
      const sent = socket.makeMove(position);
      console.log('[useGameState] socket.makeMove result:', sent);
    } else {
      console.log('[useGameState] Move blocked - no game state or game over');
    }
  }, [socket, rawMatchState]);

  const forfeit = useCallback(() => {
    socket.forfeit(matchId);
  }, [socket, matchId]);

  const requestRematch = useCallback(() => {
    socket.requestRematch(matchId);
    setRematchRequested(true);
  }, [socket, matchId]);

  const acceptRematch = useCallback(() => {
    socket.acceptRematch(matchId);
  }, [socket, matchId]);

  const declineRematch = useCallback(() => {
    socket.declineRematch(matchId);
    setOpponentRequestedRematch(false);
  }, [socket, matchId]);

  // Compute UI state
  const matchState = rawMatchState ? adaptMatchState(rawMatchState, yourPlayer) : null;

  return {
    matchState,
    result,
    yourPlayer,
    isLoading,
    error,
    makeMove,
    forfeit,
    requestRematch,
    acceptRematch,
    declineRematch,
    rematchRequested,
    opponentRequestedRematch,
  };
}

export default useGameState;
