import { getPrismaClient } from '../storage/prismaClient';
import { isReplayAvailable } from '../jobs/replayRetention';

type MatchResultSummary = 'win' | 'loss' | 'draw';

type PlayerMatchSummary = {
  matchId: string;
  result: MatchResultSummary;
  ratingChange: number;
  createdAt: number;
  mode: string;
  isRanked: boolean;
  isBotMatch: boolean;
  hasReplay: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  opponentUsername?: string;
  opponentDisplayName?: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

export async function getPlayerMatches(playerId: string, limit?: number): Promise<PlayerMatchSummary[]> {
  const prisma = getPrismaClient();
  const take = normalizeLimit(limit);

  const matchPlayers = await prisma.matchPlayer.findMany({
    where: { playerId },
    select: {
      matchId: true,
      ratingChange: true,
      playerType: true,
      match: {
        select: {
          winner: true,
          createdAtMs: true,
          mode: true,
          isRanked: true,
          difficulty: true,
          replayStripped: true,
          _count: { select: { moves: true } },
          players: {
            select: {
              playerId: true,
              playerType: true,
              player: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      match: {
        createdAtMs: 'desc',
      },
    },
    take,
  });

  return matchPlayers.map((matchPlayer) => {
    const winnerId = matchPlayer.match?.winner ?? null;
    let result: MatchResultSummary = 'draw';

    if (winnerId) {
      result = winnerId === playerId ? 'win' : 'loss';
    }

    const opponent = matchPlayer.match?.players?.find(
      (p) => p.playerId !== playerId,
    );

    const isBotMatch = opponent?.playerType === 'bot' ||
                       (opponent?.player?.username?.startsWith('bot-') ?? false);
    const difficulty = matchPlayer.match?.difficulty;
    const botDifficulty = isBotMatch && difficulty ? (difficulty as 'easy' | 'medium' | 'hard') : undefined;
    const moveCount = matchPlayer.match?._count.moves ?? 0;
    const hasReplay = isReplayAvailable(
      null,
      moveCount,
      matchPlayer.match?.replayStripped ?? false,
    );

    return {
      matchId: matchPlayer.matchId,
      result,
      ratingChange: matchPlayer.ratingChange ?? 0,
      createdAt: Number(matchPlayer.match?.createdAtMs ?? 0n),
      mode: matchPlayer.match?.mode ?? 'mode1',
      isRanked: matchPlayer.match?.isRanked ?? false,
      isBotMatch,
      hasReplay,
      botDifficulty,
      opponentUsername: opponent?.player?.username,
      opponentDisplayName: opponent?.player?.displayName ?? undefined,
    };
  });
}
