import { Router } from 'express';
import type { MatchResult } from '@infinite-ttt/shared';
import { Modes, getNextPlayer } from '@infinite-ttt/game-engine';
import { matchManager, type MatchState, type MatchSnapshot } from '../match/matchManager';
import { createMatchStorage } from '../storage/createMatchStorage';
import { wsManager } from '../websocket';
import { isValidMatchResult } from '../validators/matchResultSchema';
import { getPrismaClient } from '../storage/prismaClient';
import { calculateEloChange, resolveKFactorByExperience, type MatchOutcome } from '../rating/elo';

const router = Router();
const matchStorage = createMatchStorage();

function normalizeMatchPlayersForPersistence(matchResult: MatchResult, match: MatchState): MatchResult {
  const playersById = new Map(matchResult.players.map((player) => [player.id, player]));

  const xPlayerId = match.players.X?.id ?? 'unknown-x';
  const oPlayerId = match.players.O?.id ?? 'unknown-o';

  const xPlayer = playersById.get(xPlayerId) ?? {
    id: xPlayerId,
    type: 'human' as const,
  };
  const oPlayer = playersById.get(oPlayerId) ?? {
    id: oPlayerId,
    type: 'human' as const,
  };

  return {
    ...matchResult,
    players: [xPlayer, oPlayer],
  };
}

function toBackendMode(mode: 'mode1' | 'mode2'): 'MODE_1' | 'MODE_2' {
  return mode === 'mode1' ? 'MODE_1' : 'MODE_2';
}

function toApiMode(mode: 'MODE_1' | 'MODE_2'): 'mode1' | 'mode2' {
  return mode === 'MODE_1' ? 'mode1' : 'mode2';
}

const DEFAULT_RATING = 1200;

async function loadPlayerInfo(playerId: string): Promise<{ id: string; username: string; rating: number } | null> {
  const prisma = getPrismaClient();
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, displayName: true, rating: true },
  });

  if (!player) {
    return null;
  }

  return {
    id: player.id,
    username: player.displayName || player.id,
    rating: player.rating ?? DEFAULT_RATING,
  };
}

async function applyRankedRatingUpdate(matchResult: MatchResult): Promise<void> {
  if (!matchResult.isRanked) {
    return;
  }

  const [playerA, playerB] = matchResult.players;
  if (!playerA || !playerB) {
    return;
  }

  const prisma = getPrismaClient();
  const players = await prisma.player.findMany({
    where: { id: { in: [playerA.id, playerB.id] } },
    select: { id: true, rating: true },
  });

  const aRecord = players.find((player) => player.id === playerA.id);
  const bRecord = players.find((player) => player.id === playerB.id);

  if (!aRecord || !bRecord) {
    return;
  }

  let outcomeForA: MatchOutcome = 'draw';
  if (matchResult.winner === playerA.id) outcomeForA = 'win';
  if (matchResult.winner === playerB.id) outcomeForA = 'loss';

  const [aRankedMatches, bRankedMatches] = await Promise.all([
    prisma.matchPlayer.count({
      where: {
        playerId: playerA.id,
        match: {
          isRanked: true,
        },
      },
    }),
    prisma.matchPlayer.count({
      where: {
        playerId: playerB.id,
        match: {
          isRanked: true,
        },
      },
    }),
  ]);

  const kFactorA = resolveKFactorByExperience(aRankedMatches);
  const kFactorB = resolveKFactorByExperience(bRankedMatches);

  const { changeA, changeB } = calculateEloChange(aRecord.rating, bRecord.rating, outcomeForA, {
    kFactorA,
    kFactorB,
  });
  const newARating = Math.max(0, aRecord.rating + changeA);
  const newBRating = Math.max(0, bRecord.rating + changeB);

  await prisma.$transaction(async (tx) => {
    await tx.player.update({ where: { id: playerA.id }, data: { rating: newARating } });
    await tx.player.update({ where: { id: playerB.id }, data: { rating: newBRating } });
    await tx.matchPlayer.updateMany({
      where: { matchId: matchResult.matchId, playerId: playerA.id },
      data: { ratingChange: changeA },
    });
    await tx.matchPlayer.updateMany({
      where: { matchId: matchResult.matchId, playerId: playerB.id },
      data: { ratingChange: changeB },
    });
  });

  const formattedAChange = `${changeA >= 0 ? '+' : ''}${changeA}`;
  const formattedBChange = `${changeB >= 0 ? '+' : ''}${changeB}`;
  console.log(`Player ${playerA.id}: ${aRecord.rating} -> ${newARating} (${formattedAChange})`);
  console.log(`Player ${playerB.id}: ${bRecord.rating} -> ${newBRating} (${formattedBChange})`);
}

/**
 * Create an empty 3x3 board for Infinite3x3State
 */
function createEmptyInfiniteBoard() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

/**
 * POST /pvp/match
 * Create or join a match
 * 
 * Body: { playerId: string, mode: 'mode1' | 'mode2', boardSize?: number }
 * 
 * Behavior:
 * - If waiting match exists → join it (assign O)
 * - Else → create new waiting match (assign X)
 */
router.post('/match', async (req, res) => {
  try {
    const { playerId, mode, boardSize = 3 } = req.body;

    if (!playerId || !mode) {
      return res.status(400).json({ error: 'Missing playerId or mode' });
    }

    if (mode !== 'mode1' && mode !== 'mode2') {
      return res.status(400).json({ error: 'Invalid mode. Must be mode1 or mode2' });
    }

    const backendMode = toBackendMode(mode);

    const playerProfile = await loadPlayerInfo(playerId);
    if (!playerProfile) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Try to find a waiting match
    const waitingMatch = await matchManager.findWaiting(backendMode, false);

    if (waitingMatch) {
      const joined = await matchManager.joinMatch(waitingMatch.matchState.matchId, 'O', {
        id: playerProfile.id,
        username: playerProfile.username,
        rating: playerProfile.rating,
        isConnected: false,
      });

      if (!joined) {
        return res.status(404).json({ error: 'Match not found' });
      }

      joined.matchState.status = 'active';
      await matchManager.saveMatchState(joined.matchState, joined.engineState);

      // Get updated match to broadcast
      const updatedMatch = await matchManager.recoverMatch(waitingMatch.matchState.matchId);
      
      // Broadcast to both players that match is now active
      wsManager.broadcastStateUpdate(waitingMatch.matchState.matchId, updatedMatch?.matchState);

      return res.json({
        matchId: waitingMatch.matchState.matchId,
        role: 'O',
        status: 'active',
        message: 'Joined match',
      });
    } else {
      const engineState = backendMode === 'MODE_1'
        ? Modes.Infinite3x3.createInitialState()
        : Modes.ExpandingBoard.createInitialState();

      const currentPlayer = getNextPlayer(engineState.currentTurn);

      // Create new waiting match
      const newMatchState: MatchState = {
        matchId: `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mode: backendMode,
        isRanked: false,
        spectators: [],
        spectatorCount: 0,
        startedAt: null,
        players: {
          X: {
            id: playerProfile.id,
            username: playerProfile.username,
            rating: playerProfile.rating,
            isConnected: false,
          },
          O: null,
        },
        gameState: {
          board: createEmptyInfiniteBoard(),
          boardSize,
          currentPlayer,
          moveHistory: [],
          isGameOver: false,
          winner: null,
          winInfo: null,
          isDraw: false,
          mode: backendMode,
          moveCount: engineState.currentTurn,
        },
        status: 'waiting',
      };

      const newMatch = await matchManager.createMatch(newMatchState, engineState);

      return res.json({
        matchId: newMatch.matchState.matchId,
        role: 'X',
        status: 'waiting',
        message: 'Match created, waiting for opponent',
      });
    }
  } catch (error) {
    console.error('Error creating/joining match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /pvp/match/:matchId
 * Poll match state
 * 
 * Returns: PvPMatch
 */
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const snapshot = await matchManager.recoverMatch(matchId);
    const match = snapshot?.matchState ?? null;

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error getting match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /pvp/match/:matchId/move
 * Submit a move
 * 
 * Body: { playerId: string, gameState: GameState }
 * 
 * Validation (ONLY):
 * - Match exists
 * - Match active
 * - Correct player turn
 * 
 * Backend does NOT validate move legality - client applies engine rules
 */
router.post('/match/:matchId/move', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { playerId, gameState } = req.body;

    if (!playerId || !gameState) {
      return res.status(400).json({ error: 'Missing playerId or gameState' });
    }

    const snapshot = await matchManager.recoverMatch(matchId);
    const match = snapshot?.matchState ?? null;

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ error: 'Match not active' });
    }

    // Verify it's the correct player's turn
    const playerRole = match.players.X?.id === playerId ? 'X' : 
               match.players.O?.id === playerId ? 'O' : null;

    if (!playerRole) {
      return res.status(403).json({ error: 'Player not in this match' });
    }

    if (playerRole !== match.gameState.currentPlayer) {
      return res.status(403).json({ error: 'Not your turn' });
    }

    // Update match with new game state
    // Backend trusts the client to have applied engine rules correctly
    // Calculate next player based on turn number (even = X, odd = O)
    const nextPlayer = gameState.currentTurn % 2 === 0 ? 'X' : 'O';
    const updatedMatch: MatchState = {
      ...match,
      gameState: {
        ...gameState,
        currentPlayer: nextPlayer,
      },
    };

    await matchManager.saveMatchState(updatedMatch, snapshot!.engineState);

    // Get updated match and broadcast to all players
    const persisted = await matchManager.recoverMatch(matchId);
    wsManager.broadcastStateUpdate(matchId, persisted?.matchState);

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting move:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /pvp/match/:matchId/complete
 * Finalize match with result
 * 
 * Body: { matchResult: MatchResult }
 * 
 * Backend stores the match result and marks match as completed
 */
router.post('/match/:matchId/complete', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { matchResult } = req.body;

    if (!matchResult) {
      return res.status(400).json({ error: 'Missing matchResult' });
    }

    if (!isValidMatchResult(matchResult)) {
      return res.status(400).json({ error: 'Invalid MatchResult' });
    }

    if (matchResult.matchId !== matchId) {
      return res.status(400).json({ error: 'matchId mismatch between URL and payload' });
    }

    const snapshot = await matchManager.recoverMatch(matchId);
    const match = snapshot?.matchState ?? null;

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const normalizedMatchResult = normalizeMatchPlayersForPersistence(matchResult, match);

    // Canonical completed match persistence path (JSON + DB migration mode).
    await matchStorage.saveMatch(normalizedMatchResult);
    await applyRankedRatingUpdate(normalizedMatchResult);

    await matchManager.endMatch(matchId);

    // Broadcast match completion to all connected clients
    wsManager.broadcastMatchComplete(matchId, normalizedMatchResult);

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /pvp/matches/active
 * Get all active matches (for debugging/monitoring)
 */
router.get('/matches/active', async (req, res) => {
  try {
    const matches = await matchManager.getActiveMatches();
    const payload = matches.map((snapshot: MatchSnapshot) => ({
      ...snapshot.matchState,
      mode: toApiMode(snapshot.matchState.mode),
    }));
    res.json(payload);
  } catch (error) {
    console.error('Error getting active matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
