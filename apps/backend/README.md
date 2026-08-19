# Infinite TTT - Minimal Backend

A minimal Express backend for storing MatchResult data and managing online PvP matches.

## 🎯 Purpose

This backend does **exactly five things**:

1. ✅ Accept `MatchResult` via POST
2. ✅ Store it in PostgreSQL
3. ✅ Serve it back via GET
4. ✅ Manage online PvP match state
5. ✅ Enforce turn ownership in PvP

**What it does NOT do:**

- ❌ No game logic or rule validation
- ❌ No ranking calculations
- ❌ No matchmaking decisions
- ❌ No authentication
- ❌ No real-time sockets (uses polling)
- ❌ No gameplay validation

Think of it as a **recorder and state store**, not a brain.

> **Note:** For detailed PvP documentation, see [ONLINE_PVP.md](./ONLINE_PVP.md)

## 🚀 Quick Start

### Install dependencies

```bash
cd apps/backend
pnpm install
```

### Start the server

```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm build
pnpm start
```

The server will run on `http://localhost:3000`

## 📡 API Endpoints

### POST /matches

Store a new match result.

**Request:**

```json
{
  "matchId": "match_1768...",
  "mode": "mode1",
  "games": [...],
  "players": [...]
}
```

**Response:**

```json
{
  "success": true
}
```

**Error Response (400):**

```json
{
  "error": "Invalid MatchResult"
}
```

### GET /matches

Retrieve all stored matches.

**Response:**

```json
[
  {
    "matchId": "match_1768...",
    "mode": "mode1",
    "games": [...],
    "players": [...]
  }
]
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### PvP Endpoints

#### POST /pvp/match

Create or join an online PvP match.

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

#### GET /pvp/match/:matchId

Poll current match state.

**Response:** Full PvPMatch object with game state.

#### POST /pvp/match/:matchId/move

Submit a move (turn enforcement only).

**Request:**

```json
{
  "playerId": "abc123",
  "gameState": {
    /* updated GameState */
  }
}
```

**Response:**

```json
{
  "success": true
}
```

#### POST /pvp/match/:matchId/complete

Finalize match with result.

**Request:**

```json
{
  "matchResult": {
    /* MatchResult */
  }
}
```

**Response:**

```json
{
  "success": true
}
```

#### GET /pvp/matches/active

Get all active/waiting matches (debugging).

**Response:** Array of PvPMatch objects.

## 🎮 Integration with CLI

### Bot vs Bot with backend storage

Run the CLI with backend storage:

```bash
# From repo root
pnpm dev --backend-url=http://localhost:3000

# Run multiple games
pnpm dev --games 10 --backend-url=http://localhost:3000

# Mode 2 with backend
pnpm dev --mode 2 --backend-url=http://localhost:3000
```

### Online PvP

Play against another human online:

```bash
# Terminal 1 - Start backend
cd apps/backend
pnpm dev

# Terminal 2 - Player 1
cd apps/cli-runner
pnpm dev --pvp

# Terminal 3 - Player 2
cd apps/cli-runner
pnpm dev --pvp
```

See [ONLINE_PVP.md](./ONLINE_PVP.md) for complete PvP documentation.

## 📁 Data Storage

Match data is stored in:

- Redis - Active/waiting PvP matches (`match:{matchId}`)
- `data/players.json` - Player identity data (gitignored)
- PostgreSQL - Completed match results and replay moves

**Important:** PvP waiting/active state is Redis-backed, while completed match history is PostgreSQL-backed.

## 🔧 Configuration

Create an env file from `apps/backend/.env.example`.

### Local Docker Setup

From repository root:

```bash
pnpm docker:up
```

This starts:

- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

Run local migrations after containers are healthy:

```bash
pnpm --filter @infinite-ttt/backend prisma:migrate
```

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string used by Prisma runtime and migrations
- `REDIS_URL` - Redis connection string for ranked queue and active match state
- `PORT` - HTTP server port (default `3000`)
- `WS_URL` - Public WebSocket URL exposed for clients/health checks

### Cloud Example

```bash
DATABASE_URL=postgresql://user:pass@db.example.com:5432/infinite_ttt
REDIS_URL=redis://default:pass@redis.example.com:6379
PORT=3000
WS_URL=wss://api.example.com
```

### Local Docker Example

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/infinite_ttt?schema=public
REDIS_URL=redis://localhost:6379
PORT=3000
WS_URL=wss://localhost:3000
```

### Local Override Example

```bash
PORT=4000 pnpm start
```

Default: `3000`

## ☁️ Production Deployment

### Build and run

```bash
pnpm install --frozen-lockfile
pnpm --filter @infinite-ttt/backend build
pnpm --filter @infinite-ttt/backend start
```

### Run Prisma migrations in production

```bash
# Uses DATABASE_URL from production environment
pnpm --filter @infinite-ttt/backend prisma:migrate:deploy
```

Use `prisma:migrate` only for local development and `prisma:migrate:deploy` for cloud deployments.

## 📊 Testing

### Test the health endpoint

```bash
curl http://localhost:3000/health
```

### View all matches

```bash
curl http://localhost:3000/matches
```

### Send a test match (PowerShell)

```powershell
$body = @{
  matchId = "test_123"
  mode = "mode1"
  games = @()
  players = @("Player1", "Player2")
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/matches -Method POST -Body $body -ContentType "application/json"
```

## 🏗️ Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # Express app setup
├── routes/
│   └── matches.ts        # Match endpoints
├── storage/
│   ├── MatchStorage.ts   # Storage interface
│   ├── DbMatchStorage.ts # PostgreSQL implementation
│   └── index.ts
└── validators/
    └── matchResultSchema.ts  # Light validation
```

## 🔄 Future Migration

This backend is designed to be **replaceable**. When ready to migrate to NestJS or a real database:

1. The CLI integration remains the same (just change the URL)
2. The `MatchStorage` interface stays - just swap implementations
3. No game logic means no complex migration

## ⚠️ Limitations

- **No pagination** - GET /matches returns ALL matches
- **No filtering** - no query parameters supported
- **No auth** - anyone can read/write
- **Security hardening still needed** - add auth, rate limits, and stricter CORS before public launch

These are intentional tradeoffs in the current iteration.

## 🎯 Development Philosophy

> "Do one thing well."

This backend stores and serves match data. Nothing more. All business logic, ranking, and matchmaking belong in their proper layers.

## 📦 Dependencies

- `express` - Web framework
- `cors` - CORS support
- `@infinite-ttt/shared` - Shared types

## 🧪 Next Steps

Once the backend is working:

1. ✅ Test with CLI integration
2. ✅ Verify data persistence
3. 🔲 Add proper database (Prisma + PostgreSQL)
4. 🔲 Migrate to NestJS architecture
5. 🔲 Add authentication
6. 🔲 Add real-time features

---

**Note:** This is STEP 10 of the Infinite TTT architecture. It provides the foundation for future multiplayer features without coupling gameplay to backend concerns.
