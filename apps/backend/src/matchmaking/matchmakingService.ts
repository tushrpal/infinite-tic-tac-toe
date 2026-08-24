import { Modes, getNextPlayer, type ExpandingBoardState, type Infinite3x3State } from '@infinite-ttt/game-engine';
import { matchManager, type MatchState, type PlayerInfo } from '../match/matchManager';
import { getRedisClient } from '../redis/redisClient';
import { resolveForRank, getBotDisplayName } from '@infinite-ttt/bots';
import { botController } from '../bots/botController';
import { v4 as uuidv4 } from 'uuid';

type Player = 'X' | 'O';
type GameMode = 'MODE_1' | 'MODE_2';
type EngineState = Infinite3x3State | ExpandingBoardState;

interface Position {
  row: number;
  col: number;
}

interface Move {
  position: Position;
  player: Player;
  timestamp: number;
  moveNumber: number;
  removedPosition?: Position;
}

interface WinInfo {
  winner: Player;
  winningCells: Position[];
  winType: 'row' | 'column' | 'diagonal' | 'anti-diagonal';
}

interface GameState {
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

interface RankedQueueEntry {
  playerId: string;
  mode: GameMode;
  rating: number;
  joinedAt: number;
  username: string;
  lastBotOfferAt?: number; // Track when we last offered a bot match
}

interface QueueJoinOptions {
  rating?: number;
  username?: string;
}

interface QueueJoinResult {
  position: number;
  estimatedWait: number;
}

interface RankedMatchFoundEvent {
  matchId: string;
  matchState: MatchState;
  engineState: EngineState;
  playerX: RankedQueueEntry;
  playerO: RankedQueueEntry;
}

interface BotMatchOfferEvent {
  playerId: string;
  mode: GameMode;
  botDifficulty: 'easy' | 'medium' | 'hard';
  botType: 'random' | 'heuristic' | 'minimax';
  waitedMs: number;
  offerCount: number;
}

type MatchFoundHandler = (event: RankedMatchFoundEvent) => void;
type BotOfferHandler = (event: BotMatchOfferEvent) => void;

const DEFAULT_RATING = 1200;
const BASE_RATING_THRESHOLD = 100;
const MAX_RATING_THRESHOLD = 700;
const THRESHOLD_STEP = 50;
const THRESHOLD_STEP_MS = 15_000;
const BOT_FALLBACK_TIMEOUT_MS = 30_000; // 30 seconds
const BOT_RATING_MULTIPLIER = 0.6;

function queueModeSegment(mode: GameMode): string {
  return mode === 'MODE_1' ? 'mode1' : 'mode2';
}

function queueKey(mode: GameMode): string {
  return `queue:${queueModeSegment(mode)}:ranked`;
}

function queueDataKey(mode: GameMode): string {
  return `queue:${queueModeSegment(mode)}:ranked:data`;
}

function playerIndexKey(playerId: string): string {
  return `queue:ranked:player:${playerId}`;
}

function initEngineState(mode: GameMode): EngineState {
  if (mode === 'MODE_1') {
    return Modes.Infinite3x3.createInitialState();
  }
  return Modes.ExpandingBoard.createInitialState();
}

function isMode1(state: EngineState): state is Infinite3x3State {
  return 'playerMarks' in state;
}

function inferWinType(cells: Position[]): 'row' | 'column' | 'diagonal' | 'anti-diagonal' {
  if (cells.every((c) => c.row === cells[0].row)) return 'row';
  if (cells.every((c) => c.col === cells[0].col)) return 'column';
  if (cells.every((c, i) => c.row === i && c.col === i)) return 'diagonal';
  return 'anti-diagonal';
}

function findWinningLine(board: (Player | null)[][]): WinInfo | null {
  const size = board.length;

  for (let r = 0; r < size; r++) {
    const cells = Array.from({ length: size }, (_, c) => ({ row: r, col: c }));
    if (board[r][0] && cells.every((c) => board[c.row][c.col] === board[r][0])) {
      return { winner: board[r][0]!, winningCells: cells, winType: 'row' };
    }
  }

  for (let c = 0; c < size; c++) {
    const cells = Array.from({ length: size }, (_, r) => ({ row: r, col: c }));
    if (board[0][c] && cells.every((pos) => board[pos.row][pos.col] === board[0][c])) {
      return { winner: board[0][c]!, winningCells: cells, winType: 'column' };
    }
  }

  const diag = Array.from({ length: size }, (_, i) => ({ row: i, col: i }));
  if (board[0][0] && diag.every((c) => board[c.row][c.col] === board[0][0])) {
    return { winner: board[0][0], winningCells: diag, winType: 'diagonal' };
  }

  const antiDiag = Array.from({ length: size }, (_, i) => ({ row: i, col: size - 1 - i }));
  if (board[0][size - 1] && antiDiag.every((c) => board[c.row][c.col] === board[0][size - 1])) {
    return { winner: board[0][size - 1]!, winningCells: antiDiag, winType: 'anti-diagonal' };
  }

  return null;
}

function engineToWireState(engineState: EngineState, mode: GameMode): GameState {
  if (isMode1(engineState)) {
    const board = engineState.board.map((row) => [...row]) as (Player | null)[][];
    const currentPlayer = getNextPlayer(engineState.currentTurn);
    const isGameOver = engineState.winner !== null;
    const winInfo = engineState.winner ? findWinningLine(board) : null;

    const moveHistory: Move[] = engineState.moveHistory.map((m, i) => ({
      position: m.position,
      player: m.player,
      timestamp: Date.now(),
      moveNumber: i + 1,
    }));

    return {
      board,
      boardSize: 3,
      currentPlayer,
      moveHistory,
      isGameOver,
      winner: engineState.winner,
      winInfo,
      isDraw: false,
      mode,
      moveCount: engineState.currentTurn,
    };
  }

  const state = engineState as ExpandingBoardState;
  const board = state.board.map((row) => [...row]) as (Player | null)[][];
  const currentPlayer = getNextPlayer(state.currentTurn);
  const isDraw = !state.roundWinner && board.every((row) => row.every((cell) => cell !== null));
  const isGameOver = state.roundWinner !== null || isDraw;

  let winInfo: WinInfo | null = null;
  if (state.roundWinner && state.winningLine) {
    winInfo = { winner: state.roundWinner, winningCells: state.winningLine, winType: inferWinType(state.winningLine) };
  }

  const moveHistory: Move[] = state.moveHistory.map((m, i) => ({
    position: m.position,
    player: m.player,
    timestamp: Date.now(),
    moveNumber: i + 1,
  }));

  return {
    board,
    boardSize: state.boardSize,
    currentPlayer,
    moveHistory,
    isGameOver,
    winner: state.roundWinner,
    winInfo,
    isDraw,
    mode,
    moveCount: state.currentTurn,
  };
}

function thresholdFor(entry: RankedQueueEntry, now: number): number {
  const waitedMs = Math.max(0, now - entry.joinedAt);
  const steps = Math.floor(waitedMs / THRESHOLD_STEP_MS);
  return Math.min(MAX_RATING_THRESHOLD, BASE_RATING_THRESHOLD + steps * THRESHOLD_STEP);
}

function canMatch(a: RankedQueueEntry, b: RankedQueueEntry, now: number): boolean {
  const ratingDiff = Math.abs(a.rating - b.rating);
  const dynamicThreshold = Math.max(thresholdFor(a, now), thresholdFor(b, now));
  return ratingDiff <= dynamicThreshold;
}

function chooseClosestPair(queue: RankedQueueEntry[]): [RankedQueueEntry, RankedQueueEntry] | null {
  if (queue.length < 2) {
    return null;
  }

  const now = Date.now();
  let bestPair: [RankedQueueEntry, RankedQueueEntry] | null = null;
  let bestRatingDiff = Number.POSITIVE_INFINITY;
  let bestQueueTime = Number.POSITIVE_INFINITY;

  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const a = queue[i];
      const b = queue[j];

      if (!canMatch(a, b, now)) {
        continue;
      }

      const ratingDiff = Math.abs(a.rating - b.rating);
      const olderJoinTime = Math.min(a.joinedAt, b.joinedAt);

      if (
        ratingDiff < bestRatingDiff ||
        (ratingDiff === bestRatingDiff && olderJoinTime < bestQueueTime)
      ) {
        bestPair = [a, b];
        bestRatingDiff = ratingDiff;
        bestQueueTime = olderJoinTime;
      }
    }
  }

  return bestPair;
}

export class MatchmakingService {
  private readonly redis = getRedisClient();
  private onMatchFound: MatchFoundHandler | null = null;
  private onBotOffer: BotOfferHandler | null = null;

  setMatchFoundHandler(handler: MatchFoundHandler): void {
    this.onMatchFound = handler;
  }

  setBotOfferHandler(handler: BotOfferHandler): void {
    this.onBotOffer = handler;
  }

  async joinQueue(playerId: string, mode: GameMode, options?: QueueJoinOptions): Promise<QueueJoinResult> {
    const entry: RankedQueueEntry = {
      playerId,
      mode,
      rating: options?.rating ?? DEFAULT_RATING,
      joinedAt: Date.now(),
      username: options?.username || 'Player',
    };

    await this.leaveQueue(playerId);

    const qKey = queueKey(mode);
    const qDataKey = queueDataKey(mode);

    await this.redis
      .multi()
      .zadd(qKey, entry.joinedAt, playerId)
      .hset(qDataKey, playerId, JSON.stringify(entry))
      .set(playerIndexKey(playerId), mode)
      .exec();

    const position = await this.redis.zrank(qKey, playerId);
    const queueLength = await this.redis.zcard(qKey);

    return {
      position: (position ?? queueLength) + 1,
      estimatedWait: queueLength > 1 ? 0 : 30_000,
    };
  }

  async leaveQueue(playerId: string): Promise<void> {
    const indexedMode = await this.redis.get(playerIndexKey(playerId));

    if (indexedMode === 'MODE_1' || indexedMode === 'MODE_2') {
      await this.removeFromModeQueue(playerId, indexedMode);
      return;
    }

    await Promise.all([
      this.removeFromModeQueue(playerId, 'MODE_1'),
      this.removeFromModeQueue(playerId, 'MODE_2'),
    ]);
  }

  async processQueue(mode: GameMode): Promise<number> {
    let matchesCreated = 0;

    // Check for bot offer opportunities first
    const queue = await this.readQueue(mode);
    const now = Date.now();

    for (const entry of queue) {
      const waitTime = now - entry.joinedAt;
      const timeSinceLastOffer = entry.lastBotOfferAt ? now - entry.lastBotOfferAt : Number.POSITIVE_INFINITY;

      // Send bot offer every 30s (first at 30s, then 60s, 90s, etc.)
      if (waitTime >= BOT_FALLBACK_TIMEOUT_MS && timeSinceLastOffer >= BOT_FALLBACK_TIMEOUT_MS) {
        // Send bot offer to player
        const botSelection = resolveForRank(entry.rating);
        const offerCount = Math.floor(waitTime / BOT_FALLBACK_TIMEOUT_MS);

        this.onBotOffer?.({
          playerId: entry.playerId,
          mode: entry.mode,
          botDifficulty: botSelection.difficulty,
          botType: botSelection.botType,
          waitedMs: waitTime,
          offerCount,
        });

        // Update lastBotOfferAt in queue entry
        entry.lastBotOfferAt = now;
        const qDataKey = queueDataKey(mode);
        await this.redis.hset(qDataKey, entry.playerId, JSON.stringify(entry));

        console.log(`🤖 Sent bot offer #${offerCount} to ${entry.username} (${botSelection.difficulty})`);
      }
    }

    // Then try to match remaining players with each other
    for (let i = 0; i < 50; i++) {
      const queue = await this.readQueue(mode);
      const pair = chooseClosestPair(queue);
      if (!pair) {
        break;
      }

      const removed = await this.tryRemovePair(mode, pair[0].playerId, pair[1].playerId);
      if (!removed) {
        continue;
      }

      try {
        await this.createRankedMatch(mode, pair[0], pair[1]);
        matchesCreated += 1;
      } catch (error) {
        console.error('❌ Failed to create ranked match, re-queueing players', error);
        await Promise.all([
          this.joinQueue(pair[0].playerId, mode, { username: pair[0].username, rating: pair[0].rating }),
          this.joinQueue(pair[1].playerId, mode, { username: pair[1].username, rating: pair[1].rating }),
        ]);
        break;
      }
    }

    return matchesCreated;
  }

  /**
   * Accept bot match offer and create the match
   * Called when player explicitly accepts bot match from offer modal
   */
  async acceptBotMatchOffer(playerId: string): Promise<void> {
    // Find player in queue
    const indexedMode = await this.redis.get(playerIndexKey(playerId));
    if (indexedMode !== 'MODE_1' && indexedMode !== 'MODE_2') {
      throw new Error('Player not in queue');
    }

    const mode = indexedMode as GameMode;
    const qDataKey = queueDataKey(mode);
    const entryJson = await this.redis.hget(qDataKey, playerId);

    if (!entryJson) {
      throw new Error('Queue entry not found');
    }

    const entry: RankedQueueEntry = JSON.parse(entryJson);

    // Remove from queue
    const removed = await this.tryRemoveSingle(mode, playerId);
    if (!removed) {
      throw new Error('Failed to remove player from queue');
    }

    // Create bot match
    try {
      await this.createBotMatch(mode, entry);
      console.log(`✅ Player ${entry.username} accepted bot match offer`);
    } catch (error) {
      console.error('❌ Failed to create bot match after acceptance, re-queueing', error);
      await this.joinQueue(playerId, mode, { username: entry.username, rating: entry.rating });
      throw error;
    }
  }

  private async createBotMatch(mode: GameMode, player: RankedQueueEntry): Promise<void> {
    // Resolve bot difficulty based on player rating
    const botSelection = resolveForRank(player.rating);

    const matchId = `match_bot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const initialEngineState = initEngineState(mode);

    // Player is always X, bot is always O
    const xInfo: PlayerInfo = {
      id: player.playerId,
      username: player.username,
      rating: player.rating,
      isConnected: true,
    };

    const botId = `bot-${uuidv4()}`;
    const oInfo: PlayerInfo = {
      id: botId,
      username: getBotDisplayName(botSelection.botType, botSelection.difficulty),
      rating: player.rating, // Bot matches player rating for ELO calc
      isConnected: true,
      isBot: true,
      botType: botSelection.botType,
      botDifficulty: botSelection.difficulty,
    };

    const matchState: MatchState = {
      matchId,
      status: 'active',
      mode,
      isRanked: true,
      players: {
        X: xInfo,
        O: oInfo,
      },
      gameState: engineToWireState(initialEngineState, mode),
      spectators: [],
      spectatorCount: 0,
      startedAt: Date.now(),
      isBotMatch: true,
      botPlayer: 'O',
      botMultiplier: BOT_RATING_MULTIPLIER,
    };

    await matchManager.createMatch(matchState, initialEngineState);

    // Register bot instance with bot controller
    botController.registerBot(matchId, botSelection.instance);

    this.onMatchFound?.({
      matchId,
      matchState,
      engineState: initialEngineState,
      playerX: player,
      playerO: {
        playerId: botId,
        mode,
        rating: player.rating,
        joinedAt: Date.now(),
        username: oInfo.username,
      },
    });
  }

  private async tryRemoveSingle(mode: GameMode, playerId: string): Promise<boolean> {
    const qKey = queueKey(mode);
    const qDataKey = queueDataKey(mode);

    await this.redis.watch(qKey, qDataKey);

    const score = await this.redis.zscore(qKey, playerId);

    if (!score) {
      await this.redis.unwatch();
      return false;
    }

    const result = await this.redis
      .multi()
      .zrem(qKey, playerId)
      .hdel(qDataKey, playerId)
      .del(playerIndexKey(playerId))
      .exec();

    return Array.isArray(result);
  }

  private async createRankedMatch(mode: GameMode, first: RankedQueueEntry, second: RankedQueueEntry): Promise<void> {
    const [playerX, playerO] = Math.random() < 0.5 ? [first, second] : [second, first];

    const matchId = `match_ranked_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const initialEngineState = initEngineState(mode);

    const xInfo: PlayerInfo = {
      id: playerX.playerId,
      username: playerX.username,
      rating: playerX.rating,
      isConnected: true,
    };

    const oInfo: PlayerInfo = {
      id: playerO.playerId,
      username: playerO.username,
      rating: playerO.rating,
      isConnected: true,
    };

    const matchState: MatchState = {
      matchId,
      status: 'active',
      mode,
      isRanked: true,
      players: {
        X: xInfo,
        O: oInfo,
      },
      gameState: engineToWireState(initialEngineState, mode),
      spectators: [],
      spectatorCount: 0,
      startedAt: Date.now(),
    };

    await matchManager.createMatch(matchState, initialEngineState);

    this.onMatchFound?.({
      matchId,
      matchState,
      engineState: initialEngineState,
      playerX,
      playerO,
    });
  }

  private async readQueue(mode: GameMode): Promise<RankedQueueEntry[]> {
    const qKey = queueKey(mode);
    const qDataKey = queueDataKey(mode);

    const playerIds = await this.redis.zrange(qKey, 0, -1);
    if (playerIds.length === 0) {
      return [];
    }

    const rawEntries = await this.redis.hmget(qDataKey, ...playerIds);
    const queue: RankedQueueEntry[] = [];

    for (let i = 0; i < playerIds.length; i++) {
      const raw = rawEntries[i];
      if (!raw) {
        await this.redis.zrem(qKey, playerIds[i]);
        await this.redis.del(playerIndexKey(playerIds[i]));
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as RankedQueueEntry;
        queue.push(parsed);
      } catch {
        await this.redis
          .multi()
          .zrem(qKey, playerIds[i])
          .hdel(qDataKey, playerIds[i])
          .del(playerIndexKey(playerIds[i]))
          .exec();
      }
    }

    return queue;
  }

  private async tryRemovePair(mode: GameMode, playerA: string, playerB: string): Promise<boolean> {
    const qKey = queueKey(mode);
    const qDataKey = queueDataKey(mode);

    await this.redis.watch(qKey, qDataKey);

    const [aScore, bScore] = await Promise.all([
      this.redis.zscore(qKey, playerA),
      this.redis.zscore(qKey, playerB),
    ]);

    if (!aScore || !bScore) {
      await this.redis.unwatch();
      return false;
    }

    const result = await this.redis
      .multi()
      .zrem(qKey, playerA, playerB)
      .hdel(qDataKey, playerA, playerB)
      .del(playerIndexKey(playerA), playerIndexKey(playerB))
      .exec();

    return Array.isArray(result);
  }

  private async removeFromModeQueue(playerId: string, mode: GameMode): Promise<void> {
    await this.redis
      .multi()
      .zrem(queueKey(mode), playerId)
      .hdel(queueDataKey(mode), playerId)
      .del(playerIndexKey(playerId))
      .exec();
  }
}

export const matchmakingService = new MatchmakingService();
export type { RankedMatchFoundEvent, QueueJoinResult, QueueJoinOptions };
