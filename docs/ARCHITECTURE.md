# Architecture Overview

Complete system architecture documentation for Infinite Tic-Tac-Toe.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Component Diagram](#component-diagram)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Package Architecture](#package-architecture)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Schema](#database-schema)
- [Real-time Architecture](#real-time-architecture)
- [Authentication Flow](#authentication-flow)
- [Game Engine Design](#game-engine-design)
- [Scaling Strategy](#scaling-strategy)
- [Design Decisions](#design-decisions)

---

## System Overview

Infinite Tic-Tac-Toe is a **monorepo-based** full-stack application with a **shared game engine** consumed by multiple clients.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Monorepo                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Web App    │  │   Backend    │  │  CLI Runner  │  │
│  │  (Next.js)   │  │  (Express)   │  │   (Node.js)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         │  ┌───────────────┴──────────────────┘          │
│         │  │                                              │
│         ▼  ▼                                              │
│  ┌─────────────────────────────────────────────┐         │
│  │           Shared Packages                    │         │
│  │  ┌──────────┐  ┌──────┐  ┌────────┐        │         │
│  │  │  Engine  │  │ Bots │  │ Shared │        │         │
│  │  └──────────┘  └──────┘  └────────┘        │         │
│  └─────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │    External Services            │
        │  ┌──────────┐  ┌─────────┐    │
        │  │PostgreSQL│  │  Redis  │    │
        │  └──────────┘  └─────────┘    │
        │  ┌──────────┐  ┌─────────┐    │
        │  │  Google  │  │ Discord │    │
        │  │  OAuth   │  │  OAuth  │    │
        │  └──────────┘  └─────────┘    │
        └────────────────────────────────┘
```

---

## Architecture Principles

### 1. One Shared Game Engine

**Principle:** All game rules live in `packages/game-engine`. No exceptions.

**Why:**
- Single source of truth
- Consistent gameplay across all clients
- Easy to test in isolation
- No client/server rule divergence

**Example:**
```typescript
// ✅ Correct: All clients use the same engine
import { Modes } from '@infinite-ttt/game-engine';
const state = Modes.Infinite3x3.applyMove(state, move);

// ❌ Wrong: Duplicating game logic
if (board[row][col] === null) { ... } // Don't reinvent the wheel
```

---

### 2. Framework-Agnostic Core

**Principle:** The engine has zero dependencies on UI frameworks, network code, or databases.

**Why:**
- Portable to any platform (web, mobile, CLI)
- Easier to test
- Simpler to reason about
- Future-proof

**Dependencies:**
```json
// packages/game-engine/package.json
{
  "dependencies": {} // Completely empty!
}
```

---

### 3. Deterministic State Transitions

**Principle:** Same inputs always produce same outputs. No randomness in engine.

**Why:**
- Replay system works perfectly
- Testing is predictable
- Easy to debug
- Server can validate client moves

**Example:**
```typescript
// Deterministic
const state1 = applyMove(initialState, { row: 1, col: 1 });
const state2 = applyMove(initialState, { row: 1, col: 1 });
assert(deepEqual(state1, state2)); // Always true

// Randomness belongs in consumers (bots), not the engine
```

---

### 4. Immutable State

**Principle:** All state transitions return new state objects.

**Why:**
- React-friendly (reference equality)
- Enables undo/redo
- Thread-safe
- Easier debugging

**Example:**
```typescript
// ✅ Immutable
const newState = { ...oldState, currentTurn: oldState.currentTurn + 1 };

// ❌ Mutable
oldState.currentTurn++; // Don't mutate!
```

---

### 5. Consumer Pattern

**Principle:** 
- UIs **consume** the engine
- Bots **consume** the engine
- Server **validates** using the engine
- Nobody **modifies** the engine for convenience

**Why:**
- Clear separation of concerns
- Engine stays pure and testable
- Prevents coupling

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App (apps/web)                              │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Pages     │  │ Components  │  │    Hooks    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Providers │  │  API Client │  │  WebSocket  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────┬───────────────────────────────┘   │
└────────────────────────┬─┴───────────────────────────────────┘
                         │
                    HTTP / WS
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                         Backend                               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Express API (apps/backend)                          │    │
│  │                                                       │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │    │
│  │  │ Routes  │  │ Services │  │ Managers │  │  WS  │  │    │
│  │  └─────────┘  └──────────┘  └──────────┘  └──────┘  │    │
│  │                                                       │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Storage │  │  Rating  │  │   Auth   │            │    │
│  │  └─────────┘  └──────────┘  └──────────┘            │    │
│  └───────────────────────┬───────────────────────────────┘    │
└──────────────────────────┴───────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
┌───────────────▼──────┐  ┌──────────▼──────────┐
│   PostgreSQL         │  │      Redis          │
│   (Persistent Data)  │  │  (Active Matches)   │
└──────────────────────┘  └─────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Shared Packages                            │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │Game Engine  │  │    Bots     │  │   Shared    │          │
│  │ (Pure TS)   │  │ (Consumers) │  │   (Types)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Match Creation & Gameplay Flow

```
┌──────────┐                                     ┌──────────┐
│ Player X │                                     │ Player O │
└─────┬────┘                                     └────┬─────┘
      │                                               │
      │ 1. POST /pvp/match                            │
      │    {playerId, mode}                           │
      ├──────────────────────────►┌─────────┐        │
      │                            │ Backend │        │
      │ 2. Match created           │         │        │
      │    {matchId, role: X}      └────┬────┘        │
      │◄───────────────────────────     │             │
      │                                  │             │
      │                                  │ Store in    │
      │                                  │ Redis       │
      │                                  ▼             │
      │                            ┌─────────┐        │
      │                            │  Redis  │        │
      │                            └─────────┘        │
      │                                               │
      │                            3. POST /pvp/match │
      │                               {playerId, mode}│
      │                            ◄──────────────────┤
      │                            ┌─────────┐        │
      │                            │ Backend │        │
      │                            └────┬────┘        │
      │                                 │             │
      │                                 │ Join match  │
      │                                 │ as O        │
      │                                 ▼             │
      │ 4. WS: Match Active             │             │
      │    {players: {X, O}}            │             │
      │◄────────────────────────────────┼─────────────►
      │                                 │             │
      │ 5. Make move                    │             │
      │    applyMove(state, move)       │             │
      ├──────────────────────►┌─────────┴─────┐      │
      │                       │   WebSocket    │      │
      │                       │   Broadcast    │      │
      │ 6. State update       └─────────┬─────┘      │
      │◄──────────────────────────────┬─┘            │
      │                                └──────────────►
      │                                               │
      │                         7. O makes move       │
      │                         ◄─────────────────────┤
      │◄──────────────────────────────────────────────┤
      │ 8. State update                               │
      │                                               │
      ▼                                               ▼
   (Continue until winner)
```

---

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  User    │                                    │ Frontend │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │ 1. Click "Login with Google"                 │
     ├──────────────────────────────────────────────►
     │                                               │
     │                          2. Redirect to Google│
     │                          ◄────────────────────┤
     │                                               │
┌────▼─────┐                                        │
│  Google  │ 3. User authorizes                     │
└────┬─────┘                                        │
     │                                               │
     │ 4. Redirect back with code                   │
     │                          ─────────────────────►
     │                          ┌─────────┐         │
     │                          │NextAuth │         │
     │                          └────┬────┘         │
     │                               │              │
     │                               │ 5. Exchange  │
     │                               │    code for  │
     │                               │    tokens    │
     │                          ◄────┴────────────► │
     │                          ┌─────────┐         │
     │                          │ Google  │         │
     │                          └─────────┘         │
     │                                               │
     │                          6. Create/Find User │
     │                          ┌─────────┐         │
     │                          │ Backend │         │
     │                          └────┬────┘         │
     │                               │              │
     │                               ▼              │
     │                          ┌─────────┐         │
     │                          │   DB    │         │
     │                          └─────────┘         │
     │                                               │
     │ 7. Session cookie                            │
     │◄──────────────────────────────────────────────
     │                                               │
     │ 8. Authenticated requests                    │
     │    (Cookie: session-token)                   │
     ├──────────────────────────────────────────────►
     ▼                                               ▼
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Auth:** NextAuth.js
- **State:** React Context + Hooks
- **Forms:** Native HTML5
- **HTTP Client:** Fetch API
- **WebSocket:** Native WebSocket API

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **WebSocket:** ws library
- **Database ORM:** Prisma
- **Auth:** OAuth 2.0 (Google, Discord)
- **Session:** JWT tokens
- **Validation:** Custom validators

### Database & Cache
- **Primary DB:** PostgreSQL 14+
- **Cache/Queue:** Redis 6+
- **Migrations:** Prisma Migrate

### DevOps
- **Monorepo:** pnpm Workspaces
- **Build:** Turborepo
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest
- **Linting:** ESLint
- **Formatting:** Prettier
- **CI/CD:** GitHub Actions (planned)
- **Hosting:** Vercel (frontend), Railway (backend)

---

## Package Architecture

### Monorepo Structure

```
infinite-ttt/
├── apps/                      # Applications
│   ├── backend/              # Express API
│   ├── web/                  # Next.js web app
│   ├── cli-runner/           # CLI tool
│   └── mobile/               # React Native (planned)
│
├── packages/                  # Shared packages
│   ├── game-engine/          # Core game logic
│   ├── bots/                 # AI opponents
│   ├── identity/             # Player identity
│   └── shared/               # Common types
│
├── docs/                     # Documentation
├── pnpm-workspace.yaml       # Workspace config
├── turbo.json                # Turborepo config
└── package.json              # Root config
```

### Package Dependencies

```
┌─────────────────┐
│   game-engine   │ (no dependencies)
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    │          │          │          │
┌───▼───┐  ┌──▼──┐  ┌────▼────┐  ┌──▼──────┐
│ bots  │  │ web │  │ backend │  │cli-runner│
└───────┘  └─────┘  └─────────┘  └──────────┘
```

**Dependency Rules:**
- `game-engine` has NO dependencies (pure TypeScript)
- All other packages can depend on `game-engine`
- Applications can depend on any package
- Packages cannot depend on applications

---

## Backend Architecture

### Layer Architecture

```
┌────────────────────────────────────────────┐
│             Routes Layer                    │
│  (HTTP endpoints, request validation)       │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│           Services Layer                    │
│  (Business logic, orchestration)            │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│           Storage Layer                     │
│  (Database access, Redis operations)        │
└────────────────┬───────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼──────┐  ┌──────▼────────┐
│  PostgreSQL   │  │     Redis     │
└───────────────┘  └───────────────┘
```

### Key Components

**1. Match Manager**
- Manages active match state
- Stores matches in Redis
- Handles match lifecycle

**2. Matchmaking Service**
- Queues waiting players
- Pairs opponents
- Creates matches

**3. Rating Service**
- Calculates ELO changes
- Updates player ratings
- Tracks rating history

**4. WebSocket Manager**
- Maintains active connections
- Broadcasts state updates
- Handles connection lifecycle

**5. Storage Layer**
- Prisma for PostgreSQL
- Redis client for cache
- Abstracts data access

---

## Frontend Architecture

### Component Hierarchy

```
App (layout.tsx)
│
├─ Providers (Theme, Auth, Player)
│
├─ Navigation
│
└─ Page
   │
   ├─ Board
   │  ├─ Cell
   │  └─ WinLine
   │
   ├─ HUD
   │  ├─ PlayerInfo
   │  ├─ TurnIndicator
   │  └─ GameControls
   │
   └─ Modals
      ├─ GameOverModal
      └─ MatchmakingModal
```

### State Management

**Global State (Context):**
- Auth state (NextAuth)
- Theme preference
- Player profile

**Local State (useState):**
- Game state
- UI state
- Form inputs

**Server State (WebSocket):**
- Match state
- Opponent moves
- Spectator count

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│   Player     │
│──────────────│
│ id (PK)      │
│ email        │
│ displayName  │
│ ratingMode1  │
│ ratingMode2  │
│ createdAt    │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────────┐
│  MatchPlayer     │
│──────────────────│
│ id (PK)          │
│ matchId (FK)     │
│ playerId (FK)    │
│ role (X/O)       │
│ ratingBefore     │
│ ratingAfter      │
│ ratingChange     │
└──────┬───────────┘
       │
       │ N:1
       │
┌──────▼───────┐         ┌──────────────┐
│   Match      │ 1:N     │  MatchMove   │
│──────────────│◄────────┤──────────────│
│ id (PK)      │         │ id (PK)      │
│ mode         │         │ matchId (FK) │
│ isRanked     │         │ moveNumber   │
│ winner       │         │ player       │
│ startedAt    │         │ row, col     │
│ completedAt  │         │ timestamp    │
│ durationMs   │         └──────────────┘
└──────────────┘
```

### Key Indexes

```sql
-- Player lookups
CREATE INDEX idx_player_email ON Player(email);
CREATE INDEX idx_player_rating_mode1 ON Player(ratingMode1 DESC);
CREATE INDEX idx_player_rating_mode2 ON Player(ratingMode2 DESC);

-- Match queries
CREATE INDEX idx_match_winner ON Match(winner);
CREATE INDEX idx_match_completed ON Match(completedAt DESC);
CREATE INDEX idx_match_mode ON Match(mode);

-- Player match history
CREATE INDEX idx_matchplayer_player ON MatchPlayer(playerId);
CREATE INDEX idx_matchplayer_match ON MatchPlayer(matchId);

-- Replay
CREATE INDEX idx_matchmove_match ON MatchMove(matchId, moveNumber);
```

---

## Real-time Architecture

### WebSocket Connection Management

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ ws://
       │
┌──────▼──────┐
│ WS Manager  │
└──────┬──────┘
       │
       ├─ Connection Map: {clientId → socket}
       ├─ Match Map: {matchId → [clientIds]}
       └─ Player Map: {playerId → clientId}
```

### Broadcast Patterns

**1. State Update (to all in match)**
```typescript
wsManager.broadcastStateUpdate(matchId, matchState);
// → Sends to all players + spectators
```

**2. Match Complete (to all)**
```typescript
wsManager.broadcastMatchComplete(matchId, result);
// → Final state, rating changes
```

**3. Player Status (to all)**
```typescript
wsManager.notifyPlayerConnected(matchId, playerId);
wsManager.notifyPlayerDisconnected(matchId, playerId);
```

### Message Queue

Currently in-memory, planned Redis Pub/Sub for horizontal scaling:

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│Backend #1│       │  Redis   │       │Backend #2│
│          │──pub──►  Pub/Sub │──sub──►          │
│          │       │          │       │          │
│  WS conn │       └──────────┘       │  WS conn │
└──────────┘                          └──────────┘
```

---

## Authentication Flow

### OAuth Provider Configuration

```typescript
// NextAuth.js configuration
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  }),
]
```

### Session Management

**JWT Token Structure:**
```json
{
  "sub": "player-uuid",
  "email": "user@example.com",
  "name": "PlayerOne",
  "iat": 1640995200,
  "exp": 1643587200
}
```

**Cookie:**
- Name: `next-auth.session-token`
- HttpOnly: true
- Secure: true (production)
- SameSite: Lax
- Max-Age: 30 days

---

## Game Engine Design

### Pure Function Architecture

```typescript
// State machine pattern
type State = {
  board: Cell[][];
  currentTurn: number;
  // ... other fields
};

type Move = {
  row: number;
  col: number;
};

// Pure functions only
function applyMove(state: State, move: Move): State {
  // No side effects
  // Returns new state
  return newState;
}
```

### Two-Mode Design

**Mode 1: Infinite 3×3**
- Fixed board size
- Sliding moves mechanism
- Optimal for quick games

**Mode 2: Expanding Board**
- Dynamic board size
- Round-based
- Progressive complexity

**Shared Interface:**
```typescript
interface GameMode {
  createInitialState(): State;
  isValidMove(state: State, move: Move): boolean;
  applyMove(state: State, move: Move): State;
  detectWinner(state: State): Mark | null;
}
```

---

## Scaling Strategy

### Phase 1: Single Instance (Current)

```
┌──────────┐
│ Backend  │
│ (1 inst) │
└────┬─────┘
     │
     ├──────────┐
     ▼          ▼
┌────────┐  ┌───────┐
│  Pg    │  │ Redis │
└────────┘  └───────┘
```

**Capacity:** ~100 concurrent matches

---

### Phase 2: Redis-backed State

```
┌──────────┐     ┌──────────┐
│Backend #1│     │Backend #2│
└────┬─────┘     └────┬─────┘
     │                │
     └────────┬───────┘
              │
         ┌────▼────┐
         │  Redis  │
         │ (State) │
         └─────────┘
```

**Changes:**
- Move match state from memory to Redis
- Enable multiple backend instances
- WebSocket sticky sessions required

**Capacity:** ~1,000 concurrent matches

---

### Phase 3: Load Balancer + Read Replicas

```
     ┌──────────┐
     │   LB     │
     └─────┬────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌────▼──┐
│Back #1│    │Back #2│
└───┬───┘    └───┬───┘
    │            │
    └──────┬─────┘
           │
    ┌──────┴─────┐
    │            │
┌───▼──┐    ┌───▼────┐
│PG RW │    │PG RO   │
└──────┘    └────────┘
```

**Capacity:** ~10,000 concurrent matches

---

## Design Decisions

### Why Monorepo?

**Pros:**
- Shared code across apps
- Single dependency tree
- Atomic commits across packages
- Easier refactoring

**Cons:**
- Larger repository
- Slightly complex build setup

**Decision:** Monorepo for code reuse and consistency

---

### Why Pure Game Engine?

**Pros:**
- Framework-agnostic
- Highly testable
- Portable to any platform
- Clear separation of concerns

**Cons:**
- More boilerplate in consumers
- Can't directly access UI

**Decision:** Purity for long-term maintainability

---

### Why WebSocket over Polling?

**Pros:**
- Real-time updates (<20ms latency)
- Less server load
- Better user experience
- Push-based

**Cons:**
- Slightly complex to scale
- Requires sticky sessions

**Decision:** WebSocket for real-time gameplay

---

### Why PostgreSQL over MongoDB?

**Pros:**
- ACID transactions
- Strong consistency
- Better for relational data (players, matches)
- Prisma ORM support

**Cons:**
- Less flexible schema

**Decision:** PostgreSQL for data integrity and relational structure

---

### Why Redis over In-memory?

**Pros:**
- Persistence across restarts
- Enables horizontal scaling
- Built-in Pub/Sub
- TTL support

**Cons:**
- Extra infrastructure
- Network latency

**Decision:** Redis for scalability and reliability

---

### Why TypeScript?

**Pros:**
- Type safety
- Better IDE support
- Catches errors at compile time
- Self-documenting code

**Cons:**
- Build step required
- Slightly verbose

**Decision:** TypeScript for safety and developer experience

---

### Why ELO Rating System?

**Pros:**
- Industry standard
- Simple to implement
- Works well for 1v1
- Player-tested

**Cons:**
- Can inflate over time
- Doesn't account for draws (rare in our game)

**Decision:** ELO for proven competitive ranking

---

## Security Architecture

### Threat Model

**Protected Against:**
- SQL injection (Prisma ORM)
- XSS (React escaping)
- CSRF (SameSite cookies)
- Session hijacking (HttpOnly cookies)
- Man-in-the-middle (HTTPS only)

**Planned:**
- Rate limiting
- DDoS protection
- API authentication for bots

---

## Performance Targets

### Response Times

- API endpoints: < 100ms (p95)
- Move submission: < 20ms (p95)
- WebSocket message: < 10ms
- Page load: < 2s (FCP)

### Throughput

- Concurrent matches: 100+ (current), 10,000+ (scaled)
- WebSocket connections: 200+ (current), 20,000+ (scaled)
- Database queries: 1,000 QPS

---

## Related Documentation

- [Main README](../README.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Backend README](../apps/backend/README.md)
- [Frontend README](../apps/web/README.md)
- [Game Engine README](../packages/game-engine/README.md)

---

**Last Updated:** 2024-01-01  
**Architecture Version:** 1.0.0
