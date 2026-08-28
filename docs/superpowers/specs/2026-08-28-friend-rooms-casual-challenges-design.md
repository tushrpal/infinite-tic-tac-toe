# Friend Rooms & Casual Challenges Design

**Date:** 2026-08-28  
**Status:** Approved  
**Author:** Claude

## Overview

Enhance the friend gaming experience with two complementary systems:

1. **Casual Challenges** - Quick 1v1 game invites that are always unranked
2. **Friend Rooms** - Persistent lobbies where friends can play multiple casual games with spectator support

## Background

The codebase already has substantial friend infrastructure:
- Friend requests and management (apps/backend/src/routes/friends.ts)
- Challenge system that supports ranked/casual (apps/backend/src/routes/challenges.ts)
- Private matches with shareable codes (apps/backend/src/routes/private-matches.ts)
- WebSocket events for real-time updates (apps/backend/src/websocket/)

**Current limitations:**
- Challenges don't clearly distinguish ranked vs casual
- No persistent "room" concept for multiple games
- No spectator support for friend games
- Private matches aren't friend-specific

## Requirements

### Casual Challenges
- All friend challenges are unranked/casual
- Remove ranked option entirely from challenge creation
- Maintain existing 5-minute expiry
- Quick "let's play now" experience

### Friend Rooms
- Persistent lobbies for multiple games in a row
- 2 active players + unlimited spectators
- Host controls player rotation via manual ready system
- Hybrid discovery: visible to friends + optional direct invites
- Auto-expire after 3 hours OR when host leaves
- All games are casual (never affect rating)

## Architecture

### Database Schema

#### New Models

**Room**
```prisma
enum RoomStatus {
  WAITING       // Created, waiting for players
  ACTIVE        // Game in progress
  BETWEEN_GAMES // Game ended, preparing for next
  CLOSED        // Room closed by host or expired
}

model Room {
  id               String     @id @default(cuid())
  hostId           String
  name             String?    // Optional room name
  mode             Int        // 1 or 2
  status           RoomStatus @default(WAITING)
  
  // Active players (exactly 2 during games)
  player1Id        String?
  player2Id        String?
  
  // Current match reference
  currentMatchId   String?    @unique
  
  // Lifecycle
  expiresAt        DateTime   // Auto-expire after 3 hours
  lastActivityAt   DateTime   @default(now())
  createdAt        DateTime   @default(now())
  
  host             Player     @relation("RoomHost", fields: [hostId], references: [id], onDelete: Cascade)
  player1          Player?    @relation("RoomPlayer1", fields: [player1Id], references: [id], onDelete: SetNull)
  player2          Player?    @relation("RoomPlayer2", fields: [player2Id], references: [id], onDelete: SetNull)
  
  members          RoomMember[]
  invites          RoomInvite[]
  
  @@index([hostId, status])
  @@index([expiresAt])
  @@index([lastActivityAt])
}
```

**RoomMember**
```prisma
model RoomMember {
  id        String   @id @default(cuid())
  roomId    String
  playerId  String
  isReady   Boolean  @default(false) // Ready to play next game
  joinedAt  DateTime @default(now())
  
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  player    Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, playerId])
  @@index([playerId])
}
```

**RoomInvite**
```prisma
enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

model RoomInvite {
  id         String       @id @default(cuid())
  roomId     String
  inviterId  String       // Who sent the invite (usually host)
  inviteeId  String       // Who was invited
  status     InviteStatus @default(PENDING)
  expiresAt  DateTime
  createdAt  DateTime     @default(now())
  
  room       Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  inviter    Player       @relation("RoomInviter", fields: [inviterId], references: [id], onDelete: Cascade)
  invitee    Player       @relation("RoomInvitee", fields: [inviteeId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, inviteeId])
  @@index([inviteeId, status])
  @@index([expiresAt])
}
```

#### Model Updates

**Player** - Add relations:
```prisma
roomsHosted         Room[]       @relation("RoomHost")
roomsAsPlayer1      Room[]       @relation("RoomPlayer1")
roomsAsPlayer2      Room[]       @relation("RoomPlayer2")
roomMemberships     RoomMember[]
roomInvitesSent     RoomInvite[] @relation("RoomInviter")
roomInvitesReceived RoomInvite[] @relation("RoomInvitee")
```

**Match** - Track room association:
```prisma
// Add optional room reference for matches played in rooms
roomId  String?
room    Room?   @relation(fields: [roomId], references: [id])
```

Note: Room.currentMatchId is a String field that stores the match ID, not a formal Prisma relation. This allows us to track which match is currently active without creating a circular dependency.

**Challenge** - No schema changes needed. Application logic will enforce casual-only.

### API Endpoints

#### Room Management Routes (`/rooms`)

**POST `/rooms/create`**
- Creates a new friend room
- Request: `{ name?: string, mode: 1 | 2 }`
- Response: Room details
- Business logic: Creator becomes host and first member

**GET `/rooms`**
- Lists active rooms where player is a member
- Response: Array of room summaries

**GET `/rooms/available`**
- Lists joinable rooms created by friends
- Filters: status IN (WAITING, BETWEEN_GAMES), creator is friend
- Response: Array of discoverable rooms

**GET `/rooms/:roomId`**
- Gets detailed room state
- Response: Room details, members list, ready states, current game status

**POST `/rooms/:roomId/join`**
- Joins a room as spectator/member
- Validates: player is friends with host, room not closed
- Response: Updated room state
- WebSocket: Notifies all members

**POST `/rooms/:roomId/leave`**
- Leaves the room
- Special case: If host leaves → close room, notify all
- Special case: If active player leaves during game → forfeit
- Response: Success message

**POST `/rooms/:roomId/close`**
- Host-only: Closes the room
- Response: Success message
- WebSocket: Notifies all members

**POST `/rooms/:roomId/ready`**
- Toggles player's ready state for next game
- Request: `{ isReady: boolean }`
- Response: Updated room state
- WebSocket: Notifies all members of ready state change

**POST `/rooms/:roomId/start-game`**
- Host-only: Starts next game
- Validates: Exactly 2 players assigned (player1Id and player2Id set)
- Creates match with isRanked=false
- Updates room status to ACTIVE
- Response: Match details

**POST `/rooms/:roomId/assign-players`**
- Host-only: Assigns which two players play next
- Request: `{ player1Id: string, player2Id: string }`
- Validates: Both players are room members
- Response: Updated room state

#### Room Invite Routes (`/room-invites`)

**POST `/rooms/:roomId/invite`**
- Invites specific friend(s) to room
- Request: `{ inviteeIds: string[] }`
- Validates: All invitees are friends with inviter
- Response: Created invite records
- WebSocket: Sends notifications to invitees

**GET `/room-invites`**
- Gets pending room invites for current player
- Response: `{ received: RoomInvite[] }`

**POST `/room-invites/:inviteId/respond`**
- Accepts or declines invite
- Request: `{ action: 'ACCEPT' | 'DECLINE' }`
- On ACCEPT: Auto-joins room
- Response: Updated invite or room state

#### Challenge Route Updates (`/challenges`)

**POST `/challenges/create`** - Update existing endpoint
- Remove ranked/casual selection from API
- All challenges create casual games (isRanked=false)
- Existing mode selection (1 or 2) remains
- Maintain existing validations and 5-minute expiry

### WebSocket Events

#### Room Events (broadcast to all room members)

**`room:created`**
```typescript
{
  roomId: string
  host: { id, username, displayName, rating }
  name?: string
  mode: number
}
```

**`room:member-joined`**
```typescript
{
  roomId: string
  member: PlayerInfo
  memberCount: number
}
```

**`room:member-left`**
```typescript
{
  roomId: string
  memberId: string
  memberCount: number
  reason?: 'left' | 'kicked' | 'disconnected'
}
```

**`room:ready-state-changed`**
```typescript
{
  roomId: string
  playerId: string
  isReady: boolean
  readyCount: number
}
```

**`room:players-assigned`**
```typescript
{
  roomId: string
  player1: PlayerInfo
  player2: PlayerInfo
}
```

**`room:game-starting`**
```typescript
{
  roomId: string
  matchId: string
  player1: PlayerInfo
  player2: PlayerInfo
}
```

**`room:game-ended`**
```typescript
{
  roomId: string
  matchId: string
  winnerId?: string
  status: RoomStatus // BETWEEN_GAMES
}
```

**`room:closed`**
```typescript
{
  roomId: string
  reason: 'host_left' | 'host_closed' | 'expired' | 'inactivity'
}
```

#### Room Invite Events (emit to invitee only)

**`room-invite:received`**
```typescript
{
  inviteId: string
  roomId: string
  roomName?: string
  inviter: PlayerInfo
  expiresAt: string
}
```

**`room-invite:accepted`** (emit to inviter)
```typescript
{
  inviteId: string
  roomId: string
  invitee: PlayerInfo
}
```

**`room-invite:declined`** (emit to inviter)
```typescript
{
  inviteId: string
  roomId: string
  inviteeId: string
}
```

## Business Rules

### Room Rules
1. Only friends can join a room (requires ACCEPTED friendship)
2. Host can close room at any time
3. If host leaves, room is automatically closed
4. Maximum 2 active players at a time, unlimited spectators
5. Room expires after 3 hours from creation
6. Room also expires after 30 minutes of inactivity (no games played)
7. All games in rooms are casual (isRanked=false enforced)
8. Ready state resets after each game ends
9. Only host can assign players and start games
10. Cannot start game unless exactly 2 players are assigned

### Challenge Rules
1. All challenges are casual/unranked (isRanked=false)
2. 5-minute expiry (existing behavior)
3. Can only challenge friends (existing validation)
4. Maximum 3 pending challenges per player (existing)

### Ready System
1. Any member can toggle their ready state
2. Host sees ready count
3. Host manually picks which 2 players play (from ready or not)
4. Ready states reset to false after game starts

## Data Flow

### Room Lifecycle

1. **Creation**
   - POST `/rooms/create` → Creates room with hostId, mode
   - Host automatically added as RoomMember
   - Room visible in `/rooms/available` for friends
   - Optional: Host sends invites via `/rooms/:roomId/invite`

2. **Discovery & Joining**
   - Friends see room in available list (GET `/rooms/available`)
   - OR receive WebSocket `room-invite:received` notification
   - Join via POST `/rooms/:roomId/join` or POST `/room-invites/:inviteId/respond`
   - WebSocket `room:member-joined` notifies all members

3. **Pre-Game Setup**
   - Members toggle ready state via POST `/rooms/:roomId/ready`
   - WebSocket `room:ready-state-changed` broadcasts to all
   - Host assigns players via POST `/rooms/:roomId/assign-players`
   - WebSocket `room:players-assigned` notifies all

4. **Starting Game**
   - Host calls POST `/rooms/:roomId/start-game`
   - Validates: player1Id and player2Id are set
   - Creates Match with isRanked=false, roomId set
   - Updates Room status to ACTIVE
   - Resets all ready states to false
   - WebSocket `room:game-starting` notifies all

5. **During Game**
   - Room status = ACTIVE
   - Game logic handled by existing match system
   - Other members spectate (not implemented in this design)
   - Room.currentMatchId points to active match

6. **Between Games**
   - Game ends, match result saved
   - Room status updated to BETWEEN_GAMES
   - Room.currentMatchId cleared
   - Room.lastActivityAt updated
   - WebSocket `room:game-ended` notifies all
   - Cycle returns to step 3 (members can ready up again)

7. **Expiry/Closure**
   - Auto-expire: Background job checks expiresAt or lastActivityAt
   - Manual close: Host calls POST `/rooms/:roomId/close`
   - Host leaves: POST `/rooms/:roomId/leave` auto-closes if host
   - WebSocket `room:closed` notifies all members
   - Room status set to CLOSED

### Challenge Flow (Updated)

Same as existing flow, but:
- Remove ranked selection from frontend
- Backend enforces isRanked=false when creating match
- Challenge model's mode field remains (specifies game mode)

## Error Handling

| Error | Status Code | Scenario |
|-------|-------------|----------|
| Room not found | 404 | Invalid roomId |
| Not authorized | 403 | Non-host attempts host-only action |
| Not a member | 403 | Non-member attempts member action |
| Not friends | 403 | Attempting to join non-friend's room |
| Room closed | 409 | Attempting to join closed room |
| Room full | 400 | Attempting to assign >2 players |
| Game in progress | 409 | Attempting to start game while ACTIVE |
| Invalid player assignment | 400 | Assigned players not in room |
| Insufficient players | 400 | Attempting to start without 2 assigned players |
| Invite already exists | 409 | Sending duplicate invite |
| Challenge must be casual | 400 | Legacy: if ranked flag passed |

## Implementation Notes

### Phase 1: Database & Schema
1. Create migration for Room, RoomMember, RoomInvite models
2. Add Player relations
3. Add Match.roomId field
4. Run migration

### Phase 2: API Routes
1. Create `/routes/rooms.ts` with all room management endpoints
2. Create `/routes/room-invites.ts` for invite management
3. Update `/routes/challenges.ts` to enforce casual-only
4. Add rate limiters for room operations

### Phase 3: WebSocket Events
1. Add room event emitters to wsManager
2. Implement room-specific event broadcasting
3. Add invite notification events

### Phase 4: Background Jobs
1. Create room expiry job (checks expiresAt and lastActivityAt)
2. Integrate with existing challenge expiry pattern
3. Schedule to run every 5 minutes

### Phase 5: Frontend (Not in this spec)
- Room list UI
- Room lobby UI with member list and ready states
- Room invite notifications
- Update challenge UI to remove ranked option

## Testing Strategy

### Unit Tests
- Room business logic (creation, joining, leaving)
- Ready state management
- Player assignment validation
- Expiry calculation logic

### Integration Tests
- Full room lifecycle (create → join → play → close)
- Host leaving closes room
- Player rotation between games
- Invite flow (send → accept → join)
- Challenge creation enforces casual

### WebSocket Tests
- Events broadcast to correct room members
- Invite notifications reach invitees
- Room closure notifications

### Edge Cases
- Host leaves during active game
- Player leaves during active game
- Concurrent joins to same room
- Expired invites
- Room expiry during active game
- Multiple rapid ready state toggles

## Security Considerations

1. **Authorization**: Verify friendship before allowing room join
2. **Host privileges**: Validate hostId on all host-only actions
3. **Rate limiting**: Prevent room creation spam
4. **Expiry enforcement**: Background job cleans up abandoned rooms
5. **Input validation**: Validate all player IDs are valid and in room
6. **WebSocket**: Only send events to authorized participants

## Future Enhancements (Out of Scope)

- Room chat/messaging
- Spectator view in game UI
- Room settings (time limits, game variants)
- Room history/stats
- Tournament brackets for rooms with 3+ players
- Room passwords for extra privacy
- Voice chat integration

## Open Questions

None - all requirements clarified through design discussion.
