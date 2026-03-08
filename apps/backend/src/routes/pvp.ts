import { Router } from 'express';
import { LocalJsonPvPMatchStore } from '../storage/LocalJsonPvPMatchStore';
import type { PvPMatch } from '../storage/PvPMatchStore';
import { wsManager } from '../websocket';

const router = Router();
const pvpStore = new LocalJsonPvPMatchStore();

// Initialize store
pvpStore.init().catch(console.error);

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

    // Try to find a waiting match
    const waitingMatch = await pvpStore.findWaiting(mode);

    if (waitingMatch) {
      // Join existing match
      await pvpStore.update(waitingMatch.matchId, {
        players: {
          ...waitingMatch.players,
          O: playerId,
        },
        currentPlayer: 'X', // Game starts, X goes first
        status: 'active',
      });

      // Get updated match to broadcast
      const updatedMatch = await pvpStore.getById(waitingMatch.matchId);
      
      // Broadcast to both players that match is now active
      wsManager.broadcastStateUpdate(waitingMatch.matchId, updatedMatch);

      return res.json({
        matchId: waitingMatch.matchId,
        role: 'O',
        status: 'active',
        message: 'Joined match',
      });
    } else {
      // Create new waiting match
      const newMatch = await pvpStore.create({
        mode,
        boardSize,
        players: {
          X: playerId,
          O: '', // Will be filled when opponent joins
        },
        currentPlayer: 'X',
        gameState: {
          board: createEmptyInfiniteBoard(),
          currentTurn: 0,
          winner: null,
          moveHistory: [],
          playerMarks: {
            X: [],
            O: [],
          },
        },
        status: 'waiting',
      });

      return res.json({
        matchId: newMatch.matchId,
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
    const match = await pvpStore.getById(matchId);

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

    const match = await pvpStore.getById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ error: 'Match not active' });
    }

    // Verify it's the correct player's turn
    const playerRole = match.players.X === playerId ? 'X' : 
                       match.players.O === playerId ? 'O' : null;

    if (!playerRole) {
      return res.status(403).json({ error: 'Player not in this match' });
    }

    if (playerRole !== match.currentPlayer) {
      return res.status(403).json({ error: 'Not your turn' });
    }

    // Update match with new game state
    // Backend trusts the client to have applied engine rules correctly
    // Calculate next player based on turn number (even = X, odd = O)
    const nextPlayer = gameState.currentTurn % 2 === 0 ? 'X' : 'O';
    
    await pvpStore.update(matchId, {
      gameState,
      currentPlayer: nextPlayer,
    });

    // Get updated match and broadcast to all players
    const updatedMatch = await pvpStore.getById(matchId);
    wsManager.broadcastStateUpdate(matchId, updatedMatch);

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

    const match = await pvpStore.getById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await pvpStore.complete(matchId, matchResult);

    // Broadcast match completion to all connected clients
    wsManager.broadcastMatchComplete(matchId, matchResult);

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
    const matches = await pvpStore.getActive();
    res.json(matches);
  } catch (error) {
    console.error('Error getting active matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
