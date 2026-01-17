# Infinite Tic-Tac-Toe – Product & System Design

## 1. Vision

Infinite Tic-Tac-Toe is a competitive yet accessible strategy game with two distinct rule modes. The game is designed to support:
- Casual fun (local play)
- Skill improvement (practice vs bots)
- Competitive ranked play (online PvP with fallback bots)

The core philosophy is:
> **Simple rules, deep strategy, fair competition.**

---

## 2. Game Modes (Rules)

### Mode 1 – Infinite 3×3 (Sliding)
- Fixed 3×3 board
- Each player can have **max 3 marks** on board
- On the 4th move, the **oldest mark is removed** (sliding rule)
- First to get 3-in-a-row wins

Purpose:
- Fast-paced
- Tactical
- Emphasizes foresight and sliding awareness

---

### Mode 2 – Expanding Board (NxN)
- Board starts at 3×3
- Each round increases board size: 3×3 → 4×4 → 5×5 → …
- Win condition: **N-in-a-row** for NxN board
- Drawn rounds are replayed (limited attempts)
- Match continues until target score is reached

Purpose:
- Strategic depth
- Long-term planning
- Endurance and consistency

---

## 3. Ways to Play (Play Types)

### 3.1 Ranked Online PvP (Internet Required)

- Player queues to play against another real player
- Queue timeout: **30 seconds**
- If no opponent found, a **bot substitutes**
- Match result affects rank

Key rules:
- Server-authoritative matches (future)
- Same mode, same difficulty
- Anti-abuse protections required

---

### 3.2 Practice vs Bot (Offline / Online)

- Player chooses:
  - Mode (1 or 2)
  - Difficulty (Easy / Medium / Hard)
- No rank impact
- Used for learning and experimentation

---

### 3.3 Local PvP (Same Device, No Internet)

- Two players share the same device
- Turn-based input
- No bots
- No ranking

Purpose:
- Casual play
- Social / friendly matches

---

## 4. Difficulty System (Bots)

### Difficulty Levels

| Difficulty | Description |
|----------|------------|
| Easy | Random bot, forgiving |
| Medium | Heuristic bot (balanced) |
| Hard | Heuristic + fork detection + low randomness |

### Bot Capabilities
- Mode-agnostic
- NxN-aware
- Sliding-aware (Mode 1)
- Fork prevention (Hard)

### Rank-to-Bot Mapping (Planned)

| Player Rank | Bot Difficulty |
|------------|----------------|
| Beginner / Bronze | Medium |
| Silver | Medium+ |
| Gold | Hard |
| Platinum+ | Hard (minimal randomness) |

---

## 5. Ranking & Leaderboards (ON HOLD – PLANNED)

> Ranking logic is intentionally **not finalized yet**, but the system must be designed to support it.

### Planned Concepts
- Player rank points
- Rank tiers (Bronze → Silver → Gold → Platinum → Diamond)
- Separate leaderboards per:
  - Mode (1 / 2)
  - Match type (Ranked only)

### Design Constraints
- Practice & Local play never affect rank
- Ranked vs Bot may be weighted or capped
- Draw handling must be fair

### Engineering Requirement (NOW)
- Code must be structured so ranking can be added later without refactor

This means:
- Matches emit structured results
- Player identity exists
- Match metadata is preserved

---

## 6. Player Identity (Required for Future)

### Current State
- No persistent player identity

### Planned
- `playerId` (UUID-based initially)
- Stored locally
- Later expandable to account-based login

Player identity is required for:
- Leaderboards
- Rankings
- Match history

---

## 7. Match & Result Model (IMPORTANT)

Every match should produce a result object, even today:

```ts
MatchResult {
  matchId: string;
  mode: "mode1" | "mode2";
  players: [PlayerA, PlayerB];
  isRanked: boolean;
  winner: Player | null;
  roundsPlayed: number;
  totalMoves: number;
  drawCount: number;
  completedAt: Date;
}
```

This enables:
- Rankings (later)
- Replays
- Analytics

---

## 8. Matchmaking (Planned)

### Online Queue Logic
- Player enters queue
- Wait up to 30 seconds
- If no player found:
  - Bot fills slot

### Anti-Abuse Considerations
- Bot games may:
  - Give reduced rank points
  - Have daily caps

---

## 9. Time & Fairness Rules (Planned)

- Per-move time limit (e.g., 30 seconds)
- Match timeout protection
- Prevent stalling or griefing

---

## 10. Progression Beyond Rank (Recommended)

To reduce rank anxiety:
- Achievements (e.g., "Fork Master")
- Badges per mode
- Win streaks
- Milestones

---

## 11. Technical Architecture (Current & Future)

### Current
- Game Engine (pure, deterministic)
- Bot System (configurable, mode-agnostic)
- CLI UI (validation layer)

### Future
- Backend:
  - Match validation
  - Player persistence
  - Leaderboards
- Frontend:
  - Web / Mobile UI
  - Replays
  - Profiles

---

## 12. Roadmap (Recommended Order)

1. ✅ Core gameplay (DONE)
2. ✅ Bots & difficulty (DONE)
3. ✅ Mode 2 tuning (DONE)
4. ⏸ Ranking design (on hold, structure ready)
5. ▶ Local leaderboard prototype
6. ▶ Backend MVP
7. ▶ Frontend UI

---

## 13. Guiding Principles (DO NOT BREAK)

- Rules live in the engine
- Skill lives in bots
- Ranking must be fair
- UX clarity over complexity
- Determinism enables trust

---

## 14. Summary

This project is no longer a simple game prototype. It is a **platform-ready competitive game** with:
- Multiple modes
- Skill-based AI
- Clear expansion path
- Solid architecture

The focus now is **system design discipline**, not feature rush.

