# Local Leaderboard System

## 🎯 Purpose

A **derived, read-only** leaderboard system that aggregates statistics from stored `MatchResult` data.

## ✅ What It Is

- 100% computed from `MatchStore`
- Mode-aware (Mode 1 & Mode 2)
- Difficulty-aware
- Filterable
- Recomputable anytime
- **No stored state**

## ❌ What It's NOT

- NOT a persistent ranking system
- NOT ELO/MMR/rank points
- NOT a backend API
- NOT matchmaking
- NOT a mutation of match data

## 📁 Architecture

```
apps/cli-runner/src/leaderboard/
├── LeaderboardEntry.ts      # Data model (derived stats)
├── computeLeaderboard.ts    # Pure computation logic
├── printLeaderboard.ts      # CLI formatting
├── filters.ts               # Filtering utilities
└── index.ts                 # Public API
```

## 🧩 Core Concepts

### LeaderboardEntry

Represents a single player's aggregated statistics:

```typescript
interface LeaderboardEntry {
  playerId: string;
  playerType: "human" | "bot";
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // derived: wins / gamesPlayed
  mode: GameMode;
  difficulty?: Difficulty;
}
```

### Computation Rules

1. **Aggregate per player**: Sum all matches for each unique player ID
2. **Filter by mode/difficulty**: Only count matches that match filters
3. **Draw = no winner**: If `match.winner === null`, it's a draw
4. **Win**: Player participated and `match.winner === playerId`
5. **Loss**: Player participated but didn't win (and not a draw)
6. **Win rate**: `wins / gamesPlayed`

### Sorting

- **Primary**: Win rate (descending)
- **Secondary**: Games played (descending) for stable ordering

## 🚀 Usage

### CLI Commands

```bash
# Show full leaderboard (all modes, all difficulties)
pnpm dev --leaderboard

# Filter by mode
pnpm dev --leaderboard --mode mode1
pnpm dev --leaderboard --mode mode2

# Filter by difficulty
pnpm dev --leaderboard --difficulty easy
pnpm dev --leaderboard --difficulty medium
pnpm dev --leaderboard --difficulty hard

# Combined filters
pnpm dev --leaderboard --mode mode2 --difficulty hard

# Summary view (no table)
pnpm dev --leaderboard --summary
```

### Programmatic Usage

```typescript
import { showLeaderboard } from "./leaderboard/index.js";
import { createLocalMatchStore } from "./storage/index.js";

const matchStore = createLocalMatchStore();

// Show full leaderboard
await showLeaderboard(matchStore);

// With filters
await showLeaderboard(matchStore, {
  mode: "mode1",
  difficulty: "hard",
});

// Summary only
await showLeaderboard(matchStore, undefined, true);
```

### Direct Computation

```typescript
import { computeLeaderboard } from "./leaderboard/computeLeaderboard.js";

const matches = await matchStore.getAll();

// Compute entries
const entries = computeLeaderboard(matches, {
  mode: "mode1",
  difficulty: "medium",
});

// Use the data
console.log(`Top player: ${entries[0].playerId}`);
```

## 🧪 Validation

### Verifying Read-Only Behavior

The leaderboard never modifies:

- ✅ Match data
- ✅ Storage files
- ✅ Game state
- ✅ Bot logic

### Verifying Recomputability

Same input → same output (always):

```bash
# Run leaderboard multiple times
pnpm dev --leaderboard
pnpm dev --leaderboard
pnpm dev --leaderboard

# Results should be identical every time
```

### Verifying Derivation

Deleting matches resets leaderboard:

```bash
# Before: Leaderboard shows data
pnpm dev --leaderboard

# Delete matches
rm data/matches.json

# After: Leaderboard is empty
pnpm dev --leaderboard
# Output: "No matches found matching the filters."
```

## 🔌 Integration Points

### Current

- CLI runner (`apps/cli-runner/src/index.ts`)
- Match storage (`apps/cli-runner/src/storage/`)

### Future (Not Yet Implemented)

- Backend API sync
- Seasonal resets
- ELO/MMR ranking
- PvP matchmaking queues
- Mobile/web display

## 📊 Example Output

### Full Leaderboard

```
════════════════════════════════════════════════════════════
🏆 LOCAL LEADERBOARD — MODE1 — MEDIUM
════════════════════════════════════════════════════════════
Matches analyzed: 12
────────────────────────────────────────────────────────────
Player                 Games   Wins  Losses  Draws      Win%
────────────────────────────────────────────────────────────
human                     12      7       4      1     58.3%
bot-hard                  10      6       4      0     60.0%
bot-medium                 8      3       5      0     37.5%
════════════════════════════════════════════════════════════
```

### Summary View

```
════════════════════════════════════════════════════════════
📊 LEADERBOARD SUMMARY — ALL MODES
════════════════════════════════════════════════════════════
Total Players: 3
Total Games: 30

👑 Top Player: bot-hard (60.0% win rate)
════════════════════════════════════════════════════════════
```

## 🏗️ Design Principles

### Pure Functions

All computation is deterministic:

- No side effects
- No I/O (except reading from MatchStore)
- No random values
- No timestamps (except from stored matches)

### Separation of Concerns

- **Computation**: `computeLeaderboard.ts`
- **Filtering**: `filters.ts`
- **Display**: `printLeaderboard.ts`
- **Orchestration**: `index.ts`

### Future-Proof

This local leaderboard can be safely replaced by:

- Backend API leaderboard
- Real-time ranked system
- ELO-based matchmaking

Without changing:

- Match storage format
- Game engine
- Bot logic
- Frozen types

## 🔒 Rules (STRICT)

1. **Never write data**: Leaderboard is read-only
2. **Never modify matches**: Matches are immutable to leaderboard
3. **Never cache results**: Always recompute from matches
4. **Never store rankings**: Rankings are temporary and local
5. **Never add rank points**: No ELO, MMR, or rank fields

## 🚦 What This Unlocks

After this step, you can safely add:

- ✅ Backend leaderboard sync
- ✅ Seasonal resets
- ✅ Ranked matchmaking
- ✅ ELO/MMR systems
- ✅ PvP queues
- ✅ Bot difficulty scaling by rank

All without refactoring this foundation.

## 📝 Notes

- Leaderboard computes win rate as `wins / gamesPlayed`
- Draws count toward `gamesPlayed` but not `wins`
- Players with 0 games have 0% win rate
- Sorting is stable (deterministic ordering for ties)
- Filters are composable (can combine mode + difficulty)

## 🎓 Example Use Cases

### 1. Weekly Progress Check

```bash
# Check your progress this week
pnpm dev --leaderboard --mode mode1
```

### 2. Bot Performance Analysis

```bash
# Compare bot difficulties
pnpm dev --leaderboard --difficulty easy
pnpm dev --leaderboard --difficulty medium
pnpm dev --leaderboard --difficulty hard
```

### 3. Mode Comparison

```bash
# Mode 1 vs Mode 2 performance
pnpm dev --leaderboard --mode mode1
pnpm dev --leaderboard --mode mode2
```

### 4. Quick Stats

```bash
# Just show summary
pnpm dev --leaderboard --summary
```

## 🧠 Implementation Details

### Why No Pagination?

Current implementation shows all entries. Pagination can be added later without changing the core logic.

### Why No Rank Field?

Rank is implicitly derived from array position. Adding explicit rank numbers can happen in display layer if needed.

### Why Pure Functions?

Pure functions are:

- Testable
- Predictable
- Cacheable (future optimization)
- Parallelizable (future scaling)

### Why Separate Files?

Each file has a single responsibility:

- Easy to test in isolation
- Easy to replace/extend
- Clear boundaries
- Reduced coupling
