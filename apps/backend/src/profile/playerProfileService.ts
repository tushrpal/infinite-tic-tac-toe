import { getPrismaClient } from '../storage/prismaClient';

type PlayerProfileStats = {
  playerId: string;
  username: string | null;
  displayName: string | null;
  rating: number;
  ratingMode1: number;
  ratingMode2: number;
  createdAt: Date;
  isAnonymous: boolean;
  oauthProvider: string | null;
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
      isAnonymous: true,
      oauthProvider: true,
    },
  });

  if (!player) {
    return null;
  }

  const [statsRow] = await prisma.$queryRaw<
    Array<{ wins: bigint; losses: bigint; draws: bigint; total: bigint }>
  >`
    SELECT
      COUNT(*) FILTER (WHERE m."winner" = ${playerId}) AS wins,
      COUNT(*) FILTER (WHERE m."winner" IS NOT NULL AND m."winner" != ${playerId}) AS losses,
      COUNT(*) FILTER (WHERE m."winner" IS NULL) AS draws,
      COUNT(*) AS total
    FROM "MatchPlayer" mp
    INNER JOIN "Match" m ON m."id" = mp."matchId"
    WHERE mp."playerId" = ${playerId}
  `;

  const wins = Number(statsRow?.wins ?? 0n);
  const losses = Number(statsRow?.losses ?? 0n);
  const draws = Number(statsRow?.draws ?? 0n);
  const matchesPlayed = Number(statsRow?.total ?? 0n);
  const winRate = computeWinRate(wins, matchesPlayed);

  return {
    playerId: player.id,
    username: player.username,
    displayName: player.displayName,
    rating: player.ratingMode1 + player.ratingMode2,
    ratingMode1: player.ratingMode1,
    ratingMode2: player.ratingMode2,
    createdAt: player.createdAt,
    isAnonymous: player.isAnonymous,
    oauthProvider: player.oauthProvider,
    matchesPlayed,
    wins,
    losses,
    draws,
    winRate,
  };
}
