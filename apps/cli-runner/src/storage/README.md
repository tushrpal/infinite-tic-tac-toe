# Match Storage Layer

Local persistence for MatchResult objects.

## 🎯 Purpose

This storage layer provides **append-only, deterministic persistence** of completed matches. It's a **ledger**, not a leaderboard.

## 🚫 What This Is NOT

- ❌ Ranking system
- ❌ ELO calculations
- ❌ Leaderboard logic
- ❌ Matchmaking
- ❌ Backend integration
- ❌ Game state persistence

## ✅ What This IS

- ✅ Match result ledger
- ✅ Replay data source
- ✅ History tracking
- ✅ Backend-ready data cache
- ✅ Analytics foundation

## 📁 Structure

```
storage/
├── MatchStore.ts          # Interface (contract)
├── LocalJsonMatchStore.ts # File-based implementation
└── index.ts               # Factory / exports
```

## 🗂️ Storage Format

**Location:** `apps/cli-runner/data/matches.json`

**Format:** JSON array of MatchResult objects

```json
[
  {
    "matchId": "match_1234567890_abc123",
    "mode": "mode1",
    "difficulty": "hard",
    "winner": "human",
    ...
  },
  {
    "matchId": "match_1234567891_def456",
    "mode": "mode2",
    "difficulty": "medium",
    "winner": "botX",
    ...
  }
]
```

## 🔌 Usage

### Basic Usage

```typescript
import { createLocalMatchStore } from './storage';

const store = createLocalMatchStore();

// Save a match
await store.save(matchResult);

// Get all matches
const matches = await store.getAll();

// Clear all matches (destructive!)
await store.clear();
```

### Custom Storage Path

```typescript
const store = createLocalMatchStore('./custom/path/matches.json');
```

## 🧱 Architectural Principles

1. **Storage is a side-effect**
   - Game logic doesn't know storage exists
   - Engine & bots remain pure
   - MatchResult is the ONLY input

2. **No derived data at write time**
   - Store exactly what was emitted
   - No aggregations, no transformations
   - Derive later when reading

3. **Replaceable by backend**
   - Storage interface is swappable
   - No CLI-specific assumptions
   - Clean separation of concerns

4. **Append-only behavior**
   - Never overwrites existing matches
   - Preserves order (oldest → newest)
   - Creates file if it doesn't exist

## 🔐 Data Integrity

The storage layer ensures:

- ✅ All matches have unique IDs
- ✅ All matches conform to MatchResult type
- ✅ Data survives CLI restarts
- ✅ No game slowdown from storage
- ✅ Silent failure (storage errors don't break games)

## 🧪 Verification

Run the verification script to check storage integrity:

```bash
node dist/verifyStorage.js
```

This will:
- Count stored matches
- Display match summaries
- Verify data integrity
- Confirm all matches are valid

## 🚀 What This Enables (Future)

With this storage layer in place, you can add:

- 📊 Local leaderboards
- 📜 Match history viewer
- 🎬 Replay system
- ☁️ Backend sync
- 🏆 Ranked matchmaking
- 📈 Analytics dashboards

All without refactoring the game engine or bots.

## 🔄 Future Implementations

The `MatchStore` interface allows for alternative implementations:

- **SQLite:** For richer queries
- **Backend API:** For cloud persistence
- **In-Memory:** For testing
- **Redis:** For distributed systems
- **IndexedDB:** For web apps

Just implement the interface and swap it in the factory.

## 📝 Notes

- Storage failures are logged but don't crash the game
- Data directory is git-ignored
- Match data includes full replay information
- No PII (personally identifiable information) is stored
