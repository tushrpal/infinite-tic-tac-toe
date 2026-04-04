import type { GameResult, MatchResult } from '@infinite-ttt/shared';
import type { Prisma } from '@prisma/client';
import type { MatchStorage } from './MatchStorage';
import { getPrismaClient } from './prismaClient';

export class DbMatchStorage implements MatchStorage {
  async saveMatch(matchResult: MatchResult): Promise<void> {
    const prisma = getPrismaClient();
    const symbolPlayerMap = this.buildSymbolPlayerMap(matchResult);

    await prisma.$transaction(async (tx) => {
      for (const player of matchResult.players) {
        await tx.player.upsert({
          where: { id: player.id },
          update: {},
          create: { id: player.id },
        });
      }

      await tx.match.upsert({
        where: { id: matchResult.matchId },
        update: {
          mode: matchResult.mode,
          isRanked: matchResult.isRanked,
          difficulty: matchResult.difficulty,
          winner: matchResult.winner,
          roundsPlayed: matchResult.roundsPlayed,
          totalMoves: matchResult.totalMoves,
          drawCount: matchResult.drawCount,
          createdAtMs: BigInt(matchResult.createdAt),
          payload: matchResult as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: matchResult.matchId,
          mode: matchResult.mode,
          isRanked: matchResult.isRanked,
          difficulty: matchResult.difficulty,
          winner: matchResult.winner,
          roundsPlayed: matchResult.roundsPlayed,
          totalMoves: matchResult.totalMoves,
          drawCount: matchResult.drawCount,
          createdAtMs: BigInt(matchResult.createdAt),
          payload: matchResult as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.matchPlayer.deleteMany({ where: { matchId: matchResult.matchId } });
      if (matchResult.players.length > 0) {
        await tx.matchPlayer.createMany({
          data: matchResult.players.map((player) => ({
            matchId: matchResult.matchId,
            playerId: player.id,
            playerType: player.type,
          })),
          skipDuplicates: true,
        });
      }

      await tx.move.deleteMany({ where: { matchId: matchResult.matchId } });
      const moveRows = matchResult.games.flatMap((game, gameIndex) =>
        game.moves.map((move) => ({
          matchId: matchResult.matchId,
          gameIndex,
          index: move.index,
          playerId: this.resolveMovePlayerId(matchResult.matchId, move.player, symbolPlayerMap),
          playerSymbol: move.player,
          turn: move.turn,
          timestampMs: move.timestamp != null ? BigInt(move.timestamp) : null,
          gameWinner: game.winner,
          gameTotalMoves: game.totalMoves,
          gameBoardSize: game.boardSize,
        })),
      );

      if (moveRows.length > 0) {
        await tx.move.createMany({ data: moveRows });
      }
    });
  }

  async getMatch(matchId: string): Promise<MatchResult | null> {
    const prisma = getPrismaClient();
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: true,
        moves: {
          orderBy: [{ gameIndex: 'asc' }, { turn: 'asc' }],
        },
      },
    });

    if (!match) {
      return null;
    }

    return this.mapDbMatchToMatchResult(match);
  }

  async getMatches(): Promise<MatchResult[]> {
    const prisma = getPrismaClient();
    const matches = await prisma.match.findMany({
      include: {
        players: true,
        moves: {
          orderBy: [{ gameIndex: 'asc' }, { turn: 'asc' }],
        },
      },
      orderBy: { createdAtMs: 'desc' },
    });

    return matches.map((match) => this.mapDbMatchToMatchResult(match));
  }

  private mapDbMatchToMatchResult(match: {
    id: string;
    mode: string;
    isRanked: boolean;
    difficulty: string;
    winner: string | null;
    roundsPlayed: number;
    totalMoves: number;
    drawCount: number;
    createdAtMs: bigint;
    payload: Prisma.JsonValue;
    players: Array<{ playerId: string; playerType: string }>;
    moves: Array<{
      gameIndex: number;
      index: number;
      playerId?: string;
      playerSymbol: string;
      turn: number;
      timestampMs: bigint | null;
      gameWinner: string | null;
      gameTotalMoves: number;
      gameBoardSize: number;
    }>;
  }): MatchResult {
    // Use canonical payload when available to preserve exact shape during migration.
    if (this.isMatchResultPayload(match.payload)) {
      return match.payload as unknown as MatchResult;
    }

    const gameMap = new Map<number, GameResult>();
    for (const move of match.moves) {
      const existing = gameMap.get(move.gameIndex);
      if (!existing) {
        gameMap.set(move.gameIndex, {
          winner: this.toWinnerSymbol(move.gameWinner),
          totalMoves: move.gameTotalMoves,
          boardSize: move.gameBoardSize,
          moves: [],
        });
      }

      const game = gameMap.get(move.gameIndex)!;
      game.moves.push({
        index: move.index,
        player: move.playerSymbol === 'X' ? 'X' : 'O',
        turn: move.turn,
        timestamp: move.timestampMs != null ? Number(move.timestampMs) : undefined,
      });
    }

    const games = [...gameMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, game]) => game);

    return {
      matchId: match.id,
      mode: match.mode as MatchResult['mode'],
      isRanked: match.isRanked,
      difficulty: match.difficulty as MatchResult['difficulty'],
      players: match.players.map((player) => ({
        id: player.playerId,
        type: player.playerType === 'human' ? 'human' : 'bot',
      })),
      games,
      winner: match.winner,
      roundsPlayed: match.roundsPlayed,
      totalMoves: match.totalMoves,
      drawCount: match.drawCount,
      createdAt: Number(match.createdAtMs),
    };
  }

  private isMatchResultPayload(payload: Prisma.JsonValue): payload is Prisma.JsonObject {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return false;
    }

    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.matchId === 'string' &&
      typeof candidate.mode === 'string' &&
      typeof candidate.isRanked === 'boolean' &&
      Array.isArray(candidate.players) &&
      Array.isArray(candidate.games)
    );
  }

  private toWinnerSymbol(value: string | null): 'X' | 'O' | null {
    if (value === 'X' || value === 'O') {
      return value;
    }

    return null;
  }

  private buildSymbolPlayerMap(matchResult: MatchResult): Record<'X' | 'O', string | undefined> {
    // MatchResult is frozen and does not require symbol->id mapping in players.
    // Prefer optional runtime symbol metadata when present, then fall back to [X, O] order.
    const players = matchResult.players as Array<MatchResult['players'][number] & { symbol?: 'X' | 'O' }>;

    let xPlayerId = players.find((player) => player.symbol === 'X')?.id;
    let oPlayerId = players.find((player) => player.symbol === 'O')?.id;

    if (!xPlayerId && !oPlayerId) {
      xPlayerId = players[0]?.id;
      oPlayerId = players[1]?.id;
    }

    return {
      X: xPlayerId,
      O: oPlayerId,
    };
  }

  private resolveMovePlayerId(
    matchId: string,
    playerSymbol: 'X' | 'O',
    symbolPlayerMap: Record<'X' | 'O', string | undefined>,
  ): string {
    const playerId = symbolPlayerMap[playerSymbol];
    if (playerId) {
      return playerId;
    }

    // Keep persistence non-breaking for legacy/partial payloads.
    return `unknown:${matchId}:${playerSymbol}`;
  }
}
