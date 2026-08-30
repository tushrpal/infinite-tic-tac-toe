# Room UI Design Specification

**Date:** 2026-08-29  
**Status:** Approved  
**Related Backend Plan:** [docs/superpowers/plans/2026-08-29-friend-rooms-casual-challenges.md](../plans/2026-08-29-friend-rooms-casual-challenges.md)

## Overview

Add frontend UI for the friend rooms system. Rooms are persistent social lobbies where up to 8 friends can hang out, with 2 playing at a time while others spectate. The host manually assigns which players play next, and rooms persist across multiple games.

## Goals

1. Allow users to create and browse friend rooms
2. Provide a lobby interface for managing room membership and game flow
3. Integrate room status into the existing friends system
4. Support real-time updates via WebSocket events
5. Follow existing design patterns and component architecture

## Non-Goals

- Public matchmaking rooms (rooms are friends-only per backend design)
- Voice/text chat within rooms (may be added later)
- Spectator-specific features beyond watching the match
- Room permissions system beyond host controls

## Architecture

### New Routes

**Primary Routes:**
- `/play/rooms` - Rooms hub (browse available rooms, view your rooms, create new)
- `/rooms/:roomId` - Room lobby page

**Integration Points:**
- `/play` page - Add "Rooms" card to play mode selection
- Friends Panel - Show room indicators and join buttons

### Component Structure

```
app/
  play/
    rooms/
      page.tsx              # Rooms hub
      [roomId]/
        page.tsx            # Room lobby
        
components/
  rooms/
    RoomCard.tsx            # Room list item with join button
    CreateRoomModal.tsx     # Modal for creating new room
    RoomLobby.tsx           # Main lobby container component
    PlayerList.tsx          # List of room members with ready states
    PlayerAssignmentModal.tsx  # Host assigns players for next game
    RoomInviteModal.tsx     # Invite friends to room
    RoomInviteNotification.tsx # Toast notification for invites
    
hooks/
  useRoomState.ts           # Room state management hook
  useRoomEvents.ts          # WebSocket event handlers for rooms
```

### State Management

**New Custom Hooks:**

1. **`useRoomState(roomId: string)`**
   - Fetches room data via `GET /rooms/:roomId`
   - Manages local state for player list, ready states, assignments
   - Subscribes to WebSocket room events
   - Returns: room data, members, status, actions (join, leave, ready, etc.)

2. **`useRoomEvents(roomId: string, handlers)`**
   - Subscribes to room WebSocket events
   - Handles real-time updates (members joining/leaving, ready state changes, etc.)
   - Automatically unsubscribes on unmount

**Extend Existing:**
- `useWebSocket` - Add room event types to ServerEventType
- Friends context - Add room status to friend data structure

### Data Flow

**Rooms Hub (`/play/rooms`):**
```
On mount:
  → GET /rooms (my active rooms)
  → GET /rooms/available (joinable friend rooms)
  → GET /room-invites (pending invites)
  
Actions:
  → Click "Create Room" → Open CreateRoomModal
  → Click "Join" on room card → POST /rooms/:roomId/join → Navigate to lobby
  → Accept invite → POST /room-invites/:inviteId/respond → Navigate to lobby
```

**Room Lobby (`/rooms/:roomId`):**
```
On mount:
  → GET /rooms/:roomId (full room state with members)
  → Subscribe to WebSocket events for this room
  
WebSocket subscriptions:
  → ROOM_MEMBER_JOINED - Add to player list, show in activity
  → ROOM_MEMBER_LEFT - Remove from player list, show in activity
  → ROOM_READY_STATE_CHANGED - Update ready badge on player card
  → ROOM_PLAYERS_ASSIGNED - Update assignment display
  → ROOM_GAME_STARTING - Show starting state or navigate to match
  → ROOM_GAME_ENDED - Return to lobby, show result
  → ROOM_CLOSED - Redirect to hub with toast
  
Actions:
  → Toggle ready → POST /rooms/:roomId/ready
  → Assign players (host) → POST /rooms/:roomId/assign-players
  → Start game (host) → POST /rooms/:roomId/start-game
  → Invite friends → POST /rooms/:roomId/invite
  → Leave room → POST /rooms/:roomId/leave
  → Close room (host) → POST /rooms/:roomId/close (with confirmation)
```

## User Interface Design

### 1. Rooms Hub (`/play/rooms`)

**Layout:** Desktop two-column, mobile stacked

**Left Column - Room Browser (60% width):**

Header: "Rooms"

Tabs:
- "My Rooms" - Active rooms you're a member of (always visible if any)
- "Available" - Joinable rooms from friends

Room Card Design:
```
┌─────────────────────────────────────┐
│ 🏠 Room Name or "[Host]'s Room"     │
│ Host: username · Mode: Sliding      │
│ 👥 3/8 players · [Status Badge]     │
│ [Join Room] or [Open Room]          │
└─────────────────────────────────────┘
```

Status Badges:
- WAITING: Green "Open" badge
- ACTIVE: Blue "In Game" badge  
- BETWEEN_GAMES: Yellow "Between Games" badge
- CLOSED: Gray "Closed" badge (filtered out)

Button labels:
- "Join Room" for rooms you're not in
- "Open Room" for rooms you're already in

Empty states:
- My Rooms: "You're not in any rooms"
- Available: "No rooms available. Create one to get started!"

**Right Column - Create Room (40% width):**

Sticky card with:
- Large "Create Room" button (primary CTA)
- Brief explainer: "Create a lobby for up to 8 friends to play multiple games"
- Optional: "X friends online" status

**Pending Invites Section:**

If invites exist, show above the tabs:
```
┌──────────────────────────────────────┐
│ 📨 Room Invites (2)                  │
│                                      │
│ Alice invited you to "Epic Battles"  │
│ [Accept] [Decline]                   │
│                                      │
│ Bob invited you to "Chill Games"     │
│ [Accept] [Decline]                   │
└──────────────────────────────────────┘
```

### 2. Create Room Modal

Form with validation:

**1. Room Name (optional)**
- Text input, max 50 characters
- Placeholder: "Epic Battles", "Chill Games", etc.
- Default: null (displays as "[Your Name]'s Room" in UI)

**2. Game Mode (required)**
- Radio button group:
  - ⚡ Sliding (MODE_1) - "Marks slide after 3 placed"
  - 🎯 Classic (MODE_2) - "Traditional tic-tac-toe"
- Default: MODE_1

**3. Max Players (optional, UI-only constraint)**
- Dropdown: 2, 3, 4, 5, 6, 7, 8
- Default: 4
- Note: Backend doesn't enforce this yet - UI will show "Room Full" when reached

**Privacy Notice:**
"🔒 Only your friends can see and join this room"

**Actions:**
- [Cancel] (secondary)
- [Create Room] (primary, disabled until mode selected)

**On Success:**
- Close modal
- Navigate to `/rooms/:roomId`
- Show toast: "Room created!"

### 3. Room Lobby (`/rooms/:roomId`)

**Header Bar:**
```
┌────────────────────────────────────────────────┐
│ 🏠 Room Name                                   │
│ Host: username · Mode: Sliding · Status: Open  │
│                                                │
│ [⚙️ Settings] [👥 Invite] [🚪 Leave] [❌ Close]│
└────────────────────────────────────────────────┘
```

Buttons visibility:
- Settings: Host only (edit room name)
- Invite: All members
- Leave: All members
- Close: Host only

On Leave:
- Regular member: Confirm "Leave this room?" → POST /leave → redirect to hub
- Host: Confirm "Close room for everyone?" → POST /close → redirect to hub

**Layout:** Three-section horizontal (desktop), stacked (mobile)

---

#### Section A: Players (Left, ~35% width)

**Header:**
"Players (3/8)" with [+ Invite] button

**Player Cards:**
```
┌───────────────────────────────┐
│ 👑 Alice (Host) (You)         │
│ ⭐ Rating: 1234               │
│ ✅ Ready                      │
└───────────────────────────────┘

┌───────────────────────────────┐
│ 👤 Bob                        │
│ ⭐ Rating: 980                │
│ ⏸️ Not Ready                  │
└───────────────────────────────┘
```

Your own card shows toggle:
- [Mark Ready] when not ready
- [Mark Not Ready] when ready

Visual indicators:
- 👑 Crown icon for host
- "(You)" label for current user
- ✅ Green check for ready
- ⏸️ Gray pause for not ready
- Rating badge (from player profile)

**Invite Button:**
Opens RoomInviteModal

---

#### Section B: Game Assignment (Center, ~35% width)

**State: WAITING or BETWEEN_GAMES**
```
┌─────────────────────────────┐
│ Next Game                   │
│                             │
│  Player 1 (X): Not assigned │
│                             │
│       vs.                   │
│                             │
│  Player 2 (O): Not assigned │
│                             │
│ [Assign Players] (host)     │
│ [Start Game] (host, disabled)│
└─────────────────────────────┘
```

After assignment:
```
┌─────────────────────────────┐
│ Next Game                   │
│                             │
│  Player 1 (X): Alice        │
│                             │
│       vs.                   │
│                             │
│  Player 2 (O): Bob          │
│                             │
│ [Change] (host)             │
│ [Start Game] (host, enabled)│
└─────────────────────────────┘
```

**State: ACTIVE**
```
┌─────────────────────────────┐
│ 🎮 Game in Progress         │
│                             │
│  Alice (X)                  │
│                             │
│       vs.                   │
│                             │
│  Bob (O)                    │
│                             │
│ [Watch Game]                │
└─────────────────────────────┘
```

[Watch Game] → Navigate to `/match/:matchId`

---

#### Section C: Activity Feed (Right, ~30% width)

**Header:** "Activity"

**Feed items (most recent first):**
```
┌────────────────────────────────┐
│ • Alice won the game! (1m)     │
│ • Game started (5m)            │
│ • Host assigned players (6m)   │
│ • Bob marked ready (8m)        │
│ • Charlie joined (10m)         │
│ • Room created (15m)           │
└────────────────────────────────┘
```

Auto-scrolls to show latest
Max 20 items, older items removed
Timestamps relative (1m, 5m, 1h, etc.)

Activity types:
- Player joined/left
- Ready state changed
- Players assigned
- Game started/ended (with winner)
- Room status changed

---

### 4. Player Assignment Modal (Host Only)

Triggered by [Assign Players] or [Change] button

```
┌────────────────────────────────────┐
│ Select Players for Next Game       │
│                                    │
│ Player 1 (X):                      │
│ [Dropdown with all members]        │
│                                    │
│ Player 2 (O):                      │
│ [Dropdown with all members]        │
│                                    │
│ ℹ️ Ready players shown first       │
│                                    │
│ [Cancel] [Assign]                  │
└────────────────────────────────────┘
```

**Dropdown sorting:**
1. Ready players first (with ✅ icon)
2. Not ready players (with ⏸️ icon)
3. Currently assigned players pre-selected

**Validation:**
- Cannot select same player twice
- Shows error if attempted

**On success:**
- Close modal
- Update assignment display
- Show in activity feed

---

### 5. Room Invite Modal

Triggered by [+ Invite] or [👥 Invite] button

```
┌────────────────────────────────────┐
│ Invite Friends to Room             │
│                                    │
│ [🔍 Search friends...]             │
│                                    │
│ ☐ Alice (Online)                   │
│ ☐ Bob (🏠 In another room)        │
│ ☑ Charlie (Online)                 │
│ ☐ Dana (Offline)                   │
│                                    │
│ 1 friend selected                  │
│ [Cancel] [Send Invites]            │
└────────────────────────────────────┘
```

**Features:**
- Multi-select checkboxes
- Search/filter by name
- Show online status indicator
- Gray out players already in this room
- Show if friend is in another room
- Can invite offline friends (they'll see invite later)

**On success:**
- Close modal
- Show toast: "Invited X friends"
- Invitees receive ROOM_INVITE_RECEIVED event

---

### 6. Room Invite Notification

Toast notification triggered by ROOM_INVITE_RECEIVED event:

```
┌────────────────────────────────────┐
│ 📨 Room Invite                     │
│                                    │
│ Alice invited you to "Epic Battles"│
│ Mode: Sliding · 3/8 players        │
│                                    │
│ [Accept] [Decline] [×]             │
└───────────────────────────────────┘
```

Auto-dismiss after 10 seconds if not interacted with
Remains in pending invites list

**Actions:**
- Accept → POST /room-invites/:id/respond → Navigate to lobby
- Decline → POST /room-invites/:id/respond → Dismiss toast
- × → Dismiss toast (invite stays pending)

---

### 7. Friends Panel Integration

**Add room indicator to friend list items:**

Friend in a room:
```
┌────────────────────────────────────┐
│ 👤 Alice (Online)                  │
│ 🏠 In "Epic Battles"               │
│ [Challenge] [Join Room]            │
└────────────────────────────────────┘
```

Friend not in room (unchanged):
```
┌────────────────────────────────────┐
│ 👤 Bob (Online)                    │
│ [Challenge]                        │
└────────────────────────────────────┘
```

**Join Room button:**
- Visible when friend is in a joinable room (status WAITING or BETWEEN_GAMES)
- Click → POST /rooms/:id/join → Navigate to lobby
- Hidden if room is ACTIVE or you're already in it

---

### 8. Play Menu Integration (`/play` page)

Add "Rooms" card alongside existing play modes:

```
┌─────────────────────────────┐
│ 🏠                          │
│ Play with Friends           │
│                             │
│ Create a room and play      │
│ multiple games with friends │
│                             │
│ [Enter Rooms]               │
└─────────────────────────────┘
```

Position: After "Practice" card, before any future modes

---

## WebSocket Event Handling

### New Event Types

Add to `ws/types.ts` ServerEventType:
```typescript
| 'ROOM_CREATED'
| 'ROOM_MEMBER_JOINED'
| 'ROOM_MEMBER_LEFT'
| 'ROOM_READY_STATE_CHANGED'
| 'ROOM_PLAYERS_ASSIGNED'
| 'ROOM_GAME_STARTING'
| 'ROOM_GAME_ENDED'
| 'ROOM_CLOSED'
| 'ROOM_INVITE_RECEIVED'
| 'ROOM_INVITE_ACCEPTED'
| 'ROOM_INVITE_DECLINED'
```

### Event Handlers

**`ROOM_MEMBER_JOINED`**
```typescript
{
  roomId: string;
  member: {
    id: string;
    username: string;
    displayName: string;
    ratingMode1: number;
    ratingMode2: number;
  };
  memberCount: number;
}
```
Actions:
- Add member to player list
- Update member count
- Add to activity feed: "{member} joined"

**`ROOM_MEMBER_LEFT`**
```typescript
{
  roomId: string;
  memberId: string;
  memberCount: number;
}
```
Actions:
- Remove member from player list
- Update member count
- Add to activity feed: "{member} left"

**`ROOM_READY_STATE_CHANGED`**
```typescript
{
  roomId: string;
  playerId: string;
  isReady: boolean;
  readyCount: number;
}
```
Actions:
- Update ready badge on player card
- Update ready count display
- Add to activity feed: "{player} marked ready/not ready"

**`ROOM_PLAYERS_ASSIGNED`**
```typescript
{
  roomId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
}
```
Actions:
- Update assignment display in center panel
- Add to activity feed: "Host assigned {player1} vs {player2}"

**`ROOM_GAME_STARTING`**
```typescript
{
  roomId: string;
  matchId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
}
```
Actions:
- Show "Game starting..." overlay (1 second)
- Navigate assigned players to `/match/:matchId`
- Update room status to ACTIVE
- Show spectate button for non-playing members
- Add to activity feed: "Game started"

**`ROOM_GAME_ENDED`**
```typescript
{
  roomId: string;
  matchId: string;
  winner: 'PLAYER_1' | 'PLAYER_2' | 'DRAW';
  player1: PlayerInfo;
  player2: PlayerInfo;
}
```
Actions:
- Update room status to BETWEEN_GAMES
- Clear player assignments
- Reset all ready states to false
- Add to activity feed: "{winner} won!" or "Draw!"
- Show toast to members: "Game ended, back to lobby"

**`ROOM_CLOSED`**
```typescript
{
  roomId: string;
  reason: 'host_left' | 'host_closed' | 'expired';
}
```
Actions:
- Show toast based on reason:
  - host_left: "Room closed - host left"
  - host_closed: "Room closed by host"
  - expired: "Room closed - inactive too long"
- Redirect all members to `/play/rooms`

**`ROOM_INVITE_RECEIVED`**
```typescript
{
  inviteId: string;
  roomId: string;
  roomName: string | null;
  inviter: PlayerInfo;
  expiresAt: string;
}
```
Actions:
- Show RoomInviteNotification toast
- Add to pending invites list
- Play notification sound (if enabled)

**`ROOM_INVITE_ACCEPTED`**
```typescript
{
  inviteId: string;
  roomId: string;
  invitee: PlayerInfo;
}
```
Actions (for inviter only):
- Show toast: "{invitee} accepted your room invite"

**`ROOM_INVITE_DECLINED`**
```typescript
{
  inviteId: string;
  roomId: string;
  inviteeId: string;
}
```
Actions (for inviter only):
- Show toast: "Your room invite was declined"

---

## API Integration

### REST Endpoints Used

**Room Management:**
- `POST /rooms/create` - Create room
- `GET /rooms` - List my rooms
- `GET /rooms/available` - List joinable friend rooms
- `GET /rooms/:roomId` - Get room details
- `POST /rooms/:roomId/join` - Join room
- `POST /rooms/:roomId/leave` - Leave room
- `POST /rooms/:roomId/close` - Close room (host only)
- `POST /rooms/:roomId/ready` - Toggle ready state
- `POST /rooms/:roomId/assign-players` - Assign players (host only)
- `POST /rooms/:roomId/start-game` - Start game (host only)

**Room Invites:**
- `POST /rooms/:roomId/invite` - Send invites
- `GET /room-invites` - Get pending invites
- `POST /room-invites/:inviteId/respond` - Accept/decline invite

### Type Definitions

```typescript
// Room types
type RoomStatus = 'WAITING' | 'ACTIVE' | 'BETWEEN_GAMES' | 'CLOSED';

interface Room {
  id: string;
  hostId: string;
  name: string | null;
  mode: 1 | 2;
  status: RoomStatus;
  player1Id: string | null;
  player2Id: string | null;
  currentMatchId: string | null;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
  host: PlayerInfo;
  player1?: PlayerInfo;
  player2?: PlayerInfo;
  members: RoomMember[];
}

interface RoomMember {
  id: string;
  roomId: string;
  playerId: string;
  isReady: boolean;
  joinedAt: string;
  player: PlayerInfo;
}

interface RoomInvite {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  room?: {
    id: string;
    name: string | null;
    mode: number;
    status: RoomStatus;
  };
  inviter?: PlayerInfo;
}

interface PlayerInfo {
  id: string;
  username: string;
  displayName: string;
  ratingMode1?: number;
  ratingMode2?: number;
}
```

---

## Design System Consistency

**Follow Existing Patterns:**

1. **Components:**
   - Use `@/components/ui/Button` for all buttons
   - Use existing modal patterns from `ChallengeModal`
   - Use `@/components/ui/Badge` for status indicators
   - Match styling from `/play/online` page for consistency

2. **Colors:**
   - Primary actions: `accent-primary`
   - Success states: `accent-success`
   - Warning states: `accent-warning`
   - Critical actions: `critical`
   - Background: `surface-elevated` for cards
   - Borders: `board-grid`

3. **Typography:**
   - Headers: `font-display font-bold`
   - Body: `text-text-primary`
   - Secondary: `text-text-secondary`
   - Muted: `text-text-muted`

4. **Spacing:**
   - Card padding: `p-4`
   - Section gaps: `gap-6`
   - Form field gaps: `gap-4`

5. **Animations:**
   - Fade in: Use existing fade transitions
   - Slide animations: Match board animation timing
   - Hover states: `transition-colors duration-150`

**Responsive Design:**

Desktop (≥1024px):
- Three-column lobby layout
- Two-column rooms hub
- Sidebar modals

Tablet (768px - 1023px):
- Stack center and right columns in lobby
- Full-width cards in hub
- Full-screen modals

Mobile (<768px):
- Full stack all sections
- Collapsible player list
- Bottom-sheet modals

---

## Error Handling & Edge Cases

### Network Errors

**Connection Lost During Lobby:**
- Show connection status indicator (reuse from online play)
- Attempt to reconnect via existing WebSocket reconnect logic
- On reconnect success: refetch room state
- On reconnect failure after max retries: redirect to hub with error toast

**API Errors:**
- 404 Room not found → Toast + redirect to hub
- 403 Not authorized → Toast + redirect to hub
- 409 Conflict (e.g., room full) → Toast with specific message
- 500 Server error → Generic error toast, retry button

### Room State Changes

**Room Closes While You're In It:**
- ROOM_CLOSED event → Show toast with reason → Redirect to hub
- Handle gracefully if already on another page

**Host Leaves:**
- Room closes for everyone
- Show toast: "Room closed - host left"
- Redirect all members to hub

**Max Players Reached:**
- Disable join button on room card
- Show "Room Full (8/8)" badge
- Attempting to join returns 409 → Show toast

**Game Starts While Joining:**
- Join succeeds → Player becomes spectator
- Show in-progress game in center panel
- [Watch Game] button available

**Player Disconnects During Game:**
- Game continues (handled by existing match logic)
- Player can rejoin room after reconnect
- Activity feed shows "{player} disconnected" if detected

### Invite Edge Cases

**Invite Expires:**
- Gray out expired invites in list
- Attempting to accept → 400 error → Toast "Invite expired"
- Auto-remove expired invites after 24 hours

**Room Closed Before Accept:**
- Attempting to accept → 400 error → Toast "Room no longer available"

**Already in Room:**
- Attempting to join → 409 error → Toast "You're already in this room"

**Invited Friend Not Online:**
- Invite sent successfully
- Friend sees invite when they come online
- Expires after 24 hours

### Host Controls

**Non-Host Attempts Host Action:**
- Hide host-only buttons for non-hosts in UI
- Backend returns 403 → Should not happen in normal UX

**Start Game Without Assignments:**
- [Start Game] button disabled until 2 players assigned
- Backend validates → 400 error if somehow attempted

**Assign Same Player Twice:**
- Modal validates → Show error in modal
- Backend validates → 400 error as fallback

---

## Testing Strategy

### Manual Testing Checklist

**Room Creation & Browsing:**
- [ ] Create room with all field combinations
- [ ] Create room appears in "My Rooms"
- [ ] Friend's room appears in "Available" for you
- [ ] Room cards show correct info (name, host, mode, status, count)

**Joining & Leaving:**
- [ ] Join friend's room from hub
- [ ] Join friend's room from friends panel
- [ ] Join via invite
- [ ] Player appears in lobby for all members
- [ ] Leave room as regular member
- [ ] Leave room as host (closes for all)

**Lobby Interactions:**
- [ ] Toggle ready state → Badge updates for all members
- [ ] Host assigns players → Assignment display updates for all
- [ ] Host changes assignment → Updates correctly
- [ ] Host starts game → Assigned players navigate to match
- [ ] Non-assigned members see spectate button

**Game Flow:**
- [ ] Assigned players redirected to match page
- [ ] Match page works correctly (existing functionality)
- [ ] ROOM_GAME_ENDED returns players to lobby
- [ ] Assignments cleared, ready states reset
- [ ] Activity feed shows result

**Invites:**
- [ ] Send invite from lobby
- [ ] Invitee receives notification
- [ ] Accept invite → Join room
- [ ] Decline invite → Dismissed
- [ ] Invite expires correctly

**Real-time Updates:**
- [ ] Member joins → All see update
- [ ] Member leaves → All see update
- [ ] Ready state changes → All see update
- [ ] Assignment changes → All see update
- [ ] Room closes → All redirected

**Friends Panel:**
- [ ] Friends in rooms show room badge
- [ ] Join button appears and works
- [ ] Join button hidden for ACTIVE rooms

**Error Cases:**
- [ ] Room closed → Redirect with toast
- [ ] Max players → Cannot join
- [ ] Network disconnect → Reconnect flow
- [ ] Invalid room ID → 404 handling

**Responsive:**
- [ ] Desktop layout works
- [ ] Tablet layout works
- [ ] Mobile layout works
- [ ] Modals adapt to screen size

### Integration Points to Verify

1. **WebSocket Connection:**
   - Events received correctly
   - Events update state immediately
   - No duplicate event handling

2. **Match Integration:**
   - Match created with correct mode and players
   - Match page loads correctly
   - Return to lobby after match ends
   - Match marked as `isRanked: false`

3. **Friends System:**
   - Only friends' rooms visible
   - Room indicators accurate
   - Join from friends panel works

4. **Authentication:**
   - All API calls include auth token
   - 401 errors handled correctly

---

## Implementation Phases

### Phase 1: Core Lobby (Priority: Critical)
- Room lobby page and components
- Basic state management (useRoomState)
- WebSocket event handlers
- Player list with ready states
- Join/leave functionality

### Phase 2: Host Controls (Priority: Critical)
- Player assignment modal
- Start game functionality
- Host-only button visibility
- Close room functionality

### Phase 3: Room Browsing (Priority: High)
- Rooms hub page
- Room cards component
- My rooms / available tabs
- Navigation integration

### Phase 4: Room Creation (Priority: High)
- Create room modal
- Form validation
- POST /rooms/create integration

### Phase 5: Invites (Priority: Medium)
- Room invite modal
- Invite notifications
- Accept/decline flow
- Pending invites list

### Phase 6: Polish (Priority: Low)
- Activity feed
- Friends panel integration
- Play menu card
- Responsive refinements
- Animation polish

---

## Success Criteria

1. Users can create and browse rooms
2. Users can join friend rooms and see real-time updates
3. Host can assign players and start games
4. Players navigate to match page and return to lobby after game
5. Invites work end-to-end
6. UI matches existing design system
7. Responsive on all screen sizes
8. All error cases handled gracefully
9. No console errors or warnings
10. All manual test cases pass

---

## Future Enhancements (Out of Scope)

- Public/matchmaking rooms
- Room chat system
- Spectator-specific UI (chat, replay controls)
- Room history/stats
- Custom room backgrounds/themes
- Room bookmarking
- Advanced host controls (kick player, transfer host)
- Tournament/bracket mode in rooms
