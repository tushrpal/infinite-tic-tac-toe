import { getPrismaClient } from '../storage/prismaClient';

type PlayerProfileStats = {
  playerId: string;
  displayName: string | null;
  rating: number;
  createdAt: Date;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

function computeWinRate(wins: number, matchesPlayed: number): number {
  if (matchesPlayed <= 0) {
    return 0;
  }

  return (wins / matchesPlayed) * 100;
}

export async function getPlayerProfile(playerId: string): Promise<PlayerProfileStats | null> {
  const prisma = getPrismaClient();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      displayName: true,
      rating: true,
      createdAt: true,
    },
  });

  if (!player) {
    return null;
  }

  const matchPlayers = await prisma.matchPlayer.findMany({
    where: { playerId },
    select: {
      match: {
        select: {
          winner: true,
        },
      },
    },
  });

  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const matchPlayer of matchPlayers) {
    const winnerId = matchPlayer.match?.winner ?? null;
    if (!winnerId) {
      draws += 1;
    } else if (winnerId === playerId) {
      wins += 1;
    } else {
      losses += 1;
    }
  }

  const matchesPlayed = matchPlayers.length;
  const winRate = computeWinRate(wins, matchesPlayed);

  return {
    playerId: player.id,
    displayName: player.displayName,
    rating: player.rating,
    createdAt: player.createdAt,
    matchesPlayed,
    wins,
    losses,
    draws,
    winRate,
  };
}
