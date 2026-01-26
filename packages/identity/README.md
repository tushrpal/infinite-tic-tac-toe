# @infinite-ttt/identity

Minimal player identity system for Infinite Tic-Tac-Toe.

## Philosophy

**Identity ≠ Authentication** (for now)

This package answers "Who is this player?" not "Can this player prove who they are?"

This is intentional and correct for the current stage of the project.

## Features

- ✅ Stable player IDs (UUID)
- ✅ User-chosen display names
- ✅ Local-first persistence
- ✅ Backend-compatible
- ✅ Zero authentication
- ✅ Offline-ready

## Core Types

### PlayerIdentity

```typescript
interface PlayerIdentity {
  playerId: string;       // UUID
  displayName: string;    // e.g., "Tushar"
  createdAt: number;      // Timestamp
}
```

## Storage

### LocalIdentityStore

Stores identity in `~/.infinite-ttt/player.json`

**Behavior:**
- Creates file if missing
- Never overwrites `playerId`
- Allows `displayName` updates

## Usage

### CLI Integration

```typescript
import { LocalIdentityStore, IdentityManager } from '@infinite-ttt/identity';
import { promptDisplayName } from './input';

const identityStore = new LocalIdentityStore();
const identityManager = new IdentityManager(identityStore);

// Initialize (prompts user on first run)
const playerIdentity = await identityManager.initialize(promptDisplayName);

console.log(`Player: ${playerIdentity.displayName}`);
console.log(`ID: ${playerIdentity.playerId}`);

// Use in match results
const matchResult = {
  ...otherFields,
  players: [{
    id: playerIdentity.playerId,
    type: 'human'
  }]
};
```

### Backend Integration

The backend provides a simple `/players` endpoint:

```typescript
// POST /players - Store/update player
{
  "playerId": "uuid-here",
  "displayName": "Tushar",
  "createdAt": 1234567890
}

// GET /players/:playerId - Retrieve player
// GET /players - List all players
```

**Backend Rules:**
- Idempotent (same ID → update name only)
- No authentication
- No validation beyond structure
- No uniqueness enforcement

## Architecture

```
┌─────────────────┐
│   CLI Runner    │
│  (First Run)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ IdentityManager │─────▶│ LocalIdentityStore│
│   .initialize() │      │   ~/.infinite-ttt/│
└─────────────────┘      └──────────────────┘
         │
         ▼
   Prompt for name
         │
         ▼
    Generate UUID
         │
         ▼
   Save to file
         │
         ▼
┌─────────────────┐
│ PlayerIdentity  │
│  - playerId     │
│  - displayName  │
│  - createdAt    │
└─────────────────┘
```

## Design Decisions

### Why UUIDs?

- Globally unique
- No central authority needed
- Collision-resistant
- Offline-first friendly

### Why Local Storage?

- No server dependency
- Works offline
- User owns their data
- Simple backup/transfer

### Why No Authentication?

**Current Stage:** Local-first, single-player focused

**Future:** When PvP arrives, authentication can be layered on top without breaking existing identities.

### Why Mutable Display Names?

- Users should control their presentation
- Player ID remains stable
- Match history stays coherent

## Future Extensions

This design supports future additions:

- **Authentication:** Add verification layer without changing IDs
- **Avatars:** Additional metadata, same ID
- **Achievements:** Attribute to stable player ID
- **PvP Matchmaking:** Use display name + ID
- **Leaderboards:** Group by player ID, display by name

## Testing

Run the test script:

```bash
cd packages/identity
npx tsx test-identity.ts
```

This verifies:
- ✓ First-time identity creation
- ✓ Identity persistence
- ✓ Display name updates
- ✓ Player ID stability

## Migration Path

Old matches with `"human"` player ID remain valid.

New matches use real player IDs.

Leaderboard logic can handle both:
```typescript
const playerId = match.players[0].id || 'anonymous';
```

## File Location

- **CLI:** `~/.infinite-ttt/player.json`
- **Backend:** `./data/players.json`

Both use the same `PlayerIdentity` structure.
