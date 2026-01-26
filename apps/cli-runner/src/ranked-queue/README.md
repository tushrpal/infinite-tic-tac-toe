# Ranked Queue & Matchmaking (Local)

**Status:** ✅ Implemented  
**Version:** v2.2-ranked-queue  
**Dependencies:** Step 6 (Ranked Logic), Step 7 (Ranked Match Flow), Step 8 (Ranked History)

---

## 🎯 Purpose

Implements a **local-only ranked queue and matchmaking system** that simulates real online ranked play without networking.

This system:
- ✅ Manages ranked queue state
- ✅ Applies skill-based matchmaking rules
- ✅ Handles timeout-based bot fallback
- ✅ Integrates seamlessly with existing ranked system
- ✅ Is fully deterministic and backend-ready

---

## 🏗️ Architecture

```
RankedQueueController (Orchestrator)
    ↓
RankedQueue (State Management)
    ↓
MatchmakingRules (Pure Logic)
    ↓
BotFallbackResolver (Rank → Difficulty)
```

### Key Principle

**Queue decides WHO plays, not HOW rank changes.**

- Queue system = matchmaking only
- RankedMatchController = rank updates
- Clean separation = easy backend swap later

---

## 📁 File Structure

```
ranked-queue/
├── QueueTicket.ts              # Type definitions
├── RankedQueue.ts              # Queue state management
├── MatchmakingRules.ts         # Matching logic (pure)
├── BotFallbackResolver.ts      # Rank → bot difficulty
├── RankedQueueController.ts    # Main orchestrator
├── examples.ts                 # Demonstrations
└── README.md                   # This file
```

---

## 🧩 Data Models

### QueueTicket

```typescript
interface QueueTicket {
  playerId: string;
  rankTier: RankTier;
  mode: "mode1" | "mode2";
  enteredAt: number; // timestamp
}
```

### MatchmakingResult

```typescript
type MatchmakingResult =
  | { type: "human"; playerA: QueueTicket; playerB: QueueTicket }
  | { type: "bot"; human: QueueTicket; botDifficulty: "easy" | "medium" | "hard" };
```

---

## 🎮 Matchmaking Flow

### Step-by-Step

1. **Player enters queue**
   - Create `QueueTicket`
   - Add to `RankedQueue`

2. **Attempt immediate match**
   - Search for compatible opponent
   - Same mode + rank tier ≤ 1 difference

3. **If match found**
   - Remove both players from queue
   - Return `MatchmakingResult` (human)

4. **If no match**
   - Wait up to 30 seconds
   - Recheck every 3 seconds

5. **On timeout**
   - Resolve bot difficulty from rank
   - Remove player from queue
   - Return `MatchmakingResult` (bot)

---

## 🤖 Bot Fallback Rules

| Player Rank   | Bot Difficulty |
|---------------|----------------|
| Bronze        | Easy           |
| Silver        | Medium         |
| Gold          | Medium         |
| Platinum      | Hard           |
| Diamond       | Hard           |

**Important:**
- Bot matches ARE ranked
- Bot penalty multiplier (0.6x) applies
- Full `MatchResult` still generated

---

## 🎯 Matchmaking Rules

### Must Match

✅ **Same mode**
- Mode 1 players only match Mode 1
- Mode 2 players only match Mode 2

✅ **Similar rank tier (±1 tier)**
- Bronze can match Silver
- Silver can match Bronze, Gold
- Gold can match Silver, Platinum
- Platinum can match Gold, Diamond
- Diamond can match Platinum

### Examples

| Player A      | Player B      | Match? | Reason                          |
|---------------|---------------|--------|---------------------------------|
| Silver        | Silver        | ✅     | Same tier, same mode            |
| Gold          | Platinum      | ✅     | Adjacent tiers, same mode       |
| Bronze        | Gold          | ❌     | Rank gap too large (2 tiers)    |
| Silver (M1)   | Silver (M2)   | ❌     | Different modes                 |

---

## 📊 Usage Examples

### Basic Usage

```typescript
import { RankedQueueController } from "./ranked-queue";

const controller = new RankedQueueController();

// Player enters ranked queue
const result = await controller.findMatch(
  "player123",
  "Silver",
  "mode1"
);

if (result.type === "human") {
  console.log("Matched with:", result.playerB.playerId);
  // Start PvP match
} else {
  console.log("Matched with bot:", result.botDifficulty);
  // Start bot match
}
```

### With Event Logging

```typescript
const controller = new RankedQueueController();

controller.on((event) => {
  switch (event.type) {
    case "queued":
      console.log(`⏳ Searching for opponent...`);
      break;
    case "matched":
      console.log(`✅ Opponent found!`);
      break;
    case "timeout":
      console.log(`🤖 Assigning bot (${event.botDifficulty})`);
      break;
  }
});

const result = await controller.findMatch("player1", "Gold", "mode2");
```

### Custom Timeout

```typescript
const controller = new RankedQueueController({
  timeoutMs: 60_000,        // 60s timeout
  recheckIntervalMs: 5_000, // Check every 5s
});
```

---

## 🧪 Running Examples

All examples are in `examples.ts`:

```bash
# Run all examples
pnpm --filter cli-runner tsx src/ranked-queue/examples.ts
```

### Example Scenarios

1. **Bronze player → bot fallback (Easy)**
   - No opponents found
   - 5s timeout
   - Assigns Easy bot

2. **Silver + Silver → immediate match**
   - Two players enter queue
   - Matched instantly
   - Both removed from queue

3. **Gold player → bot fallback (Medium)**
   - No opponents found
   - Assigns Medium bot

4. **Diamond vs Silver → rejected**
   - Rank gap too large (3 tiers)
   - Cannot match

5. **Mode 1 vs Mode 2 → rejected**
   - Different modes
   - Cannot match

6. **Bot difficulty mapping**
   - Shows rank → difficulty rules

---

## 🔄 Integration with Ranked System

### Pre-Match

```typescript
import { RankedQueueController } from "./ranked-queue";
import { RankedMatchController } from "./ranked";

const queueController = new RankedQueueController();
const matchResult = await queueController.findMatch("player1", "Silver", "mode1");

// Start ranked match
const rankedController = new RankedMatchController(session);

if (matchResult.type === "human") {
  // PvP match
  const { opponent, preview } = rankedController.preMatch(1, {
    playerId: matchResult.playerB.playerId,
    points: 1500, // Get from player's session
  });
} else {
  // Bot match
  const { opponent, preview } = rankedController.preMatch(1);
}
```

### Post-Match

```typescript
// After match completes, update rank as normal
const { delta, summary } = rankedController.postMatch(matchResult, opponent);
```

---

## 🚀 Backend Migration Path

When adding real backend:

1. **Replace `RankedQueueController` internals**
   - Keep same interface
   - Replace `RankedQueue` with API calls
   - Keep `MatchmakingRules` as validation

2. **Server implements**
   - Queue state (Redis/DB)
   - Matchmaking logic (same rules)
   - WebSocket for real-time updates

3. **Client remains unchanged**
   - Same `findMatch()` call
   - Same `MatchmakingResult` type
   - Same integration points

**Zero game logic changes required.**

---

## 🎯 Design Decisions

### Why separate queue from ranked logic?

- **Single Responsibility:** Queue = matchmaking, RankedMatchController = rank updates
- **Backend Ready:** Easy to replace with API calls
- **Testable:** Pure matching logic in `MatchmakingRules`

### Why 30-second timeout?

- Prevents infinite wait
- Matches typical online games
- Configurable for testing

### Why bot fallback?

- Ensures players always get a match
- Ranked bot matches are valid (with penalty)
- Simulates real queue behavior

### Why ±1 tier limit?

- Prevents unfair matchups
- Keeps games competitive
- Standard in competitive games

---

## ✅ Success Criteria

- [x] Queue logic is deterministic
- [x] Bot fallback works per spec
- [x] Rank deltas apply correctly (via existing system)
- [x] History & timeline update (via existing system)
- [x] No engine/bot/shared changes
- [x] Backend-ready architecture

---

## 🔗 Related Modules

- **Step 6:** [Ranked Logic](../ranked/README.md)
- **Step 7:** [Ranked Match Flow](../ranked/flowExamples.ts)
- **Step 8:** [Ranked History](../ranked-history/README.md)

---

## 📝 Notes

### Local-Only Limitations

- Single player only (no real PvP)
- Simulated "other players" in queue
- For demo/testing purposes

### Production Considerations

When going online:
- Add real-time queue updates (WebSocket)
- Add queue position tracking
- Add estimated wait time
- Add queue cancellation
- Add region-based matching
- Add MMR-based matching (more precise than tier)

---

## 🏷️ Version

**v2.2-ranked-queue**

Implements local ranked queue and matchmaking system that simulates online ranked play.

---

**Next Step:** Add CLI integration for full ranked PvP experience.
