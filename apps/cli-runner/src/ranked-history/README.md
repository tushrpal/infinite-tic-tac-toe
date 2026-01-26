# Ranked Match History & Rank Timeline

**DERIVED ONLY** — Recomputed from stored matches on demand.

## 🎯 Purpose

This module provides a **read-only** view of:

- How a player's rank evolved over time
- Which matches caused rank changes
- Performance context for each match

## ⚠️ CRITICAL RULES

This is a **DERIVED** system:

- ✅ Reads from stored `MatchResult[]`
- ✅ Uses existing ranked logic (`computeRankDelta`, `applyRankDelta`)
- ❌ Does NOT store rank in files
- ❌ Does NOT mutate `MatchResult`
- ❌ Does NOT recalculate existing matches

## 📦 Key Types

### RankedMatchHistoryEntry

A single entry in a player's ranked match history.

```typescript
interface RankedMatchHistoryEntry {
  matchId: string;
  mode: "mode1" | "mode2";
  difficulty: "easy" | "medium" | "hard";
  opponentType: "human" | "bot";
  opponentLabel: string; // "Bot (Medium)" or "Player123"

  result: "win" | "loss" | "draw";
  performanceTag: "dominant" | "close" | "scrappy" | "draw";

  rankBefore: { tier: RankTier; points: number };
  rankAfter: { tier: RankTier; points: number };
  delta: number; // +34, -27, etc.

  playedAt: number; // Unix timestamp
}
```

### RankTimelinePoint

A point in the rank progression timeline.

```typescript
interface RankTimelinePoint {
  index: number; // Sequential index (0 = start)
  tier: RankTier; // Rank tier at this point
  points: number; // Exact rank points
  delta: number; // Change from previous point
  matchId: string; // Match that caused this change
}
```

## 🧩 Core Functions

### buildRankedHistory()

Build complete ranked match history for a player.

```typescript
const history = buildRankedHistory(matches, playerId, initialPoints);
```

**Algorithm:**

1. Start with initial rank (default: Bronze, 1000 points)
2. Filter for ranked matches involving player
3. Sort chronologically
4. For each match:
   - Compute delta using existing ranked logic
   - Apply delta to get new rank
   - Emit history entry
   - Update current rank for next iteration

**Key Properties:**

- Deterministic (same inputs → same outputs)
- Replay-safe (recomputes from scratch)
- Backend-ready (no local state dependencies)

### buildRankTimeline()

Build rank progression timeline from history.

```typescript
const timeline = buildRankTimeline(history, initialPoints);
```

Creates a sequential view:

- Point 0: Initial state (before matches)
- Point N: State after match N

### computePerformanceTag()

Determine performance quality (UX only, doesn't affect rank).

**Mode 1 Rules:**

- ≤5 moves → "dominant"
- 6-7 moves → "close"
- ≥8 moves → "scrappy"

**Mode 2 Rules:**

- 2-0 win (no draws) → "dominant"
- 2-1 win (no draws) → "close"
- Win with any draw rounds → "scrappy"

## 🖥️ CLI Commands

### View Match History

```bash
pnpm dev ranked history
```

Example output:

```
📊 Ranked Match History

Player: Player1
Total Ranked Matches: 4

4. ✓ Win vs Bot (Medium)
   Mode: Mode 2 | Performance: ⚡ Dominant
   Rank: Silver II (1180) → Gold V (1214)
   Δ +34

3. ✗ Loss vs Bot (Hard)
   Mode: Mode 1 | Performance: ⚔️  Close
   Rank: Gold V (1214) → Silver I (1186)
   Δ -28
```

### View Rank Timeline

```bash
pnpm dev ranked timeline
```

Example output:

```
📈 Rank Timeline

Player: Player1
Total Points: 5

[0] Bronze — 1000
[1] Silver III — 1108 (+34)
[2] Silver II — 1180 (+32)
[3] Gold V — 1214 (+34)
[4] Silver I — 1186 (-28)
```

## 🔄 How It Works

1. **User triggers command** → `pnpm dev ranked history`
2. **Load all matches** → from local JSON storage
3. **Filter ranked matches** → only matches with `isRanked: true`
4. **Sort chronologically** → by `createdAt` timestamp
5. **Iterate and compute:**
   - Start: Bronze, 1000 points
   - Match 1: Compute delta → Apply → Update rank
   - Match 2: Compute delta → Apply → Update rank
   - ... (continue for all matches)
6. **Display results** → formatted with colors and emojis

## ✅ Success Criteria

- ✅ Same matches → same history → same timeline
- ✅ Restart CLI → recompute from scratch
- ✅ Rank logic reused, not duplicated
- ✅ Output explains why rank changed
- ✅ UX increases trust in ranking fairness

## 🚀 Future Extensions

This derived system enables:

- Rank progression charts (web UI)
- Historical analysis (peak rank, trends)
- Session summaries (last 10 matches)
- Backend sync (upload history, compare with server)

All without changing the core storage model!
