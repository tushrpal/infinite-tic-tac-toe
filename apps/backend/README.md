# Infinite TTT - Minimal Backend

A minimal Express backend for storing and serving MatchResult data from Infinite Tic-Tac-Toe games.

## 🎯 Purpose

This backend does **exactly three things**:

1. ✅ Accept `MatchResult` via POST
2. ✅ Store it in JSON
3. ✅ Serve it back via GET

**What it does NOT do:**

- ❌ No game logic
- ❌ No ranking calculations
- ❌ No matchmaking
- ❌ No authentication
- ❌ No real-time sockets
- ❌ No gameplay validation

Think of it as a **recorder**, not a brain.

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

## 🎮 Integration with CLI

Run the CLI with backend storage:

```bash
# From repo root
pnpm dev --backend-url=http://localhost:3000

# Run multiple games
pnpm dev --games 10 --backend-url=http://localhost:3000

# Mode 2 with backend
pnpm dev --mode 2 --backend-url=http://localhost:3000
```

## 📁 Data Storage

Match data is stored in `data/matches.json` (gitignored).

**Important:** This is a simple JSON file - not suitable for production. It will be replaced with a real database later.

## 🔧 Configuration

### Port

Set via environment variable:

```bash
PORT=4000 pnpm start
```

Default: `3000`

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
│   ├── MatchStore.ts     # Storage interface
│   ├── LocalJsonMatchStore.ts  # JSON implementation
│   └── index.ts
└── validators/
    └── matchResultSchema.ts  # Light validation
```

## 🔄 Future Migration

This backend is designed to be **replaceable**. When ready to migrate to NestJS or a real database:

1. The CLI integration remains the same (just change the URL)
2. The `MatchStore` interface stays - just swap implementations
3. No game logic means no complex migration

## ⚠️ Limitations

- **Single file storage** - concurrent writes may cause issues
- **No pagination** - GET /matches returns ALL matches
- **No filtering** - no query parameters supported
- **No auth** - anyone can read/write
- **Dev only** - not production-ready

These are intentional. This is a **minimal prototype** for development.

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
