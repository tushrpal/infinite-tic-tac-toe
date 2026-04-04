# Infinite Tic-Tac-Toe

A deep, strategic Tic-Tac-Toe game with no forced draws, powered by a shared TypeScript game engine.

## 🎯 Project Vision

Transform a simple mechanic (placing a mark) into a game with:

- Strategic depth
- No forced draws
- Competitive fairness
- Long-term replayability

## 📦 Monorepo Structure

```
infinite-ttt/
├── apps/
│   ├── cli-runner/     ✅ Bot-vs-Bot simulation tool
│   ├── web/            🔜 Next.js web app (planned)
│   ├── mobile/         🔜 React Native app (planned)
│   └── server/         🔜 Multiplayer server (planned)
│
└── packages/
    ├── game-engine/    ✅ Core game logic (Mode 1 complete)
    ├── bots/           ✅ AI opponents (Random & Heuristic)
    ├── identity/       ✅ Player identity system (no auth)
    └── shared/         ✅ Common types and utilities
```

## 🎮 Current Status

### ✅ Complete

- **Game Engine** - Mode 1: Infinite 3×3 (Sliding Moves)
  - Pure TypeScript state machine
  - Deterministic and framework-agnostic
  - 15/15 tests passing
- **Bot Implementations**
  - Random Bot (easy difficulty)
  - Heuristic Bot (medium difficulty)
  - 13/13 tests passing
- **Player Identity**
  - Stable player IDs (UUID-based)
  - Display name management
  - Local-first persistence
  - Backend-compatible
  - No authentication (by design)
- **CLI Runner** - Developer tool for testing and simulation
- **Backend API** - Match and player storage

### 🔜 Planned

- Mode 2 (Expanding Board)
- Advanced bot (minimax with alpha-beta pruning)
- Web UI (Next.js)
- Mobile UI (React Native)
- Multiplayer server
- Matchmaking & leaderboards

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Build Packages

```bash
cd packages/game-engine && pnpm build
cd packages/bots && pnpm build
```

### Run Tests

```bash
# Game Engine tests
cd packages/game-engine && pnpm test

# Bot tests
cd packages/bots && pnpm test
```

### Run CLI Bot-vs-Bot

```bash
cd apps/cli-runner

# Watch a single game
pnpm dev

# Run 100 games and see statistics
pnpm dev -- --games 100 --quiet

# Heuristic vs Heuristic
pnpm dev -- --x-bot heuristic --o-bot heuristic

# Watch with delay
pnpm dev -- --delay 500
```

## ☁️ Deployment Configuration

For cloud deployment, configure environment variables using:

- `apps/backend/.env.example`
- `apps/web/.env.example`

Backend requires:

- `DATABASE_URL`
- `REDIS_URL`
- `PORT`
- `WS_URL`

Frontend requires:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Production migration command:

```bash
pnpm --filter @infinite-ttt/backend prisma:migrate:deploy
```

## 🎲 Game Mode 1: Infinite 3×3 (Sliding Moves)

### Rules

- 3×3 fixed board
- Each player may have **maximum 3 marks** on the board
- On a player's **4th move**, their **oldest mark is removed automatically**
- First to form **3-in-a-row** wins immediately
- **No draws possible**

### Why It Works

- Forces dynamic play
- Creates strategic depth
- Eliminates draw states
- Makes every move count

## 👤 Player Identity System

**Philosophy: Identity ≠ Authentication** (for now)

The identity system provides stable player IDs and display names without requiring passwords, logins, or authentication.

### Features

- ✅ Stable player IDs (UUID)
- ✅ User-chosen display names
- ✅ Local persistence (`~/.infinite-ttt/player.json`)
- ✅ Backend-compatible API
- ✅ Works offline
- ✅ No authentication required

### First Run Experience

```bash
pnpm dev --interactive

# Prompts:
# → Enter your display name: Tushar
# ✅ Welcome, Tushar!
# 👤 Player: Tushar (id: e5340a4b...)
```

### Why No Authentication?

This is **intentional** for the current stage:

- Local-first architecture
- Offline gameplay
- No server dependency
- User owns their data

**Future:** When PvP arrives, authentication can be layered on top without breaking existing identities.

See [Identity Package Documentation](packages/identity/) for details.

## 🏗️ Architecture Principles

### 1. One Shared Game Engine

All game rules live in `packages/game-engine`. No exceptions.

### 2. Framework-Agnostic

The engine has **zero** dependencies on UI frameworks, network code, or databases.

### 3. Deterministic

Same inputs always produce same outputs. No randomness in engine.

### 4. Immutable State

All state transitions return new state objects.

### 5. Consumer Pattern

- UIs **consume** the engine
- Bots **consume** the engine
- Server **validates** using the engine
- Nobody **modifies** the engine for convenience

## 📚 Documentation

- [Game Engine](packages/game-engine/)
- [Bots](packages/bots/)
- [Identity System](packages/identity/)
- [CLI Runner](apps/cli-runner/)
- [Backend API](apps/backend/)

## 🧪 Testing

All packages have comprehensive test coverage. Run tests with:

```bash
cd packages/game-engine && pnpm test  # 15/15 passing
cd packages/bots && pnpm test          # 13/13 passing
```

## 🛠️ Development

This is a **pnpm workspace** managed by **Turborepo**.

### Package Scripts

Each package supports:

- `pnpm build` - Compile TypeScript
- `pnpm test` - Run tests
- `pnpm test:watch` - Watch mode

### Adding New Packages

1. Create under `packages/` or `apps/`
2. Add to `pnpm-workspace.yaml` (already wildcarded)
3. Reference as `"workspace:*"` in dependencies

## 📈 Bot Performance

Based on CLI simulations (10 games each):

| Matchup                | X Win Rate          | Average Turns |
| ---------------------- | ------------------- | ------------- |
| Heuristic vs Random    | ~90%                | 5.9 turns     |
| Heuristic vs Heuristic | 100% (first player) | 13 turns      |
| Random vs Random       | ~50%                | varies        |

_Note: Deterministic bots produce predictable results. First-player advantage exists._

## 📄 License

ISC

---

**Built with TypeScript • pnpm • Turborepo**

## Tech Stack

- TypeScript
- pnpm + Turborepo
- React / React Native (planned)
- Node.js backend (planned)

## Structure

apps/ → web, mobile, server  
packages/ → shared game-engine
