# MatchResult Emission Guide

## Overview

Every completed match now emits a `MatchResult` object containing complete game data. This guide explains how the system works and how to extend it.

## Architecture

```
┌─────────────────────────────────────┐
│  Game Completion (CLI/UI/Server)   │
└──────────────┬──────────────────────┘
               │
               │ Collects game data
               ▼
┌─────────────────────────────────────┐
│   matchResultBuilder.ts             │
│   • buildMode1MatchResult()         │
│   • buildMode2MatchResult()         │
└──────────────┬──────────────────────┘
               │
               │ Creates MatchResult
               ▼
┌─────────────────────────────────────┐
│   emitMatchResult.ts                │
│   • Console log (current)           │
│   • File write (future)             │
│   • API call (future)               │
└─────────────────────────────────────┘
```

## Usage Examples

### Mode 1: Human vs Bot

```typescript
import { buildMode1MatchResult } from "./match/matchResultBuilder.js";
import { emitMatchResult } from "./match/emitMatchResult.js";

// Track moves during gameplay
const frozenMoves: Move[] = [];

// In game loop
frozenMoves.push({
  index: moveIndex,
  player: currentPlayer,
  turn: state.currentTurn,
  timestamp: Date.now(),
});

// After game ends
const matchResult = buildMode1MatchResult({
  winner: state.winner,
  moves: frozenMoves,
  boardSize: 3,
  difficulty: "hard",
  humanPlayer: humanSymbol,
  isRanked: false,
});

emitMatchResult(matchResult);
```

### Mode 2: Multi-Round Match

```typescript
import { buildMode2MatchResult } from "./match/matchResultBuilder.js";
import { emitMatchResult } from "./match/emitMatchResult.js";

// Collect GameResults per round
const gameResults: GameResult[] = [];

// After each round completes
gameResults.push({
  winner: roundWinner,
  totalMoves: roundMoves.length,
  boardSize: currentBoardSize,
  moves: roundMoves,
});

// After match completes (target score reached)
const matchResult = buildMode2MatchResult({
  games: gameResults,
  difficulty: "medium",
  humanPlayer: humanSymbol,
  isRanked: false,
  scoreX,
  scoreO,
  targetScore: 3,
});

emitMatchResult(matchResult);
```

### Bot vs Bot

```typescript
// Same as human vs bot, but omit humanPlayer
const matchResult = buildMode1MatchResult({
  winner: state.winner,
  moves: frozenMoves,
  boardSize: 3,
  difficulty: "medium",
  humanPlayer: undefined, // Bot vs Bot
  isRanked: false,
});
```

## Output Format

### Console (Current Implementation)

```
═══════════════════════════════════════════════════════════
📊 MATCH RESULT
═══════════════════════════════════════════════════════════
{
  "matchId": "match_1768672819044_c9f6adb0",
  "mode": "mode1",
  "isRanked": false,
  "difficulty": "medium",
  "players": [...],
  "games": [...],
  "winner": "human",
  "roundsPlayed": 1,
  "totalMoves": 7,
  "drawCount": 0,
  "createdAt": 1768672819045
}
═══════════════════════════════════════════════════════════
```

## Extending the Emitter

### Writing to File

```typescript
// Replace emitMatchResult.ts
import { writeFileSync } from "fs";
import type { MatchResult } from "@infinite-ttt/shared";

export function emitMatchResult(matchResult: MatchResult): void {
  const filename = `./matches/${matchResult.matchId}.json`;
  writeFileSync(filename, JSON.stringify(matchResult, null, 2));
  console.log(`✅ Match saved: ${filename}`);
}
```

### Sending to Backend

```typescript
// Replace emitMatchResult.ts
import type { MatchResult } from "@infinite-ttt/shared";

export async function emitMatchResult(matchResult: MatchResult): Promise<void> {
  const response = await fetch("https://api.example.com/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matchResult),
  });

  if (response.ok) {
    console.log("✅ Match submitted to leaderboard");
  } else {
    console.error("❌ Failed to submit match");
  }
}
```

### Dual Output (Console + Backend)

```typescript
export async function emitMatchResult(matchResult: MatchResult): Promise<void> {
  // Log locally
  console.log("\n📊 MATCH RESULT");
  console.log(JSON.stringify(matchResult, null, 2));

  // Send to backend
  try {
    await sendToBackend(matchResult);
    console.log("✅ Synced to cloud");
  } catch (error) {
    console.log("⚠️  Saved locally only");
  }
}
```

## Data Guarantees

### Every MatchResult Contains

- ✅ Unique `matchId`
- ✅ Game `mode` (mode1 | mode2)
- ✅ `difficulty` level
- ✅ `players` with IDs and types
- ✅ Complete `moves` history
- ✅ `winner` (or null for draw)
- ✅ `roundsPlayed` count
- ✅ `totalMoves` across all rounds
- ✅ `drawCount` for drawn games
- ✅ `createdAt` timestamp

### Every GameResult Contains

- ✅ Round `winner` (or null)
- ✅ `boardSize` for that round
- ✅ Complete `moves` array
- ✅ `totalMoves` count

### Every Move Contains

- ✅ Board `index` (0 to N²-1)
- ✅ `player` (X | O)
- ✅ `turn` number (sequential)
- ✅ Optional `timestamp`

## Replay Capability

Any MatchResult can be fully replayed:

```typescript
function replayMatch(matchResult: MatchResult) {
  for (const game of matchResult.games) {
    let state = createInitialState(game.boardSize);

    for (const move of game.moves) {
      const position = indexToPosition(move.index, game.boardSize);
      state = applyMove(state, move.player, position);
      displayBoard(state);
    }
  }
}
```

## Integration Points

### Backend API

```typescript
POST /api/matches
Content-Type: application/json

{
  "matchId": "...",
  "mode": "mode1",
  "isRanked": false,
  ...
}

Response: 201 Created
{
  "matchId": "...",
  "leaderboardPosition": 42,
  "rankChange": +5
}
```

### Leaderboard Calculation

```typescript
// Consume MatchResult without knowing game rules
function updateLeaderboard(matchResult: MatchResult) {
  if (!matchResult.isRanked) return;

  const humanPlayer = matchResult.players.find((p) => p.type === "human");
  if (!humanPlayer) return;

  const won = matchResult.winner === humanPlayer.id;
  const points = calculatePoints(matchResult.difficulty, won);

  updatePlayerRank(humanPlayer.id, points);
}
```

### Statistics

```typescript
function generateStats(matches: MatchResult[]) {
  return {
    totalMatches: matches.length,
    totalMoves: matches.reduce((sum, m) => sum + m.totalMoves, 0),
    avgMoves:
      matches.reduce((sum, m) => sum + m.totalMoves, 0) / matches.length,
    winRate:
      matches.filter((m) => m.winner === "human").length / matches.length,
    byDifficulty: {
      easy: matches.filter((m) => m.difficulty === "easy").length,
      medium: matches.filter((m) => m.difficulty === "medium").length,
      hard: matches.filter((m) => m.difficulty === "hard").length,
    },
  };
}
```

## Testing

### Verify Emission

```bash
# Run a quick bot vs bot game
node apps/cli-runner/dist/index.js

# Check for MatchResult in output
# Should see JSON with all required fields
```

### Validate Structure

```typescript
import type { MatchResult } from "@infinite-ttt/shared";

function validateMatchResult(result: MatchResult): boolean {
  return (
    typeof result.matchId === "string" &&
    ["mode1", "mode2"].includes(result.mode) &&
    Array.isArray(result.players) &&
    Array.isArray(result.games) &&
    result.games.every((g) => Array.isArray(g.moves)) &&
    typeof result.roundsPlayed === "number" &&
    typeof result.totalMoves === "number" &&
    typeof result.createdAt === "number"
  );
}
```

## Best Practices

### ✅ DO

- Emit MatchResult immediately after match completion
- Include complete move history
- Use frozen types from `@infinite-ttt/shared`
- Keep emitter logic simple and replaceable
- Log errors if emission fails

### ❌ DON'T

- Calculate rankings in the emitter
- Modify game state during emission
- Add UI-specific fields to MatchResult
- Block gameplay waiting for emission
- Retry indefinitely on failure

---

**Ready for backend integration, leaderboards, and analytics!**
