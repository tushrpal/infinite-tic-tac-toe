# @infinite-ttt/shared

🔒 **FROZEN GAMEPLAY APIs**

This package contains the stable, frozen interfaces that define gameplay for Infinite Tic-Tac-Toe. All other packages (engine, bots, UI, backend) depend on these types.

## 🎯 Purpose

Lock down what gameplay means so that:

- ✅ Backend never needs to know rules
- ✅ Frontend never needs to guess logic
- ✅ Leaderboard never needs engine access
- ✅ Bots never depend on UI

## 📦 The 4 Frozen APIs

### 1️⃣ **GameState** - Single Source of Truth

```typescript
interface GameState {
  board: Cell[]; // flat array (length = N*N)
  boardSize: number; // N (3, 4, 5...)
  currentPlayer: Player; // "X" | "O"
  moves: Move[]; // ordered history
  winner: Player | null; // game outcome
  isGameOver: boolean; // terminal state
}
```

**Rules:**

- ❌ No UI fields
- ❌ No ranking fields
- ❌ No bot hints
- ✅ Engine owns this fully

### 2️⃣ **Move** - Atomic Action

```typescript
interface Move {
  index: number; // 0 to N*N-1
  player: Player; // "X" | "O"
  turn: number; // incremental
  timestamp?: number; // optional, UI only
}
```

**Rules:**

- ❌ No scoring
- ❌ No validation state
- ❌ No UI metadata
- ✅ Immutable gameplay fact

### 3️⃣ **GameResult** - Round Outcome

```typescript
interface GameResult {
  winner: Player | null; // null = draw
  totalMoves: number;
  boardSize: number;
  moves: Move[];
}
```

**Why this matters:**

- Mode 2 has multiple rounds
- Replays are round-based
- Draws are explicit

### 4️⃣ **MatchResult** - Session Outcome (MOST IMPORTANT)

```typescript
interface MatchResult {
  matchId: string;
  mode: "mode1" | "mode2";
  isRanked: boolean;
  difficulty: "easy" | "medium" | "hard";
  players: MatchPlayer[];
  games: GameResult[];
  winner: string | null; // playerId
  roundsPlayed: number;
  totalMoves: number;
  drawCount: number;
  createdAt: number;
}
```

**Critical Rules:**

- ❌ No rank points
- ❌ No ELO
- ❌ No leaderboard logic
- ✅ Pure facts only

This is what leaderboards, backend, and analytics consume.

## 🔒 Stability Guarantee

These types are **FROZEN**. They will not change shape without a major version bump.

"Frozen" means:

- ✅ Stable interfaces
- ✅ Predictable data contracts
- ✅ Clear ownership boundaries
- ❌ NOT "no new features ever"

## 📥 Installation

```bash
pnpm add @infinite-ttt/shared
```

## 🎯 Usage

```typescript
import type {
  GameState,
  Move,
  GameResult,
  MatchResult,
} from "@infinite-ttt/shared";

// Your code here
```

## 🏗️ Build

```bash
pnpm run build
```

## 📄 License

MIT
