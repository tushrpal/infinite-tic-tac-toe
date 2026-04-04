# Replay Viewer

A read-only, deterministic replay viewer for completed matches.

## Architecture

The replay system is **strictly read-only** and reconstructs game states by applying stored moves through the engine reducer.

### Components

```
replay/
├── ReplayController.ts  # Orchestrates replay flow
├── ReplayLoader.ts      # Loads MatchResult from storage
├── ReplayStepper.ts     # Reconstructs states via engine
├── ReplayPrinter.ts     # Board rendering
├── ReplayCLI.ts         # User input handling
└── index.ts             # Public API
```

## Design Principles

### 1. **Determinism**

- Replay output MUST match original gameplay
- Uses same engine reducer as live games
- No logic duplication or approximation

### 2. **Read-Only**

- Never mutates stored `MatchResult` data
- No side effects on storage
- Pure state reconstruction

### 3. **Engine-Driven**

- All moves applied through `Modes.*.applyMove()`
- No direct board manipulation
- Respects all game rules automatically

### 4. **Mode-Agnostic**

- Works for Mode 1 (Infinite 3×3)
- Works for Mode 2 (Expanding Board)
- Will work for any future mode

## Usage

### Replay Last Match

```bash
pnpm dev --replay last
```

### Replay Specific Match

```bash
pnpm dev --replay match_1768673421286_f7c42ac6
```

### No Matches Available

If no matches are stored, replay will display an error:

```
No matches found. Play some games first!
```

## Controls

| Key | Action                 |
| --- | ---------------------- |
| `n` | Next move              |
| `p` | Previous move          |
| `a` | Autoplay (500ms delay) |
| `f` | Fast-forward to end    |
| `r` | Restart from beginning |
| `q` | Quit replay            |

## Display Format

```
══════════════════════════════════════════════════════════
🎬 REPLAY — MATCH match_1768...
══════════════════════════════════════════════════════════
Mode: mode2
Difficulty: hard
Round: 2 / 3
Move: 5 / 17
Player: X
══════════════════════════════════════════════════════════

  0 1 2 3
0 X · · ·
1 · O · ·
2 · · X ·
3 · · · ·
```

## Technical Details

### State Reconstruction

The `ReplayStepper` reconstructs game states by:

1. Creating initial empty state for the mode/board size
2. Applying each move in sequence via engine reducer
3. Capturing a snapshot after each move
4. Building an array of `GameState` objects

This ensures:

- ✅ Perfect accuracy (uses same reducer)
- ✅ Supports any board size
- ✅ Respects sliding rules (Mode 1)
- ✅ Handles multi-round matches (Mode 2)

### Mode 1 (Infinite 3×3) Replay

```typescript
let state = Modes.Infinite3x3.createInitialState();
for (const move of moves) {
  const position = { row: floor(move.index / 3), col: move.index % 3 };
  state = Modes.Infinite3x3.applyMove(state, move.player, position);
  states.push(convertToGameState(state));
}
```

### Mode 2 (Expanding Board) Replay

```typescript
let state = Modes.ExpandingBoard.createInitialState({
  initialBoardSize: game.boardSize,
});
for (const move of moves) {
  const position = {
    row: floor(move.index / boardSize),
    col: move.index % boardSize,
  };
  state = Modes.ExpandingBoard.applyMove(state, move.player, position);
  states.push(convertToGameState(state));
}
```

## Multi-Round Support

For Mode 2 matches with multiple rounds:

1. Display match summary showing all rounds
2. Replay each round sequentially
3. Show round results before advancing
4. Allow restart from beginning or quit at any time

## Data Requirements

Replay requires complete `MatchResult` objects with:

- ✅ `games[]` - Array of game results
- ✅ `games[].moves[]` - Complete move history
- ✅ `games[].boardSize` - Board dimension
- ✅ `mode` - Game mode identifier

If data is incomplete or corrupted, replay may fail gracefully.

## Validation

Replay viewer ensures:

- 🔒 No storage mutations
- 🔒 No rule changes
- 🔒 No bot involvement
- 🔒 Deterministic output
- 🔒 Engine consistency

## Future Enhancements

Potential additions (not currently implemented):

- Export replay to file
- Replay speed control
- Jump to specific move number
- Side-by-side comparison of multiple matches
- Replay analysis (move quality, fork detection)

## Integration Points

### CLI Entry Point

[apps/cli-runner/src/index.ts](../index.ts) - Flag: `--replay`

### Storage

[apps/cli-runner/src/storage](../storage) - `MatchStore` interface

### Engine

[@infinite-ttt/game-engine](../../../../packages/game-engine) - Reducers for both modes

### Shared Types

[@infinite-ttt/shared](../../../../packages/shared) - `MatchResult`, `GameResult`, `Move`

## Debugging

If replay output differs from original gameplay:

1. ❌ **Bug in engine reducer** (most likely)
2. ❌ **Corrupted storage data**
3. ❌ **Replay logic error**

Never:

- ✅ "The replay is approximate"
- ✅ "Close enough for visualization"

Replay MUST be exact or it's a bug.
