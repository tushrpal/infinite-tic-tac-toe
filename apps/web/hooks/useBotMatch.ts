'use client';

/**
 * useBotMatch Hook
 * Manages bot match UI state and indicators
 */

import { useMemo } from 'react';
import type { Player } from '@/ws/types';

interface BotMatchInfo {
  isBotMatch: boolean;
  botPlayer: Player | null;
  botDifficulty: 'easy' | 'medium' | 'hard' | null;
  botType: 'random' | 'heuristic' | 'minimax' | null;
  isBotThinking: boolean;
  opponentName: string;
}

interface UseBotMatchOptions {
  matchState: any; // MatchUIState from gameAdapter
  yourPlayer: Player | null;
}

/**
 * Hook to manage bot match state and provide UI indicators
 *
 * Usage:
 * ```tsx
 * const botInfo = useBotMatch({ matchState, yourPlayer });
 *
 * if (botInfo.isBotMatch) {
 *   return <div>Playing against {botInfo.opponentName} ({botInfo.botDifficulty})</div>
 * }
 * ```
 */
export function useBotMatch({ matchState, yourPlayer }: UseBotMatchOptions): BotMatchInfo {
  return useMemo(() => {
    // Default state
    if (!matchState || !yourPlayer) {
      return {
        isBotMatch: false,
        botPlayer: null,
        botDifficulty: null,
        botType: null,
        isBotThinking: false,
        opponentName: 'Opponent',
      };
    }

    // Determine opponent player
    const opponentPlayer: Player = yourPlayer === 'X' ? 'O' : 'X';

    // Get opponent info from score (which contains player info)
    const opponentInfo = matchState.score[opponentPlayer];
    const opponentName = opponentInfo?.name || 'Opponent';

    // Check if this is a bot match
    const isBotMatch = opponentInfo?.isBot === true;
    const botDifficulty = opponentInfo?.botDifficulty || null;
    const botType = opponentInfo?.botType || null;

    // Determine if bot is thinking (it's the bot's turn and game is not over)
    const isBotThinking =
      isBotMatch &&
      !matchState.isGameOver &&
      matchState.turn?.currentPlayer === opponentPlayer;

    return {
      isBotMatch,
      botPlayer: isBotMatch ? opponentPlayer : null,
      botDifficulty,
      botType,
      isBotThinking,
      opponentName,
    };
  }, [matchState, yourPlayer]);
}

export default useBotMatch;
