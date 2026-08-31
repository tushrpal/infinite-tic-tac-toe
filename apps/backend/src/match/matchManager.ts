import type { ExpandingBoardState, Infinite3x3State } from '@infinite-ttt/game-engine';
import { getRedisClient, isRedisAvailable } from '../redis/redisClient';
import { getPrismaClient } from '../storage/prismaClient';

type Player = 'X' | 'O';
type GameMode = 'MODE_1' | 'MODE_2';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  position: Position;
  player: Player;
  timestamp: number;
  moveNumber: number;
  removedPosition?: Position;
}

export interface WinInfo {
  winner: Player;
  winningCells: Position[];
  winType: 'row' | 'column' | 'diagonal' | 'anti-diagonal';
}

export interface GameState {
  board: (Player | null)[][];
  boardSize: number;
  currentPlayer: Player;
  moveHistory: Move[];
  isGameOver: boolean;
  winner: Player | null;
  winInfo: WinInfo | null;
  isDraw: boolean;
  mode: GameMode;
  moveCount: number;
}

export interface PlayerInfo {
  id: string;
  username: string;
  rating?: number;
  rank?: string;
  avatar?: string;
  isConnected: boolean;
  isBot?: boolean;
  botType?: 'random' | 'heuristic' | 'minimax';
  botDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface MatchState {
  matchId: string;
  status: 'waiting' | 'active' | 'completed';
  mode: GameMode;
  isRanked: boolean;
  players: {
    X: PlayerInfo | null;
    O: PlayerInfo | null;
  };
  gameState: GameState;
  spectators: string[];
  spectatorCount: number;
  startedAt: number | null;
  rematchRequestedBy?: Player | null;
  isBotMatch?: boolean;
  botPlayer?: Player;
  botMultiplier?: number;
}

type EngineState = Infinite3x3State | ExpandingBoardState;

interface RedisMatchRecord {
  matchId: string;
  players: MatchState['players'];
  gameState: GameState;
  currentTurn: number;
  mode: GameMode;
  createdAt: number;
  status: MatchState['status'];
  isRanked: boolean;
  spectators: string[];
  spectatorCount: number;
  startedAt: number | null;
  rematchRequestedBy?: Player | null;
  engineState: EngineState;
}

export interface MatchSnapshot {
  matchState: MatchState;
  engineState: EngineState;
  currentTurn: number;
  createdAt: number;
}

const MATCH_KEY_PREFIX = 'match:';
const ACTIVE_SET_KEY = 'matches:active';

function getCurrentTurn(engineState: EngineState): number {
  return 'currentTurn' in engineState ? engineState.currentTurn : 0;
}

function toRecord(matchState: MatchState, engineState: EngineState, createdAt: number): RedisMatchRecord {
  const spectators = matchState.spectators ?? [];

  return {
    matchId: matchState.matchId,
    players: matchState.players,
    gameState: matchState.gameState,
    currentTurn: getCurrentTurn(engineState),
    mode: matchState.mode,
    createdAt,
    status: matchState.status,
    isRanked: matchState.isRanked,
    spectators,
    spectatorCount: matchState.spectatorCount ?? spectators.length,
    startedAt: matchState.startedAt,
    rematchRequestedBy: matchState.rematchRequestedBy,
    engineState,
  };
}

function toSnapshot(record: RedisMatchRecord): MatchSnapshot {
  const matchState: MatchState = {
    matchId: record.matchId,
    status: record.status,
    mode: record.mode,
    isRanked: record.isRanked,
    players: record.players,
    gameState: record.gameState,
    spectators: record.spectators ?? [],
    spectatorCount: record.spectatorCount ?? (record.spectators?.length ?? 0),
    startedAt: record.startedAt,
    rematchRequestedBy: record.rematchRequestedBy,
  };

  return {
    matchState,
    engineState: record.engineState,
    currentTurn: record.currentTurn,
    createdAt: record.createdAt,
  };
}

export class MatchManager {
  private readonly redis = getRedisClient();

  private key(matchId: string): string {
    return `${MATCH_KEY_PREFIX}${matchId}`;
  }

  private async saveSnapshot(snapshot: MatchSnapshot): Promise<void> {
    try {
      const prisma = getPrismaClient();

      // Save to PostgreSQL for persistence
      await prisma.activeMatch.upsert({
        where: { id: snapshot.matchState.matchId },
        update: {
          state: snapshot as any,
          status: snapshot.matchState.status,
          updatedAt: new Date(),
        },
        create: {
          id: snapshot.matchState.matchId,
          state: snapshot as any,
          mode: snapshot.matchState.mode,
          isRanked: snapshot.matchState.isRanked,
          status: snapshot.matchState.status,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      // Optionally use Redis for matchmaking queue (if available)
      if (await isRedisAvailable()) {
        try {
          if (snapshot.matchState.status === 'waiting' || snapshot.matchState.status === 'active') {
            await this.redis.sadd(ACTIVE_SET_KEY, snapshot.matchState.matchId);
          } else {
            await this.redis.srem(ACTIVE_SET_KEY, snapshot.matchState.matchId);
          }
        } catch (redisError) {
          // Redis is optional - continue without it
        }
      }
    } catch (error) {
      console.error('Failed to save match snapshot:', error);
      throw error; // Don't silently fail on database errors
    }
  }

  async createMatch(matchState: MatchState, engineState: EngineState): Promise<MatchSnapshot> {
    const snapshot: MatchSnapshot = {
      matchState,
      engineState,
      currentTurn: getCurrentTurn(engineState),
      createdAt: Date.now(),
    };

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async joinMatch(matchId: string, player: Player, playerInfo: PlayerInfo): Promise<MatchSnapshot | null> {
    const snapshot = await this.recoverMatch(matchId);
    if (!snapshot) return null;

    snapshot.matchState.players[player] = playerInfo;
    if (snapshot.matchState.players.X && snapshot.matchState.players.O) {
      snapshot.matchState.status = 'active';
    }

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async applyMove(matchId: string, updatedState: { matchState: MatchState; engineState: EngineState }): Promise<MatchSnapshot | null> {
    const snapshot = await this.recoverMatch(matchId);
    if (!snapshot) return null;

    snapshot.matchState = updatedState.matchState;
    snapshot.engineState = updatedState.engineState;
    snapshot.currentTurn = getCurrentTurn(updatedState.engineState);

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async getMatch(matchId: string): Promise<MatchSnapshot | null> {
    try {
      const prisma = getPrismaClient();
      const match = await prisma.activeMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) return null;
      return match.state as unknown as MatchSnapshot;
    } catch (error) {
      console.warn('Failed to get match from database:', error);
      return null;
    }
  }

  async recoverMatch(matchId: string): Promise<MatchSnapshot | null> {
    return this.getMatch(matchId);
  }

  async saveMatchState(matchState: MatchState, engineState: EngineState): Promise<MatchSnapshot> {
    const existing = await this.recoverMatch(matchState.matchId);

    const snapshot: MatchSnapshot = {
      matchState,
      engineState,
      currentTurn: getCurrentTurn(engineState),
      createdAt: existing?.createdAt ?? Date.now(),
    };

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async addSpectator(matchId: string, spectatorId: string): Promise<MatchSnapshot | null> {
    const snapshot = await this.recoverMatch(matchId);
    if (!snapshot) return null;

    const spectators = snapshot.matchState.spectators ?? [];
    if (!spectators.includes(spectatorId)) {
      spectators.push(spectatorId);
    }

    snapshot.matchState.spectators = spectators;
    snapshot.matchState.spectatorCount = spectators.length;

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async removeSpectator(matchId: string, spectatorId: string): Promise<MatchSnapshot | null> {
    const snapshot = await this.recoverMatch(matchId);
    if (!snapshot) return null;

    const spectators = (snapshot.matchState.spectators ?? []).filter((id) => id !== spectatorId);
    snapshot.matchState.spectators = spectators;
    snapshot.matchState.spectatorCount = spectators.length;

    await this.saveSnapshot(snapshot);
    return snapshot;
  }

  async endMatch(matchId: string): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.activeMatch.delete({
        where: { id: matchId },
      });

      // Clean up Redis if available
      if (await isRedisAvailable()) {
        try {
          await this.redis.del(this.key(matchId));
          await this.redis.srem(ACTIVE_SET_KEY, matchId);
        } catch (redisError) {
          // Redis cleanup is optional
        }
      }
    } catch (error) {
      console.warn('Failed to end match:', error);
      // Continue - match may already be deleted
    }
  }

  async findWaiting(mode: GameMode, isRanked: boolean): Promise<MatchSnapshot | null> {
    try {
      const prisma = getPrismaClient();
      const match = await prisma.activeMatch.findFirst({
        where: {
          status: 'waiting',
          mode,
          isRanked,
        },
        orderBy: { createdAt: 'asc' },
      });

      return match ? (match.state as unknown as MatchSnapshot) : null;
    } catch (error) {
      console.warn('Failed to find waiting match:', error);
      return null;
    }
  }

  async getActiveMatches(): Promise<MatchSnapshot[]> {
    try {
      const prisma = getPrismaClient();
      const matches = await prisma.activeMatch.findMany({
        where: {
          status: { in: ['waiting', 'active'] },
        },
      });

      return matches.map(m => m.state as unknown as MatchSnapshot);
    } catch (error) {
      console.warn('Failed to get active matches:', error);
      return [];
    }
  }

  async findActiveMatchByPlayer(playerId: string): Promise<MatchSnapshot | null> {
    const active = await this.getActiveMatches();
    return active.find((snapshot) => {
      const players = snapshot.matchState.players;
      return players.X?.id === playerId || players.O?.id === playerId;
    }) ?? null;
  }
}

export const matchManager = new MatchManager();
