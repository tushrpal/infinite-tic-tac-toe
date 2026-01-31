# WebSocket PvP - Quick Start Guide

## 🚀 Start the System

### 1. Start Backend (with WebSocket server)
```bash
cd apps/backend
pnpm dev
```

You should see:
```
🚀 Backend running on http://localhost:3001
🔌 WebSocket server ready for real-time PvP
```

### 2. Start Player 1
```bash
# In a new terminal
cd apps/cli-runner
pnpm dev
```

Select: **Online PvP**

You'll see:
```
🔌 Connecting via WebSocket...
✅ WebSocket connected
⚡ Using WebSocket for instant updates
```

### 3. Start Player 2
```bash
# In another terminal
cd apps/cli-runner
pnpm dev
```

Select: **Online PvP**

Both players should now be connected and playing!

## 🎮 What to Look For

### WebSocket Success
- **⚡ WebSocket** indicator on screen
- Moves appear instantly (no 2-second wait)
- Smooth, responsive gameplay

### Polling Fallback
- **📡 Polling** indicator on screen
- ~2 second delay between moves
- Still fully functional

## 🐛 Troubleshooting

### "WebSocket connection timeout"
This is normal! The client will automatically fall back to polling.
- Check if backend is running on port 3001
- Check for firewall blocking WebSocket connections

### "Failed to create/join match"
- Ensure backend is running: `http://localhost:3001/health`
- Check backend console for errors

### Moves not updating
- Check connection status (⚡ or 📡)
- If polling, wait 2 seconds between moves
- If WebSocket, check backend console for broadcast logs

## 📊 Backend Logs

You should see logs like:
```
🔌 New WebSocket connection
✅ Player abc12345 joined match def67890
   Total connections in match: 1
📡 Broadcasting state update to 2 client(s) in match def67890
🏁 Broadcasting match completion to 2 client(s) in match def67890
```

## 🧪 Test Scenarios

### Test 1: Normal WebSocket Flow
1. Start backend
2. Start two clients
3. Play a full game
4. ✅ Should see ⚡ WebSocket on both clients
5. ✅ Moves should be instant

### Test 2: Fallback to Polling
1. Start backend
2. Kill backend (Ctrl+C)
3. Restart backend
4. Start two clients
5. ✅ Should see 📡 Polling if WebSocket fails
6. ✅ Moves should still work (with 2s delay)

### Test 3: Mid-Game Reconnection
1. Start game with WebSocket
2. Kill backend mid-game
3. ❌ Clients will lose connection
4. 🔮 Future: Add reconnection logic

## 🎯 Key Points

- **WebSocket is optional** - Polling always works
- **No data loss** - All state stored in backend
- **Clean architecture** - Backend still dumb, client still smart
- **Real-time feel** - Instant updates when WebSocket works
- **Graceful degradation** - Falls back to polling automatically

## 📝 Environment Variables

```bash
# Backend REST API
BACKEND_URL=http://localhost:3001

# Backend WebSocket
BACKEND_WS_URL=ws://localhost:3001
```

Change these if running on different host/port.

## ✅ Success Criteria

You know it's working when:
- ✅ Two clients connect and see each other's moves instantly
- ✅ ⚡ WebSocket indicator shows on both screens
- ✅ No 2-second delay between moves
- ✅ Turn enforcement works (can't move on opponent's turn)
- ✅ Game completes and MatchResult saved
- ✅ Backend console shows WebSocket broadcast logs

Happy playing! 🎮
