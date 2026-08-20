# API Documentation

Complete API reference for Infinite Tic-Tac-Toe backend services.

**Base URL (Development):** `http://localhost:3001`  
**Base URL (Production):** `https://api.yourdomain.com`

**WebSocket URL (Development):** `ws://localhost:3001`  
**WebSocket URL (Production):** `wss://api.yourdomain.com`

---

## Table of Contents

- [Authentication](#authentication)
- [Health & Status](#health--status)
- [Player Management](#player-management)
- [Leaderboard](#leaderboard)
- [Match Storage](#match-storage)
- [Real-time Multiplayer (PvP)](#real-time-multiplayer-pvp)
- [WebSocket API](#websocket-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

Infinite TTT uses OAuth 2.0 for authentication via NextAuth.js.

### Supported Providers

- **Google OAuth 2.0**
- **Discord OAuth 2.0**

### Session Management

Sessions are managed by NextAuth with JWT tokens.

**Session Cookie:** `next-auth.session-token`  
**Expires:** 30 days (configurable)

### Protected Endpoints

The following endpoints require authentication:

- `PATCH /players/:playerId`
- `POST /pvp/match`
- `POST /pvp/match/:matchId/move`
- `POST /pvp/match/:matchId/complete`

### Authentication Headers

```http
Cookie: next-auth.session-token=<token>
```

Or for API clients:

```http
Authorization: Bearer <jwt_token>
```

---

## Health & Status

### GET /health

Check server health and WebSocket endpoint.

**Authentication:** None required

**Response:**
```json
{
  "status": "ok",
  "wsUrl": "ws://localhost:3001"
}
```

**Status Codes:**
- `200 OK` - Server is healthy
- `503 Service Unavailable` - Server issues

---

## Player Management

### POST /players

Create a new player account.

**Authentication:** Required (OAuth flow)

**Request Body:**
```json
{
  "email": "player@example.com",
  "displayName": "PlayerOne",
  "oauthProvider": "google",
  "oauthId": "google_oauth_id"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "player@example.com",
  "displayName": "PlayerOne",
  "ratingMode1": 1200,
  "ratingMode2": 1200,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created` - Player created successfully
- `400 Bad Request` - Invalid request body
- `409 Conflict` - Email already exists

---

### GET /players/:playerId

Get player profile and statistics.

**Authentication:** None required (public profiles)

**Path Parameters:**
- `playerId` (string, UUID) - Player ID

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "PlayerOne",
  "ratingMode1": 1250,
  "ratingMode2": 1180,
  "matchesPlayed": 42,
  "wins": 28,
  "losses": 14,
  "winRate": 66.7,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Player found
- `404 Not Found` - Player does not exist

---

### PATCH /players/:playerId

Update player profile.

**Authentication:** Required (must be the player or admin)

**Path Parameters:**
- `playerId` (string, UUID) - Player ID

**Request Body:**
```json
{
  "displayName": "NewUsername"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "NewUsername",
  "ratingMode1": 1250,
  "ratingMode2": 1180,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- `displayName`: 3-20 characters, alphanumeric + underscore/hyphen

**Status Codes:**
- `200 OK` - Profile updated
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not your profile
- `404 Not Found` - Player not found

---

### GET /players/:playerId/matches

Get player's match history.

**Authentication:** None required

**Path Parameters:**
- `playerId` (string, UUID) - Player ID

**Query Parameters:**
- `limit` (integer, optional) - Max matches to return (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)
- `mode` (string, optional) - Filter by mode (`mode1` or `mode2`)
- `isRanked` (boolean, optional) - Filter ranked/unranked

**Response:**
```json
{
  "matches": [
    {
      "matchId": "match-uuid",
      "mode": "mode1",
      "isRanked": true,
      "winner": "550e8400-e29b-41d4-a716-446655440000",
      "opponentId": "opponent-uuid",
      "opponentName": "OpponentUser",
      "playerRating": 1250,
      "opponentRating": 1220,
      "ratingChange": 15,
      "turnCount": 12,
      "durationMs": 125000,
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query params
- `404 Not Found` - Player not found

---

## Leaderboard

### GET /leaderboard

Get global leaderboard rankings.

**Authentication:** None required

**Query Parameters:**
- `mode` (string, required) - Game mode (`mode1` or `mode2`)
- `limit` (integer, optional) - Players to return (default: 100, max: 100)
- `minMatches` (integer, optional) - Minimum ranked matches (default: 10)

**Response:**
```json
{
  "mode": "mode1",
  "players": [
    {
      "rank": 1,
      "id": "player-uuid",
      "displayName": "TopPlayer",
      "rating": 1850,
      "matchesPlayed": 250,
      "wins": 180,
      "losses": 70,
      "winRate": 72.0,
      "trend": "up"
    },
    {
      "rank": 2,
      "id": "player2-uuid",
      "displayName": "SecondPlace",
      "rating": 1820,
      "matchesPlayed": 200,
      "wins": 145,
      "losses": 55,
      "winRate": 72.5,
      "trend": "stable"
    }
  ],
  "generatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query params

---

## Match Storage

### POST /matches

Store a completed match result.

**Authentication:** Optional (required for ranked matches)

**Request Body:**
```json
{
  "matchId": "match-uuid",
  "mode": "mode1",
  "isRanked": false,
  "winner": "player-uuid",
  "players": [
    {
      "id": "player-uuid",
      "type": "human"
    },
    {
      "id": "bot-random",
      "type": "bot"
    }
  ],
  "games": [
    {
      "gameNumber": 1,
      "winner": "player-uuid",
      "turnCount": 12,
      "durationMs": 45000,
      "finalBoard": [[...]]
    }
  ],
  "startedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:01:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "matchId": "match-uuid"
}
```

**Status Codes:**
- `201 Created` - Match stored
- `400 Bad Request` - Invalid match data
- `401 Unauthorized` - Auth required for ranked

---

### GET /matches

Get all stored matches.

**Authentication:** None required

**Query Parameters:**
- `limit` (integer, optional) - Max matches (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset
- `playerId` (string, optional) - Filter by player
- `mode` (string, optional) - Filter by mode

**Response:**
```json
{
  "matches": [
    {
      "matchId": "match-uuid",
      "mode": "mode1",
      "isRanked": true,
      "winner": "player-uuid",
      "playerCount": 2,
      "turnCount": 12,
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:**
- `200 OK` - Success

---

### GET /matches/:matchId

Get detailed match data with replay.

**Authentication:** None required

**Path Parameters:**
- `matchId` (string, UUID) - Match ID

**Response:**
```json
{
  "matchId": "match-uuid",
  "mode": "mode1",
  "isRanked": true,
  "winner": "player-uuid",
  "players": [
    {
      "id": "player-uuid",
      "displayName": "Player1",
      "role": "X",
      "ratingBefore": 1235,
      "ratingAfter": 1250,
      "ratingChange": 15
    },
    {
      "id": "opponent-uuid",
      "displayName": "Player2",
      "role": "O",
      "ratingBefore": 1225,
      "ratingAfter": 1210,
      "ratingChange": -15
    }
  ],
  "moves": [
    {
      "moveNumber": 1,
      "player": "X",
      "row": 1,
      "col": 1,
      "timestamp": "2024-01-01T00:00:05.000Z",
      "boardStateAfter": [[...]]
    }
  ],
  "startedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:01:00.000Z",
  "durationMs": 60000
}
```

**Status Codes:**
- `200 OK` - Match found
- `404 Not Found` - Match does not exist

---

## Real-time Multiplayer (PvP)

### POST /pvp/match

Create or join an online match.

**Authentication:** Required

**Request Body:**
```json
{
  "playerId": "player-uuid",
  "mode": "mode1",
  "boardSize": 3
}
```

**Response (Match Created - Waiting):**
```json
{
  "matchId": "match-uuid",
  "role": "X",
  "status": "waiting",
  "message": "Match created, waiting for opponent"
}
```

**Response (Match Joined - Active):**
```json
{
  "matchId": "match-uuid",
  "role": "O",
  "status": "active",
  "message": "Joined match"
}
```

**Behavior:**
- If waiting match exists → join as 'O' and start match
- Else → create new waiting match as 'X'

**Status Codes:**
- `200 OK` - Match created or joined
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Player not found

---

### GET /pvp/match/:matchId

Poll current match state.

**Authentication:** None required (public spectating)

**Path Parameters:**
- `matchId` (string) - Match ID

**Response:**
```json
{
  "matchId": "match-uuid",
  "mode": "MODE_1",
  "isRanked": false,
  "status": "active",
  "players": {
    "X": {
      "id": "player-uuid",
      "username": "Player1",
      "rating": 1250,
      "isConnected": true
    },
    "O": {
      "id": "opponent-uuid",
      "username": "Player2",
      "rating": 1220,
      "isConnected": true
    }
  },
  "gameState": {
    "board": [
      [null, "X", null],
      ["O", "X", null],
      [null, "O", null]
    ],
    "currentPlayer": "X",
    "currentTurn": 5,
    "moveCount": 5,
    "isGameOver": false,
    "winner": null,
    "winInfo": null,
    "mode": "MODE_1"
  },
  "spectatorCount": 3,
  "startedAt": "2024-01-01T00:00:00.000Z"
}
```

**Match Status:**
- `waiting` - Waiting for second player
- `active` - Game in progress
- `completed` - Game finished
- `abandoned` - Player disconnected

**Status Codes:**
- `200 OK` - Match found
- `404 Not Found` - Match does not exist

---

### POST /pvp/match/:matchId/move

Submit a move to an active match.

**Authentication:** Required

**Path Parameters:**
- `matchId` (string) - Match ID

**Request Body:**
```json
{
  "playerId": "player-uuid",
  "gameState": {
    "board": [[null, "X", null], ["O", "X", "X"], [null, "O", null]],
    "currentPlayer": "O",
    "currentTurn": 6,
    "moveCount": 6,
    "isGameOver": false,
    "winner": null
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Validation:**
- Match must exist and be active
- Player must be in the match
- Must be player's turn

**Note:** Backend does NOT validate move legality - clients apply engine rules.

**Side Effects:**
- Match state updated in Redis
- WebSocket broadcast to all connected clients

**Status Codes:**
- `200 OK` - Move accepted
- `400 Bad Request` - Match not active
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not your turn or not in match
- `404 Not Found` - Match not found

---

### POST /pvp/match/:matchId/complete

Finalize match with result and update ratings.

**Authentication:** Required

**Path Parameters:**
- `matchId` (string) - Match ID

**Request Body:**
```json
{
  "matchResult": {
    "matchId": "match-uuid",
    "mode": "mode1",
    "isRanked": true,
    "winner": "player-uuid",
    "players": [
      { "id": "player-uuid", "type": "human" },
      { "id": "opponent-uuid", "type": "human" }
    ],
    "games": [
      {
        "gameNumber": 1,
        "winner": "player-uuid",
        "turnCount": 12,
        "durationMs": 45000
      }
    ],
    "startedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:01:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Side Effects (if ranked):**
- Updates player ELO ratings
- Stores rating changes in database
- Broadcasts completion to all clients/spectators

**Status Codes:**
- `200 OK` - Match completed
- `400 Bad Request` - Invalid match result
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Match not found

---

### GET /pvp/matches/active

Get all active/waiting matches (debugging/monitoring).

**Authentication:** None required

**Response:**
```json
[
  {
    "matchId": "match-uuid-1",
    "mode": "mode1",
    "status": "active",
    "players": { "X": {...}, "O": {...} },
    "spectatorCount": 2,
    "startedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "matchId": "match-uuid-2",
    "mode": "mode2",
    "status": "waiting",
    "players": { "X": {...}, "O": null },
    "spectatorCount": 0
  }
]
```

**Status Codes:**
- `200 OK` - Success

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Client → Server Messages

#### Join Match

Join an active match as a player.

```json
{
  "type": "join",
  "matchId": "match-uuid",
  "playerId": "player-uuid",
  "role": "X"
}
```

#### Submit Move

Send a move (alternative to REST API).

```json
{
  "type": "move",
  "matchId": "match-uuid",
  "playerId": "player-uuid",
  "gameState": {
    "board": [[...]],
    "currentPlayer": "O",
    "currentTurn": 6
  }
}
```

#### Join as Spectator

Watch a match without playing.

```json
{
  "type": "spectate",
  "matchId": "match-uuid"
}
```

#### Leave Match

Disconnect from match.

```json
{
  "type": "leave",
  "matchId": "match-uuid",
  "playerId": "player-uuid"
}
```

### Server → Client Messages

#### State Update

Real-time match state broadcast.

```json
{
  "type": "state",
  "matchId": "match-uuid",
  "matchState": {
    "matchId": "match-uuid",
    "mode": "MODE_1",
    "status": "active",
    "players": {...},
    "gameState": {...},
    "spectatorCount": 3
  }
}
```

**Trigger:** After any move or state change

#### Match Complete

Match has ended.

```json
{
  "type": "complete",
  "matchId": "match-uuid",
  "matchResult": {
    "winner": "player-uuid",
    "isRanked": true,
    "ratingChanges": {
      "player-uuid": 15,
      "opponent-uuid": -15
    }
  }
}
```

#### Player Connected

A player has connected/reconnected.

```json
{
  "type": "playerConnected",
  "matchId": "match-uuid",
  "playerId": "player-uuid",
  "role": "X"
}
```

#### Player Disconnected

A player has disconnected.

```json
{
  "type": "playerDisconnected",
  "matchId": "match-uuid",
  "playerId": "player-uuid",
  "role": "X"
}
```

#### Error

Error message from server.

```json
{
  "type": "error",
  "message": "Match not found",
  "code": "MATCH_NOT_FOUND"
}
```

**Common Error Codes:**
- `MATCH_NOT_FOUND`
- `PLAYER_NOT_IN_MATCH`
- `NOT_YOUR_TURN`
- `INVALID_MOVE`
- `AUTHENTICATION_REQUIRED`

---

## Data Models

### Player

```typescript
interface Player {
  id: string;                    // UUID
  email: string;                 // Unique email
  displayName: string;           // Username (3-20 chars)
  ratingMode1: number;          // Mode 1 ELO (default: 1200)
  ratingMode2: number;          // Mode 2 ELO (default: 1200)
  oauthProvider: string;        // 'google' | 'discord'
  oauthId: string;              // Provider-specific ID
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

### Match

```typescript
interface Match {
  matchId: string;              // UUID
  mode: 'mode1' | 'mode2';
  isRanked: boolean;
  winner: string | null;        // Player ID or null
  players: MatchPlayer[];
  games: Game[];
  startedAt: string;            // ISO 8601
  completedAt: string;          // ISO 8601
  durationMs: number;
}
```

### MatchPlayer

```typescript
interface MatchPlayer {
  id: string;                   // Player ID
  type: 'human' | 'bot';
  role: 'X' | 'O';
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}
```

### Game

```typescript
interface Game {
  gameNumber: number;
  winner: string;               // Player ID
  turnCount: number;
  durationMs: number;
  finalBoard: Cell[][];         // Board state at end
}
```

### Move

```typescript
interface Move {
  moveNumber: number;
  player: 'X' | 'O';
  row: number;                  // 0-indexed
  col: number;                  // 0-indexed
  timestamp: string;            // ISO 8601
  boardStateAfter: Cell[][];    // Full board after move
}
```

### GameState

```typescript
interface GameState {
  board: Cell[][];              // N×N grid
  boardSize: number;            // N
  currentPlayer: 'X' | 'O';
  currentTurn: number;          // 0-indexed turn counter
  moveCount: number;            // Total moves made
  isGameOver: boolean;
  winner: 'X' | 'O' | null;
  winInfo: WinInfo | null;
  isDraw: boolean;              // Rare in Infinite TTT
  mode: 'MODE_1' | 'MODE_2';
}
```

### WinInfo

```typescript
interface WinInfo {
  player: 'X' | 'O';
  line: Position[];             // Winning cells
  type: 'row' | 'col' | 'diag-main' | 'diag-anti';
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "reason": "Specific issue"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Endpoint requires auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### HTTP Status Codes

- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Server down/maintenance

---

## Rate Limiting

### Current Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /players` | 5 | 1 hour |
| `PATCH /players/:id` | 10 | 1 hour |
| `POST /pvp/match` | 20 | 1 minute |
| `POST /pvp/match/:id/move` | 100 | 1 minute |
| `GET /leaderboard` | 60 | 1 minute |
| General API | 1000 | 1 hour |

**Note:** Rate limits not yet enforced - planned for production.

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Pagination

### Pagination Parameters

- `limit` - Items per page (max varies by endpoint)
- `offset` - Items to skip

### Pagination Response

```json
{
  "data": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## CORS

### Allowed Origins (Development)

- `http://localhost:3000`
- `http://localhost:3001`

### Allowed Origins (Production)

- `https://yourdomain.com`
- Configurable via `CORS_ORIGINS` environment variable

### Allowed Methods

- `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`

### Allowed Headers

- `Content-Type`
- `Authorization`
- `Cookie`

---

## Versioning

**Current Version:** v1 (implicit, no version in URL)

**Future:** `/v2/...` for breaking changes

---

## Related Documentation

- [Main README](../README.md)
- [Backend README](../apps/backend/README.md)
- [Web App README](../apps/web/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture](./ARCHITECTURE.md)

---

**Last Updated:** 2024-01-01  
**API Version:** 1.0.0
