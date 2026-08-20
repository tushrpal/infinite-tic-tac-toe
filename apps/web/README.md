# Infinite TTT - Web Application

A modern, responsive web application for competitive Tic-Tac-Toe built with Next.js 14, featuring real-time multiplayer, OAuth authentication, and a polished UI.

## 🌟 Features

### ✅ Implemented

- **Game Modes**
  - Local play (human vs human on same device)
  - Online casual (unranked multiplayer)
  - Ranked competitive (with ELO ratings)
  - Bot opponents (Random & Heuristic)
  
- **Real-time Multiplayer**
  - WebSocket connections for instant updates
  - Live opponent moves with <20ms latency
  - Spectator mode (watch live matches)
  - Match replay system
  
- **User Features**
  - OAuth authentication (Google & Discord)
  - Username customization
  - Player profiles with statistics
  - Match history
  - Mode-specific ratings (Mode 1 & Mode 2)
  
- **UI/UX**
  - Responsive design (mobile & desktop)
  - Light/Dark theme with system detection
  - Smooth animations (Framer Motion)
  - Accessible components
  - Loading states & error handling
  
- **Competitive Features**
  - Global leaderboard
  - Real-time rating updates
  - Match statistics
  - Win/loss tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Backend server running (see [Backend README](../backend/README.md))

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here_min_32_chars

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 3. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000

### 4. Build for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
apps/web/
├── app/                        # Next.js 14 App Router
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/  # NextAuth routes
│   ├── play/
│   │   ├── page.tsx            # Play mode selection
│   │   ├── local/              # Local multiplayer
│   │   ├── online/             # Casual online
│   │   └── ranked/             # Ranked competitive
│   ├── profile/
│   │   └── page.tsx            # Player profile & stats
│   ├── leaderboard/
│   │   └── page.tsx            # Global rankings
│   ├── match/
│   │   └── [matchId]/          # Match details
│   ├── replay/
│   │   └── [matchId]/          # Match replay viewer
│   └── watch/
│       └── [matchId]/          # Live spectator mode
│
├── components/
│   ├── layout/                 # Navigation, headers, footers
│   ├── board/                  # Game board components
│   │   ├── Board.tsx           # Main board renderer
│   │   ├── Cell.tsx            # Individual cell
│   │   └── WinLine.tsx         # Victory line animation
│   ├── hud/                    # Game HUD elements
│   │   ├── PlayerInfo.tsx      # Player cards
│   │   ├── TurnIndicator.tsx   # Current turn display
│   │   └── GameControls.tsx    # Action buttons
│   ├── auth/                   # Authentication components
│   │   ├── LoginButton.tsx     # OAuth login
│   │   └── UserMenu.tsx        # Profile dropdown
│   ├── profile/                # Profile page components
│   │   ├── ProfileHeader.tsx   # User info card
│   │   ├── StatsCard.tsx       # Statistics display
│   │   └── MatchHistory.tsx    # Match list
│   ├── modals/                 # Modal dialogs
│   │   ├── GameOverModal.tsx   # Victory/defeat screen
│   │   ├── MatchmakingModal.tsx # Queue UI
│   │   └── SettingsModal.tsx   # Game settings
│   ├── animations/             # Framer Motion animations
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   └── providers/              # Context providers
│       ├── AuthProvider.tsx    # Auth context
│       ├── PlayerProvider.tsx  # Player data
│       └── ThemeProvider.tsx   # Theme management
│
├── hooks/                      # Custom React hooks
│   ├── useGameState.ts         # Game logic hook
│   ├── useWebSocket.ts         # WebSocket connection
│   ├── useMatchmaking.ts       # Queue management
│   ├── useTheme.ts             # Theme switching
│   └── usePlayer.ts            # Player data hook
│
├── lib/                        # Utility functions
│   ├── api.ts                  # API client
│   ├── websocket.ts            # WebSocket client
│   ├── auth.ts                 # NextAuth config
│   └── utils.ts                # Helper functions
│
├── styles/
│   └── globals.css             # Global styles & Tailwind
│
├── public/                     # Static assets
│   ├── icons/
│   └── images/
│
└── types/                      # TypeScript types
    └── index.ts
```

## 🎮 Pages Overview

### Home (`/`)
- Hero section with game introduction
- Quick play buttons
- Featured matches
- Recent activity

### Play Mode Selection (`/play`)
- Local multiplayer
- Online casual
- Ranked competitive
- Bot practice

### Local Game (`/play/local`)
- Pass-and-play on same device
- Mode selection (Mode 1 or Mode 2)
- No authentication required

### Online Casual (`/play/online`)
- Matchmaking with random opponent
- Unranked (no rating changes)
- Real-time gameplay via WebSocket

### Ranked Competitive (`/play/ranked`)
- ELO-based matchmaking
- Rating changes after each match
- Mode-specific rankings

### Profile (`/profile`)
- Player statistics
- Rating history
- Match history with filters
- Username management

### Leaderboard (`/leaderboard`)
- Global rankings by mode
- Top 100 players
- Win rates and match counts
- Search functionality

### Match Details (`/match/[matchId]`)
- Complete match information
- Player stats
- Move history
- Rating changes (if ranked)

### Replay Viewer (`/replay/[matchId]`)
- Step-through move history
- Board state at each turn
- Play/pause controls
- Speed controls

### Spectator Mode (`/watch/[matchId]`)
- Watch live ongoing matches
- Real-time updates
- Player information
- Current turn indicator

## 🎨 Styling & Theme

### Tailwind CSS

Custom theme configuration in `tailwind.config.js`:

```javascript
colors: {
  surface: {
    base: 'var(--surface-base)',
    elevated: 'var(--surface-elevated)',
    overlay: 'var(--surface-overlay)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
  },
  accent: {
    primary: 'var(--accent-primary)',
    secondary: 'var(--accent-secondary)',
  },
  player: {
    x: 'var(--player-x)',
    o: 'var(--player-o)',
  },
}
```

### Theme System

Three theme options:
- **Light**: High contrast, bright background
- **Dark**: Low contrast, dark background (default)
- **System**: Follows OS preference

Toggle via navigation menu or keyboard shortcut.

### Custom Fonts

- **Display**: Space Grotesk (headings)
- **Body**: Inter (paragraphs)
- **Mono**: JetBrains Mono (code, stats)

## 🔌 API Integration

### REST API

```typescript
// Get player profile
const player = await fetch(`${API_URL}/players/${playerId}`);

// Get leaderboard
const leaderboard = await fetch(`${API_URL}/leaderboard?mode=mode1&limit=100`);

// Get match history
const matches = await fetch(`${API_URL}/players/${playerId}/matches?limit=50`);
```

### WebSocket

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { socket, isConnected, sendMove } = useWebSocket(matchId);

useEffect(() => {
  if (!socket) return;

  socket.on('state', (matchState) => {
    // Handle state update
  });

  socket.on('complete', (result) => {
    // Handle match completion
  });
}, [socket]);
```

## 🔐 Authentication

### NextAuth Configuration

OAuth providers configured in `app/api/auth/[...nextauth]/route.ts`:

```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  }),
]
```

### Session Management

```typescript
import { useSession } from 'next-auth/react';

export function ProtectedComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Loading />;
  if (status === 'unauthenticated') return <LoginPrompt />;

  return <AuthenticatedContent user={session.user} />;
}
```

### Protected Routes

Automatic redirect to login for:
- `/profile`
- `/play/online`
- `/play/ranked`

Public routes:
- `/` (home)
- `/play/local`
- `/leaderboard`
- `/watch/*` (spectator)

## 🎯 Game Logic Integration

### Using the Game Engine

```typescript
import { Modes } from '@infinite-ttt/game-engine';

// Initialize game state
const [gameState, setGameState] = useState(() => 
  Modes.Infinite3x3.createInitialState()
);

// Apply move
const handleMove = (row: number, col: number) => {
  if (!Modes.Infinite3x3.isValidMove(gameState, { row, col })) {
    return;
  }

  const newState = Modes.Infinite3x3.applyMove(gameState, { row, col });
  setGameState(newState);

  // Check for winner
  const winner = Modes.Infinite3x3.detectWinner(newState);
  if (winner) {
    handleGameOver(winner);
  }
};
```

### Custom Hook Example

```typescript
// hooks/useGameState.ts
export function useGameState(mode: 'mode1' | 'mode2') {
  const [state, setState] = useState(() => 
    mode === 'mode1' 
      ? Modes.Infinite3x3.createInitialState()
      : Modes.ExpandingBoard.createInitialState()
  );

  const makeMove = useCallback((row: number, col: number) => {
    // Validation and state update logic
  }, [state, mode]);

  const reset = useCallback(() => {
    setState(mode === 'mode1' 
      ? Modes.Infinite3x3.createInitialState()
      : Modes.ExpandingBoard.createInitialState()
    );
  }, [mode]);

  return { state, makeMove, reset };
}
```

## 📱 Responsive Design

### Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile Optimizations

- Touch-friendly cell sizes (min 44×44px)
- Simplified navigation menu
- Vertical layout for game board
- Bottom sheet modals
- Swipe gestures for history

### Board Scaling

```typescript
// Responsive board size
const getBoardSize = () => {
  if (window.innerWidth < 640) return 280; // Mobile
  if (window.innerWidth < 1024) return 400; // Tablet
  return 480; // Desktop
};
```

## ⚡ Performance Optimizations

### Implemented

- ✅ Next.js automatic code splitting
- ✅ Image optimization (next/image)
- ✅ Font optimization (next/font)
- ✅ React component memoization
- ✅ WebSocket message throttling
- ✅ Lazy loading for modals
- ✅ Prefetching for common routes

### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
# Check .next/analyze/ for reports
```

### Lighthouse Scores (Target)

- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

## 🧪 Testing

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
pnpm lint --fix
```

### Manual Testing Checklist

- [ ] Local game works offline
- [ ] OAuth login flow (Google & Discord)
- [ ] Online matchmaking connects players
- [ ] Real-time moves update both clients
- [ ] Rating updates after ranked match
- [ ] Profile shows accurate statistics
- [ ] Leaderboard displays correctly
- [ ] Replay viewer steps through moves
- [ ] Spectator mode shows live updates
- [ ] Theme switching persists
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works

## 🚀 Deployment

### Vercel (Recommended)

Already configured with `vercel.json`.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`

### Custom Hosting

```bash
# Build
pnpm build

# Start production server
pnpm start

# Or export static (if no API routes needed)
pnpm build && pnpm export
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 🐛 Common Issues

### OAuth Redirect Error

**Problem:** `redirect_uri_mismatch`

**Solution:**
1. Check OAuth app settings
2. Ensure redirect URI matches exactly:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`

### WebSocket Connection Failed

**Problem:** Cannot connect to WebSocket

**Solution:**
1. Check `NEXT_PUBLIC_WS_URL` is correct
2. Verify backend is running
3. Check browser console for CORS errors
4. Ensure WebSocket port is accessible

### Hydration Errors

**Problem:** React hydration mismatch

**Solution:**
1. Use `suppressHydrationWarning` on `<html>` for theme
2. Wrap dynamic content in `useEffect`
3. Ensure server/client states match

### Rating Not Updating

**Problem:** Rating stays same after ranked match

**Solution:**
1. Verify match is marked as `isRanked: true`
2. Check backend logs for rating calculation
3. Ensure both players have valid ratings

## 🔧 Configuration

### Next.js Config

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google avatars
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
};
```

## 📚 Related Documentation

- [Main README](../../README.md)
- [Backend API](../backend/README.md)
- [Game Engine](../../packages/game-engine/README.md)
- [API Reference](../../docs/API.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)

## 🗺️ Roadmap

### Near-term
- [ ] Tournament mode UI
- [ ] Friend challenges
- [ ] In-game chat
- [ ] Achievement system
- [ ] Custom avatars

### Long-term
- [ ] Progressive Web App (PWA)
- [ ] Offline mode with sync
- [ ] Social features (follow/friends)
- [ ] Replay sharing
- [ ] Embedded match viewer

---

**Built with Next.js 14 • React 18 • Tailwind CSS • Framer Motion • NextAuth**
