import { getPrismaClient } from '../storage/prismaClient';

type PlayerProfileStats = {
  playerId: string;
  username: string | null;
  displayName: string | null;
  rating: number; // Combined rating (sum of both modes)
  ratingMode1: number;
  ratingMode2: number;
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
      username: true,
      displayName: true,
      ratingMode1: true,
      ratingMode2: true,
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
    username: player.username,
    displayName: player.displayName,
    rating: player.ratingMode1 + player.ratingMode2, // Combined rating
    ratingMode1: player.ratingMode1,
    ratingMode2: player.ratingMode2,
    createdAt: player.createdAt,
    matchesPlayed,
    wins,
    losses,
    draws,
    winRate,
  };
}
