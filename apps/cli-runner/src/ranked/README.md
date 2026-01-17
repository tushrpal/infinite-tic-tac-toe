# Ranked System

A complete ranked match system for Infinite Tic-Tac-Toe with performance-weighted rank deltas and full match flow orchestration.

## Overview

This module provides:

- ✅ **Ranking logic** - Deterministic rank calculation (Step 6)
- ✅ **Match flow** - Complete pre/post match orchestration (Step 7)
- ✅ **In-memory sessions** - Local player state (no persistence)
- ✅ **Bot fallback** - Automatic opponent resolution
- ✅ **UX components** - Preview and summary displays

## Quick Start

```typescript
import {
  RankedMatchController,
  createRankedSession,
} from "@infinite-ttt/cli-runner/ranked";

// 1. Create session
const session = createRankedSession("PlayerName");
const controller = new RankedMatchController(session);

// 2. Pre-match preview
const { opponent, previewText } = controller.preMatch(1); // Mode 1
console.log(previewText);

// 3. Play match (your game logic)
const matchResult = await playGame(opponent);

// 4. Post-match summary
const { summaryText } = controller.postMatch(matchResult, opponent);
console.log(summaryText);
```

## Architecture

### Two-Layer Design

**Layer 1: Ranking Logic (Step 6)**

- Pure functions for rank calculation
- Deterministic and replay-safe
- Performance-weighted deltas

**Layer 2: Match Flow (Step 7)**

- Orchestration and UX
- Session management
- Pre/post match displays

### Core Principle

**Ranking is derived, never stored.** The same match will always produce the same rank outcome.

### Key Types

```typescript
// 5 rank tiers
type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

// Player state (derived, not stored)
interface RankedPlayer {
  playerId: string;
  points: number;
  tier: RankTier;
  isBot: boolean;
  botDifficulty?: "easy" | "medium" | "hard";
}

// In-memory session (Step 7)
interface RankedSession {
  player: RankedPlayer;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

// Pre-match context
interface RankedMatchContext {
  player1: RankedPlayer;
  player2: RankedPlayer;
  isRanked: boolean;
  mode: 1 | 2;
}

// Rank change result
interface RankDelta {
  playerId: string;
  pointsChange: number;
  outcome: "win" | "loss" | "draw";
  performanceMultiplier: number;
  vsBot: boolean;
  botPenaltyApplied: boolean;
  modeMultiplier: number;
  explanation: string;
}
```

## Rank Tiers

| Tier     | Points Range |
| -------- | ------------ |
| Bronze   | 0 - 999      |
| Silver   | 1000 - 1999  |
| Gold     | 2000 - 2999  |
| Platinum | 3000 - 3999  |
| Diamond  | 4000+        |

## Ranked Match Rules

A match is ranked if and only if `match.isRanked === true`.

**Ranked matches can be:**

- Human vs Human
- Human vs Bot (fallback only)

**Bots never receive rank points.**

### Bot Fallback

When no human opponent is available, bots can be used:

| Player Tier | Bot Difficulty |
| ----------- | -------------- |
| Bronze      | Easy           |
| Silver      | Medium         |
| Gold        | Medium         |
| Platinum+   | Hard           |

**Bot rank behavior:**

- ✅ Bot never gains rank
- ⚠️ Winning vs bot gives **reduced gain** (0.6x multiplier)
- ❌ Losing vs bot gives **full loss** (no reduction)

## Ranking Algorithm

### 1. Base Points

```typescript
const BASE_WIN = +30;
const BASE_LOSS = -30;
const BASE_DRAW = 0;
```

### 2. Performance Multiplier (0.8 - 1.3)

Based on match performance signals:

**Mode 1 (Infinite 3x3):**

- Faster wins → Higher multiplier
- Quick losses → Lower multiplier

| Scenario      | Total Moves | Multiplier |
| ------------- | ----------- | ---------- |
| Perfect win   | ≤ 5         | 1.3        |
| Very fast win | ≤ 10        | 1.25       |
| Standard win  | > 40        | 1.0        |
| Long loss     | > 40        | 1.0        |
| Quick loss    | < 10        | 0.8        |

**Mode 2 (Expanding Board):**

- Round margin (rounds won - rounds lost)
- Draw count

| Scenario     | Round Margin | Draws | Multiplier |
| ------------ | ------------ | ----- | ---------- |
| Dominant win | +3           | 0     | 1.3        |
| Solid win    | +2           | 0     | 1.2        |
| Narrow win   | +1           | 0     | 1.1        |
| Close loss   | -1           | -     | 0.9        |
| Blowout loss | -3           | -     | 0.8        |

### 3. Mode Multiplier

```typescript
const MODE_MULTIPLIERS = {
  mode1: 1.0, // Infinite 3x3
  mode2: 1.5, // Expanding Board (more complex)
};
```

### 4. Bot Penalty

```typescript
const BOT_WIN_PENALTY = 0.6; // Applied only to wins vs bots
```

### 5. Final Calculation

```typescript
finalPoints = BASE * performanceMultiplier * modeMultiplier * botMultiplier;

// Clamped to fair ranges:
// Wins: 25-40 points
// Losses: -40 to -25 points
```

## Usage Examples

### Computing Rank Delta

```typescript
import {
  computeRankDelta,
  createRankedMatchContext,
  createRankedPlayer,
} from "@infinite-ttt/cli-runner/ranked";

// Create pre-match context
const player1 = createRankedPlayer("alice", 1500, "Silver");
const player2 = createRankedPlayer("bob", 1600, "Silver");
const context = createRankedMatchContext(player1, player2, true, 1);

// Compute rank delta from match result
const delta = computeRankDelta(matchResult, "alice", context);

console.log(delta);
// {
//   playerId: "alice",
//   pointsChange: 39,
//   outcome: "win",
//   performanceMultiplier: 1.3,
//   vsBot: false,
//   botPenaltyApplied: false,
//   modeMultiplier: 1.0,
//   explanation: "Win: base=30, perf=1.30x, mode=1.0x → 39 points"
// }
```

### Applying Rank Delta

```typescript
import { applyRankDelta } from "@infinite-ttt/cli-runner/ranked";

const result = applyRankDelta(1500, delta);

console.log(result);
// {
//   newPoints: 1539,
//   newTier: "Silver",
//   previousTier: "Silver",
//   promoted: false,
//   demoted: false
// }
```

### Detecting Promotions

```typescript
const player = createRankedPlayer("charlie", 980, "Bronze");
// ... player wins a match ...
const delta = computeRankDelta(match, "charlie", context);
const result = applyRankDelta(980, delta);

if (result.promoted) {
  console.log(`🎉 Promoted to ${result.newTier}!`);
}
```

## Match Flow (Step 7)

### Complete Ranked Match

```typescript
import {
  RankedMatchController,
  createRankedSession,
} from "@infinite-ttt/cli-runner/ranked";

// Initialize session
const session = createRankedSession("Alice");
const controller = new RankedMatchController(session);

// Execute complete match flow
const result = await controller.executeRankedMatch(
  1, // Mode 1
  async (opponent) => {
    // Your game logic here
    return matchResult;
  },
);

console.log(`Points: ${result.summary.delta.pointsChange}`);
console.log(`New rank: ${result.updatedSession.player.tier}`);
```

### Manual Control (3 Phases)

```typescript
// Phase 1: Pre-match
const { opponent, previewText } = controller.preMatch(1);
console.log(previewText);
// Shows rank, opponent, expected point changes

// Phase 2: Match execution (your game loop)
const matchResult = await playGame(opponent);

// Phase 3: Post-match
const { summaryText } = controller.postMatch(matchResult, opponent);
console.log(summaryText);
// Shows result, performance, rank change
```

### Preview Output

```
🏆 RANKED MATCH
══════════════════════════════════════════════════
Your Rank: Gold (2500 pts)
Opponent: Bot (medium)
Mode: Mode 2

⭐ 500 points until Platinum!

Expected Rank Change:
  Win: +27 to +40
  Loss: -40 to -25

⚠️  Bot fallback: Wins give reduced points (60%)
══════════════════════════════════════════════════
```

### Summary Output

```
📊 RANK UPDATE
══════════════════════════════════════════════════
🎉 Result: VICTORY
⚡ Performance: Dominant
📈 Rank Change: +34
🏆 Rank: Gold (2534 pts)

💭 Win: base=30, perf=1.30x, mode=1x → 34 points
══════════════════════════════════════════════════
```

### Session Management

```typescript
// Create with custom starting points
const session = createRankedSessionWithPoints("Bob", 1500);

// Get stats
const stats = getSessionStats(session);
console.log(stats.winRate); // "75.0%"

// Show status
console.log(controller.showRankStatus());
```

## Examples

### Run Flow Examples

```bash
pnpm exec tsx src/ranked/flowExamples.ts
```

**Demonstrates:**

- Basic ranked match flow
- Progression with promotion
- Mode 2 dominant win
- Loss with demotion
- Draw handling
- All-in-one execution

### Run Logic Examples

```bash
pnpm exec tsx src/ranked/examples.ts
```

**Demonstrates:**

- Performance multipliers
- Bot penalties
- Mode multipliers
- Promotions/demotions

## Testing

```bash
pnpm test ranked.test.ts
```

**Test coverage:**

- ✅ Tier boundaries and bot difficulty mapping
- ✅ Performance multipliers (Mode 1 & Mode 2)
- ✅ Rank delta computation (wins, losses, draws)
- ✅ Bot penalty application
- ✅ Mode multiplier scaling
- ✅ Clamping to valid ranges
- ✅ Promotion and demotion detection
- ✅ Integration scenarios

## Design Guarantees

1. **Deterministic**: Same match → same rank outcome
2. **Replay-safe**: Can recompute rank from match history
3. **Fair**: No farming, no extreme swings (25-40 point ranges)
4. **Explainable**: Each delta includes explanation string
5. **Auditable**: Full transparency in calculations
6. **Scalable**: Supports offline simulation and backend sync (later)

## Future Extensions

This ranked system is designed to support:

- ✅ Offline simulation
- ✅ Replay audit
- ✅ Fair disputes
- 🔜 Seasonal resets
- 🔜 Backend sync
- 🔜 Leaderboards
- 🔜 Matchmaking integration

## Rules Summary

| Feature                | Value                  |
| ---------------------- | ---------------------- |
| Base win               | +30                    |
| Base loss              | -30                    |
| Base draw              | 0                      |
| Performance multiplier | 0.8 - 1.3              |
| Mode 1 multiplier      | 1.0x                   |
| Mode 2 multiplier      | 1.5x                   |
| Bot win penalty        | 0.6x                   |
| Win point range        | 25 - 40                |
| Loss point range       | -40 to -25             |
| Minimum points         | 0 (cannot go negative) |

## Non-Goals

❌ Backend APIs  
❌ Online matchmaking  
❌ WebSockets / timers  
❌ UI changes  
❌ Rank persistence  
❌ Engine or bot changes  
❌ Modifying `MatchResult`

This module provides **logic only**. Integration with UI, storage, and networking is out of scope.
