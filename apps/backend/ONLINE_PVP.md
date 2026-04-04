`# Online PvP System

## Overview

This implements WebSocket-based online Player vs Player matches for Infinite Tic-Tac-Toe, with automatic fallback to polling.

**Key Design Principles:**

- Backend is **dumb** - only stores state, never applies game rules
- Client is **smart** - applies engine logic, validates moves
- Backend enforces **turn ownership only**
- Uses **WebSockets for real-time updates**, with polling fallback
- Backend is **replaceable** - no business logic

## Architecture

### Backend Responsibilities ✅

- Store PvP match state
- Store move history
- Enforce turn ownership (only correct player can move)
- Track match lifecycle (waiting → active → completed)
- **Broadcast state changes via WebSocket**

### Backend Does NOT ❌

- Apply game rules
- Validate move legality
- Calculate winners/draws
- Manage ranking
- Enforce timeouts

### Client Responsibilities ✅

- Apply moves using game engine
- Validate move legality
- Detect wins/draws
- Emit MatchResult at end
- **Connect to WebSocket for real-time updates (with polling fallback)**

## Data Model

```typescript
interface PvPMatch {
  matchId: string;
  mode: "mode1" | "mode2";
  boardSize: number;
  players: {
    X: string; // playerId
    O: string; // playerId
  };
  currentPlayer: "X" | "O";
  gameState: GameState;
  lastUpdated: number;
  status: "waiting" | "active" | "completed";
  matchResult?: MatchResult; // Stored when match ends
}
```

## API Endpoints

### POST `/pvp/match`

Create or join a match.

**Request:**

```json
{
  "playerId": "abc123",
  "mode": "mode1",
  "boardSize": 3
}
```

**Response:**

```json
{
  "matchId": "uuid",
  "role": "X" | "O",
  "status": "waiting" | "active",
  "message": "Match created, waiting for opponent"
}
```

**Behavior:**

- If waiting match exists → join it (assign O, activate match)
- Else → create new waiting match (assign X)

### GET `/pvp/match/:matchId`

Poll match state (fallback when WebSocket unavailable).

**Response:** Full `PvPMatch` object

Clients use this as fallback if WebSocket connection fails.

## WebSocket Protocol

### Connection

Client connects to `ws://localhost:3001` and sends:

```json
{
  "type": "join",
  "playerId": "abc123",
  "matchId": "uuid"
}
```

### Server → Client Messages

**State Update:**

```json
{
  "type": "state-update",
  "payload": {
    /* full PvPMatch object */
  }
}
```

Sent whenever match state changes (opponent joins, move submitted, etc.)

**Match Complete:**

```json
{
  "type": "match-complete",
  "payload": {
    /* MatchResult */
  }
}
```

Sent when match ends, connection closes shortly after.

### Client → Server Messages

Clients do NOT send moves via WebSocket. Moves are submitted via REST API (`POST /pvp/match/:matchId/move`). WebSocket is **broadcast-only**.

### Fallback Behavior

If WebSocket connection fails:

- Client automatically falls back to polling
- No feature loss, only slightly higher latency
- Client displays connection status (⚡ WebSocket or 📡 Polling)

### POST `/pvp/match/:matchId/move`

// Connect to WebSocket
const connection = new PvPConnection(matchId, playerId);
await connection.connect();

// Register state update callback
connection.onStateUpdate((match) => {
// Update UI with new state
});

if (status === "waiting") {
// Wait for WebSocket update (or poll as fallback)
while (match.status !== "active") {
await sleep(500
{
"playerId": "abc123",
"gameState": {
/_ updated GameState after move _/
}
}

````

**Validation (Backend):**

- Match exists ✓
- Match is active ✓
- Player is in this match ✓
- It's player's turn ✓
 (broadcasts via WebSocket)
    await submitMove(matchId, playerId, gameState);

    // WebSocket will notify when state updates
  } else {
    // Wait for WebSocket update (or poll as fallback)
    // State update callback will trigger when opponent moves
**Request:**

```json
{
  "matchResult": {
    /* MatchResult from @infinite-ttt/shared */
  }
}
````

Backend stores result and marks match as completed.

### GET `/pvp/matches/active`

Get all active matches (for debugging/monitoring).

## Client Flow

### 1. Match Creation/Joining

```typescript
const { matchId, role, status } = await createOrJoinMatch(playerId, "mode1");

if (status === "waiting") {
  // Poll until opponent joins
  while (match.status !== "active") {
    await sleep(2000);
    match = await getMatch(matchId);
  }
}
```

### 2. Game Loop

```typescript
while (!gameState.isGameOver) {
  if (isMyTurn) {
    // Get move from player
    const move = await getMoveInput();

    // Apply move using engine (client validates)
    const result = applyMove(gameState, move);

    if (!result.valid) {
      // Show error, try again
      continue;
    }

    gameState = result.state;

    // Submit to backend
    await submitMove(matchId, playerId, gameState);
  } else {
    // Poll for opponent's move
    await sleep(2000);
    const match = await getMatch(matchId);

    if (match.gameState.moves.length > gameState.moves.length) {
      // Opponent moved!
      gameState = match.gameState;
    }
  }
}
```

### 3. Match Completion

```typescript
// Build match result
const matchResult = buildMode1MatchResult(gameState, players);

// Store locally
await emitMatchResult(matchResult);

// Store on backend
await completeMatch(matchId, matchResult);
```

## Running the System

### 1. Start Backend

```bash
cd apps/backend
pnpm dev
```

Backend runs on `http://localhost:3001`

### 2. Start Player 1

```bash
cd apps/cli-runner
pnpm dev --pvp
```

Player 1 creates match and waits.

### 3. Start Player 2 (in another terminal)

```bash
cd apps/cli-runner
pnpm dev --pvp
```

Player 2 joins match and game begins!

## Environment Variables

# Default: ws://localhost:3001

BACKEND_WS_URL=ws://localhost:3001

```bash
# Default: http://localhost:3001
BACKEND_URL=http://localhost:3001
```

## Storage

Backend stores PvP matches in:

```
Redis keyspace (example: match:{matchId})
```

Clients store MatchResults in:

```
apps/cli-runner/data/matches.json
```

Both players store the MatchResult locally for leaderboard/ranking.

## Why This Design?

Real-time updates** - WebSocket provides instant feedback 6. **Deterministic** - both clients run same engine 7. **Testable** - backend and client are decoupled 8. **Resilient\*\* - automatic fallback to polling if WebSocket fails

1. **Backend is simple** - no game logic, easy to scale
2. **Backend is scalable** - active matches in Redis, completed history in PostgreSQL
3. **Engine stays pure** - no server-side modifications
4. **Sync issues** - if clients disagree on state

### 🔮 Future Improvements

1. ~~Add WebSockets for real-time updates~~ ✅ **Done in Step 13!**
1. **Trust** - clients can cheat (send invalid moves)
1. **Bandwidth** - polling creates constant traffic
1. **Latency** - 2s poll interval = 2s wait per move
1. **Sync issues** - if clients disagree on state

### 🔮 Future Improvements

1. Add WebSockets for real-time updates (Step 13?)
2. Add server-side validation using engine (optional)
3. Add matchmaking queue
4. Add spectator mode
5. Add move timestamps for timeout detection
6. Add reconnection handling

## Integration with Ranking

Both players independently:

1. Play the match
2. Build identical `MatchResult`
3. Emit to local storage
4. Ranking system picks it up automatically

No special PvP ranking needed - it's just another match!

## Testing

### Test with two terminals:

```bash
# Terminal 1
cd apps/backend && pnpm dev

# Terminal 2
cd apps/cli-runner && pnpm dev --pvp

# Terminal 3
cd apps/cli-runner && pnpm dev --pvp
```

### Verify:

- ✓ Matchmaking works
- ✓ Turn enforcement works
- ✓ Board updates correctly
- ✓ Game ends properly
- ✓ MatchResult stored
- ✓ Ranking updates

## Files Added

- **`src/websocket/index.ts` - WebSocket manager (Step 13)**

### CLI

- `src/onlinePvP.ts` - PvP game mode

### Modified

- `apps/backend/src/storage/index.ts` - Export PvP store
- `apps/backend/src/server.ts` - Add PvP routes
- **`apps/backend/src/index.ts` - Attach WebSocket server (Step 13)**
- `apps/cli-runner/src/index.ts` - Add --pvp flag
- **`apps/cli-runner/src/onlinePvP.ts` - Add WebSocket support with fallback (Step 13)**

### Modified

- `apps/backend/src/storage/index.ts` - Export PvP store
- `apps/backend/src/server.ts` - Add PvP routes
- `apps/cli-runner/src/index.ts` - Add --pvp flag

## API Contract

The backend-client contract is **minimal**:

1. Backend stores `GameState` snapshots
2. Client applies engine rules
3. Turn ownership enforced by player ID check
4. No validation beyond "is it your turn?"

This keeps the backend **dumb and replaceable** while keeping gameplay **deterministic and client-driven**.
