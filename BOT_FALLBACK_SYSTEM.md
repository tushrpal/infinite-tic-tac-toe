# Smart Bot Fallback System

**Status:** 🚧 In Progress  
**Version:** v3.0-bot-fallback  
**Last Updated:** 2026-08-21

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution Architecture](#solution-architecture)
- [Component Breakdown](#component-breakdown)
- [Bot Difficulty Mapping](#bot-difficulty-mapping)
- [Data Flow](#data-flow)
- [Implementation Guide](#implementation-guide)
- [API Contracts](#api-contracts)
- [Rating System Integration](#rating-system-integration)
- [Edge Cases](#edge-cases)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)
- [Future Enhancements](#future-enhancements)

---

## Overview

The **Smart Bot Fallback System** ensures players always get a match in ranked play by automatically matching them with an AI opponent when no human opponent is found within the matchmaking timeout window. The bot's difficulty is dynamically selected based on the player's rank to provide appropriate challenge.

### Key Benefits

✅ **Zero Wait Frustration** - Players never stuck in infinite queue  
✅ **Fair Challenge** - Bot difficulty scales with player skill  
✅ **Maintains Competitive Integrity** - Reduced rating impact (0.6x multiplier)  
✅ **Seamless UX** - Bot matches feel natural with timing delays  
✅ **Practice Tool** - Players can improve between PvP matches  

---

## Problem Statement

### Without Bot Fallback

❌ Players stuck in queue with no opponents  
❌ Low-population times = no gameplay  
❌ New players can't find matches  
❌ Frustration leads to player churn  

### With Bot Fallback

✅ Always get a match within 30 seconds  
✅ Appropriate difficulty for rank  
✅ Reduced but still meaningful rating changes  
✅ Better player retention  

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MATCHMAKING FLOW                          │
└─────────────────────────────────────────────────────────────┘

Player Enters Queue
       ↓
┌──────────────────┐
│ Matchmaking      │  0-30s: Search for human opponent
│ Service          │  • Same mode (MODE_1/MODE_2)
│                  │  • Similar MMR (±200, expands over time)
└──────────────────┘
       ↓
  ┌────────┐
  │ Match  │ YES → PvP Match Created
  │ Found? │
  └────────┘
       ↓ NO (30s timeout)
┌──────────────────┐
│ Bot Fallback     │  • Resolve bot difficulty from rank
│ Resolver         │  • Create bot instance
│                  │  • Flag match as bot match
└──────────────────┘
       ↓
┌──────────────────┐
│ Match Created    │  • Player vs Bot
│                  │  • Bot assigned to Player O
│                  │  • Rating multiplier: 0.6x
└──────────────────┘
```

---

## Component Breakdown

### 1. Bot Difficulty Resolver

**Location:** `packages/bots/src/core/botResolver.ts` (to be created)

**Responsibility:** Maps player rank → bot type and difficulty

```typescript
interface BotSelection {
  botType: 'random' | 'heuristic' | 'minimax';
  difficulty: 'easy' | 'medium' | 'hard';
  instance: Bot;
}

class BotDifficultyResolver {
  static resolveForRank(rating: number, mode: GameMode): BotSelection;
  static createBotInstance(selection: BotSelection): Bot;
}
```

### 2. Matchmaking Service Enhancement

**Location:** `apps/backend/src/matchmaking/matchmakingService.ts`

**Responsibility:** Orchestrates bot fallback flow

```typescript
interface MatchmakingResult {
  type: 'human' | 'bot';
  matchId: string;
  playerX: PlayerInfo;
  playerO: PlayerInfo | BotInfo;
  isRanked: boolean;
  botMultiplier?: number;
}

class MatchmakingService {
  async findMatch(playerId: string, mode: GameMode, timeout: number): Promise<MatchmakingResult>;
  private async createBotMatch(player: PlayerInfo, mode: GameMode): Promise<MatchmakingResult>;
}
```

### 3. Bot Controller (Backend)

**Location:** `apps/backend/src/bots/botController.ts` (to be created)

**Responsibility:** Executes bot moves during matches

```typescript
class BotController {
  private bots: Map<string, Bot>; // matchId → Bot instance
  
  registerBot(matchId: string, bot: Bot): void;
  async computeMove(matchId: string, gameState: GameState): Promise<number>;
  cleanup(matchId: string): void;
}
```

### 4. Frontend Bot Handler

**Location:** `apps/web/hooks/useBotMatch.ts` (to be created)

**Responsibility:** Handles bot move automation in UI

```typescript
function useBotMatch(matchId: string, yourPlayer: Player, isBotMatch: boolean) {
  // Triggers bot move when it's bot's turn
  // Applies small delay for natural feel
  // Updates UI state
}
```

---

## Bot Difficulty Mapping

### Mapping Table

| Player Rating | Rank Tier | Bot Type | Bot Difficulty | Reasoning |
|--------------|-----------|----------|----------------|-----------|
| 0-999 | Bronze | Random | Easy | Learning fundamentals |
| 1000-1499 | Silver | Heuristic | Medium | Developing strategy |
| 1500-1999 | Gold | Heuristic | Medium | Refining tactics |
| 2000-2499 | Platinum | Heuristic / Minimax | Hard | Advanced play |
| 2500+ | Diamond | Minimax | Hard (Perfect) | Master-level challenge |

### Bot Type Details

#### Random Bot (Easy)
- **Algorithm:** Random move selection
- **Strength:** Purely random, no strategy
- **Use Case:** Bronze players learning basics
- **Code:** `createRandomBot()`

#### Heuristic Bot (Medium/Hard)
- **Algorithm:** Rule-based evaluation
  - Win detection
  - Block opponent wins
  - Line extension
  - Center control
- **Strength:** Strategic but beatable
- **Configuration:**
  - Medium: `MEDIUM_CONFIG` (30% randomness)
  - Hard: `HARD_CONFIG` (5% randomness, 8x aggression)
- **Use Case:** Silver, Gold, Platinum
- **Code:** `createHeuristicBot(config)`

#### Minimax Bot (Hard - Perfect Play)
- **Algorithm:** Minimax with alpha-beta pruning
- **Strength:** Perfect play within search depth
- **Configuration:** Depth 9 for 3×3 (full game tree)
- **Use Case:** Diamond players
- **Code:** `createMinimaxBot(depth)`

### Configuration Constants

```typescript
// packages/bots/src/core/botResolver.ts
export const BOT_DIFFICULTY_CONFIG = {
  BRONZE: {
    type: 'random',
    difficulty: 'easy',
    ratingRange: [0, 999],
  },
  SILVER: {
    type: 'heuristic',
    difficulty: 'medium',
    config: MEDIUM_CONFIG,
    ratingRange: [1000, 1499],
  },
  GOLD: {
    type: 'heuristic',
    difficulty: 'medium',
    config: MEDIUM_CONFIG,
    ratingRange: [1500, 1999],
  },
  PLATINUM: {
    type: 'heuristic', // Can upgrade to minimax later
    difficulty: 'hard',
    config: HARD_CONFIG,
    ratingRange: [2000, 2499],
  },
  DIAMOND: {
    type: 'minimax',
    difficulty: 'hard',
    depth: 9,
    ratingRange: [2500, 9999],
  },
} as const;
```

---

## Data Flow

### 1. Queue Entry

```
User clicks "Play Ranked" → Mode selected → joinQueue()
↓
Backend: Add to Redis queue
{
  playerId: "user123",
  mode: "MODE_1",
  rating: 1450,
  joinedAt: timestamp,
  username: "Player123"
}
```

### 2. Matchmaking Loop

```
Every 3 seconds:
  1. Check for compatible opponents
  2. If found → create PvP match
  3. If not found && timeout reached (30s) → bot fallback
```

### 3. Bot Fallback Triggered

```typescript
// After 30s timeout
const botSelection = BotDifficultyResolver.resolveForRank(1450, "MODE_1");
// Returns: { botType: 'heuristic', difficulty: 'medium', instance: HeuristicBot }

const botInfo: BotInfo = {
  playerId: `bot-${uuid()}`,
  username: "Bot (Medium)",
  isBot: true,
  botType: 'heuristic',
  difficulty: 'medium',
  rating: player.rating, // Match player's rating for ELO calc
};

const matchResult = await createMatch(player, botInfo);
```

### 4. Match State Creation

```typescript
interface MatchState {
  matchId: string;
  playerX: PlayerInfo;
  playerO: PlayerInfo | BotInfo;
  isRanked: true;
  isBotMatch: true; // NEW FLAG
  botPlayer: 'O'; // Which player is bot
  botMultiplier: 0.6; // Rating change multiplier
  engineState: GameState;
  // ... other fields
}
```

### 5. Bot Move Execution

```typescript
// Backend receives game state update
if (isBotMatch && currentPlayer === botPlayer) {
  // Small delay for UX (300-500ms)
  await sleep(random(300, 500));
  
  // Compute bot move
  const bot = botController.getBot(matchId);
  const moveIndex = bot.getMove(engineState);
  
  // Apply move through normal flow
  await applyMove(matchId, botPlayer, indexToPosition(moveIndex));
  
  // Broadcast to frontend via WebSocket
  io.to(matchId).emit('GAME_UPDATE', updatedState);
}
```

### 6. Post-Match Rating Update

```typescript
// Standard ELO calculation
const baseChange = calculateELO(playerRating, opponentRating, outcome);

// Apply bot multiplier if bot match
const actualChange = isBotMatch 
  ? Math.round(baseChange * 0.6) 
  : baseChange;

// Update player rating
updateRating(playerId, actualChange);
```

---

## API Contracts

### WebSocket Events

#### Client → Server

```typescript
// Join ranked queue
{
  type: 'JOIN_QUEUE',
  payload: {
    playerId: string;
    mode: 'MODE_1' | 'MODE_2';
    isRanked: true;
    username: string;
  }
}
```

#### Server → Client

```typescript
// Match found (human or bot)
{
  type: 'MATCH_FOUND',
  payload: {
    matchId: string;
    yourPlayer: 'X' | 'O';
    opponentInfo: {
      username: string;
      rating: number;
      isBot: boolean; // NEW
      botDifficulty?: 'easy' | 'medium' | 'hard'; // NEW
    };
    matchState: MatchState;
    isBotMatch: boolean; // NEW
  }
}

// Bot move notification (optional, for UI feedback)
{
  type: 'BOT_THINKING',
  payload: {
    matchId: string;
  }
}
```

### REST API (If needed)

```typescript
// Get bot difficulty for rank (utility endpoint)
GET /api/bots/difficulty?rating=1450
Response: {
  botType: 'heuristic',
  difficulty: 'medium',
  reasoning: 'Silver tier players face medium bots'
}
```

---

## Rating System Integration

### Bot Match Multiplier

**Principle:** Bot matches grant reduced rating changes to maintain competitive integrity.

```typescript
const BOT_RATING_MULTIPLIER = 0.6;

// Example calculations
Win vs Bot (Medium), Rating 1450:
  Base gain: +25
  With multiplier: +25 × 0.6 = +15 ✅

Loss vs Bot (Medium), Rating 1450:
  Base loss: -20
  With multiplier: -20 × 0.6 = -12 ✅
```

### Why 0.6x Multiplier?

- **Not too punishing:** Losses hurt less
- **Not too rewarding:** Wins give less than PvP
- **Encourages PvP:** Better gains from human opponents
- **Fair practice:** Still meaningful progression

### Alternative: No Bot Losses Count

```typescript
// Optional variant: Only wins grant rating, losses don't cost
if (isBotMatch && outcome === 'loss') {
  actualChange = 0; // No penalty for losing to bot
}
```

**Decision:** Use 0.6x multiplier for both wins/losses initially. Can adjust based on player feedback.

---

## Edge Cases

### 1. Bot Match During Low Population

**Scenario:** Player at 2 AM, no human opponents available

**Solution:** Bot fallback ensures immediate match

**Edge Case:** What if player wants to wait for human?

**Resolution:** Add "Skip Bot" option with extended timeout
```typescript
interface QueueOptions {
  allowBotFallback: boolean; // Default: true
  maxWaitTime: number; // Default: 30s, max: 300s
}
```

### 2. Player Disconnects During Bot Match

**Scenario:** Player loses connection mid-bot-match

**Solution:** 
- Bot match paused (bot doesn't keep playing)
- 30s reconnection window
- If no reconnect → count as forfeit with reduced penalty (0.3x multiplier since already 0.6x)

### 3. Bot Crashes/Errors

**Scenario:** Bot throws error during `getMove()`

**Solution:**
```typescript
try {
  const moveIndex = bot.getMove(state);
} catch (error) {
  logger.error('Bot error', { matchId, error });
  
  // Fallback: Random valid move
  const validMoves = getValidMoves(state);
  const moveIndex = validMoves[Math.floor(Math.random() * validMoves.length)];
  
  // Notify player (optional)
  io.to(matchId).emit('INFO', { message: 'Bot encountered an error' });
}
```

### 4. Player Rating Boundary Cases

**Scenario:** Player at 999 rating (Bronze/Silver boundary)

**Solution:** Use current rating at queue entry time
```typescript
const botSelection = BotDifficultyResolver.resolveForRank(
  queueEntry.rating, // Snapshot at queue time
  mode
);
```

### 5. Rapid Queue/Leave Cycles

**Scenario:** Player joins queue, leaves, rejoins rapidly

**Solution:**
- 5-second cooldown before rejoining
- Anti-spam protection
```typescript
const QUEUE_COOLDOWN_MS = 5000;
const lastLeftAt = await redis.get(`queue:cooldown:${playerId}`);
if (lastLeftAt && Date.now() - lastLeftAt < QUEUE_COOLDOWN_MS) {
  throw new Error('Please wait before rejoining queue');
}
```

### 6. Bot Match History Visibility

**Scenario:** Should bot matches show in match history?

**Solution:** Yes, but clearly marked
```typescript
interface MatchHistoryEntry {
  matchId: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  isBotMatch: boolean; // NEW
  botDifficulty?: string; // NEW
  timestamp: number;
}
```

---

## Testing Strategy

### Unit Tests

#### Bot Difficulty Resolver
```typescript
describe('BotDifficultyResolver', () => {
  it('should assign Easy bot to Bronze players', () => {
    const selection = BotDifficultyResolver.resolveForRank(500, 'MODE_1');
    expect(selection.botType).toBe('random');
    expect(selection.difficulty).toBe('easy');
  });

  it('should assign Medium bot to Silver players', () => {
    const selection = BotDifficultyResolver.resolveForRank(1200, 'MODE_1');
    expect(selection.botType).toBe('heuristic');
    expect(selection.difficulty).toBe('medium');
  });

  it('should assign Minimax bot to Diamond players', () => {
    const selection = BotDifficultyResolver.resolveForRank(2600, 'MODE_1');
    expect(selection.botType).toBe('minimax');
    expect(selection.difficulty).toBe('hard');
  });
});
```

#### Bot Controller
```typescript
describe('BotController', () => {
  it('should compute valid move', async () => {
    const controller = new BotController();
    const bot = createRandomBot();
    controller.registerBot('match123', bot);
    
    const state = createInitialState();
    const move = await controller.computeMove('match123', state);
    
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
  });

  it('should cleanup bot after match', () => {
    const controller = new BotController();
    controller.registerBot('match123', createRandomBot());
    controller.cleanup('match123');
    
    expect(() => controller.computeMove('match123', state)).toThrow();
  });
});
```

### Integration Tests

#### Matchmaking with Bot Fallback
```typescript
describe('Matchmaking with Bot Fallback', () => {
  it('should create bot match after timeout', async () => {
    const player = { playerId: 'p1', rating: 1450, mode: 'MODE_1' };
    
    // Join queue
    await matchmaking.joinQueue(player);
    
    // Fast-forward 30s
    jest.advanceTimersByTime(30000);
    
    // Should receive bot match
    const result = await matchmaking.getMatchResult('p1');
    expect(result.type).toBe('bot');
    expect(result.playerO.isBot).toBe(true);
    expect(result.playerO.botDifficulty).toBe('medium');
  });

  it('should prefer human opponent over bot', async () => {
    const p1 = { playerId: 'p1', rating: 1450, mode: 'MODE_1' };
    const p2 = { playerId: 'p2', rating: 1480, mode: 'MODE_1' };
    
    await matchmaking.joinQueue(p1);
    await matchmaking.joinQueue(p2);
    
    // Should immediately match
    const result = await matchmaking.getMatchResult('p1');
    expect(result.type).toBe('human');
    expect(result.playerO.playerId).toBe('p2');
  });
});
```

### End-to-End Tests

```typescript
describe('Bot Match E2E', () => {
  it('should complete full bot match with rating update', async () => {
    // 1. Player joins queue
    await client.emit('JOIN_QUEUE', { playerId: 'p1', mode: 'MODE_1' });
    
    // 2. Wait for bot match
    const matchFound = await waitForEvent(client, 'MATCH_FOUND', 35000);
    expect(matchFound.isBotMatch).toBe(true);
    
    // 3. Play game to completion (simulate moves)
    // ... (make moves until game over)
    
    // 4. Verify rating update with bot multiplier
    const profile = await getPlayerProfile('p1');
    expect(profile.ratingMode1).toBeGreaterThan(1450); // Assuming win
    expect(profile.ratingMode1).toBeLessThan(1450 + 25); // Less than full gain
  });
});
```

### Performance Tests

```typescript
describe('Bot Performance', () => {
  it('should compute move within 500ms', async () => {
    const bot = createMinimaxBot(9);
    const state = createMidGameState(); // Complex position
    
    const start = Date.now();
    const move = bot.getMove(state);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});
```

---

## Performance Considerations

### Bot Move Computation Time

| Bot Type | Board State | Avg Time | Max Time |
|----------|-------------|----------|----------|
| Random | Any | <1ms | <1ms |
| Heuristic (Medium) | Early game | 5-10ms | 20ms |
| Heuristic (Hard) | Mid game | 10-20ms | 50ms |
| Minimax (depth 9) | Early game | 50-100ms | 200ms |
| Minimax (depth 9) | Mid game | 100-200ms | 500ms |

**Action Items:**
- ✅ All bots stay under 500ms (acceptable UX)
- ⚠️ Minimax on complex positions may approach limit
- 🔄 Consider depth reduction for Mode 2 (larger boards)

### Memory Usage

**Per Bot Instance:**
- Random: ~1KB (minimal state)
- Heuristic: ~5KB (evaluation tables)
- Minimax: ~50KB (search tree, memoization)

**Scaling:**
- Assume 1000 concurrent bot matches (high estimate)
- Memory: 1000 × 50KB = 50MB (negligible)
- CPU: Spikes during bot turns, idle otherwise

**Optimization:**
- Bot instances cleaned up after match ends
- No need for caching/pooling initially
- Can add later if scaling issues emerge

### Backend Load

**Bot matches reduce server load:**
- No second WebSocket connection
- No state sync between two clients
- Simpler error handling

**Trade-off:**
- Backend computes bot moves (CPU cost)
- Alternative: Client-side bot computation (security concern)

**Decision:** Keep bots server-side for consistency and fairness.

---

## Implementation Guide

### Phase 1: Core Bot Infrastructure (Backend)

**Files to Create:**
1. `packages/bots/src/core/botResolver.ts`
   - Bot difficulty mapping logic
   - Bot instance factory

2. `apps/backend/src/bots/botController.ts`
   - Bot lifecycle management
   - Move computation orchestration

**Files to Modify:**
1. `apps/backend/package.json`
   - Add `@infinite-ttt/bots` dependency

### Phase 2: Matchmaking Integration (Backend)

**Files to Modify:**
1. `apps/backend/src/matchmaking/matchmakingService.ts`
   - Add bot fallback logic after timeout
   - Create bot match state

2. `apps/backend/src/match/matchManager.ts`
   - Handle bot move triggers
   - Apply bot multiplier to ratings

### Phase 3: WebSocket Protocol (Backend)

**Files to Modify:**
1. `apps/backend/src/websocket/index.ts`
   - Add `isBotMatch` flag to MATCH_FOUND
   - Add BOT_THINKING event (optional)

### Phase 4: Frontend Integration (Web)

**Files to Create:**
1. `apps/web/hooks/useBotMatch.ts`
   - Detect bot's turn
   - Trigger automatic move

**Files to Modify:**
1. `apps/web/package.json`
   - Add `@infinite-ttt/bots` dependency (if client-side bot needed)

2. `apps/web/app/match/[matchId]/page.tsx`
   - Display bot indicator
   - Integrate useBotMatch hook

3. `apps/web/components/hud/ScorePanel.tsx`
   - Show "Bot (Medium)" as opponent name
   - Display bot difficulty badge

### Phase 5: UI Polish (Web)

**Features to Add:**
- Bot thinking animation (spinner/pulsing)
- "Playing against Bot" indicator
- Post-match: "Rating change: +15 (vs Bot)"
- Match history: Bot match icon

### Phase 6: Testing & Tuning

**Tasks:**
1. Test all difficulty levels
2. Verify rating multiplier
3. Check bot move timing feels natural
4. Test edge cases (disconnects, errors)
5. Performance testing under load

---

## Future Enhancements

### Short Term (1-2 months)

1. **Bot Personality**
   - Different bot "styles" (aggressive, defensive, balanced)
   - Named bots ("Alpha Bot", "Beta Bot")

2. **Practice Mode**
   - Unranked bot matches
   - Choose specific bot difficulty

3. **Bot Statistics**
   - Win rate vs each bot type
   - Track improvement over time

### Medium Term (3-6 months)

1. **Advanced Difficulty Scaling**
   - Fine-tune bot strength within each tier
   - Silver I gets weaker medium bot than Silver III

2. **Bot Learning (Pseudo-Adaptive)**
   - Bots adjust to player's common mistakes
   - Track player patterns, exploit weaknesses

3. **Tournament Bots**
   - Special event: Beat all 5 bot difficulties
   - Rewards for completing bot gauntlet

### Long Term (6+ months)

1. **ML-Powered Bots**
   - Train neural network on player games
   - More human-like play patterns

2. **Cooperative Bot Mode**
   - 2v2 with bot teammate
   - Coordinate strategy

3. **Bot Replays**
   - Analyze bot's decision-making
   - Educational mode: "Why did the bot play here?"

---

## Related Documentation

- [Ranked System](apps/cli-runner/src/ranked/README.md)
- [Matchmaking Queue](apps/cli-runner/src/ranked-queue/README.md)
- [Bot Package](packages/bots/README.md)
- [WebSocket Protocol](apps/backend/ONLINE_PVP.md)

---

## Glossary

- **Bot Fallback:** Automatic assignment of AI opponent after matchmaking timeout
- **Bot Multiplier:** Rating change reduction factor (0.6x) for bot matches
- **Difficulty Scaling:** Matching bot strength to player rank
- **Queue Timeout:** Time limit before bot fallback triggers (default: 30s)
- **PvP Match:** Player vs Player (human opponent)
- **Bot Match:** Player vs Bot (AI opponent)

---

## Version History

- **v3.0** (2026-08-21): Initial design documentation
- **v3.1** (TBD): Implementation complete
- **v3.2** (TBD): Production deployment

---

**Authors:** Development Team  
**Reviewers:** TBD  
**Approved By:** TBD  
**Status:** 📄 Documentation Complete → Ready for Implementation
