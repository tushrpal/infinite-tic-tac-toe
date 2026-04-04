# Replay Viewer - Quick Start Guide

## Installation

No installation needed! The replay viewer is built into the CLI runner.

## Basic Usage

### 1. Play a Game First

Before you can replay, you need some matches in storage:

```bash
cd apps/cli-runner

# Play a quick Mode 1 game
pnpm dev --quiet

# Or play Mode 2
pnpm dev --mode 2 --quiet
```

### 2. Replay Your Last Game

```bash
pnpm dev --replay last
```

### 3. Navigate Through the Replay

Once in replay mode, use these keys:

- Press `n` to see the next move
- Press `p` to go back to the previous move
- Press `a` to watch the game play automatically
- Press `f` to fast-forward to the end
- Press `r` to restart from the beginning
- Press `q` to quit and return to terminal

## Example Session

```bash
# Step 1: Play a game
$ pnpm dev --quiet

==================================================
  INFINITE TIC-TAC-TOE - BOT VS BOT
==================================================
  Player X: Heuristic Bot
  Player O: Random Bot
==================================================

==================================================
  GAME OVER
==================================================
  Winner: X
  Total turns: 5
==================================================

# Step 2: Replay it
$ pnpm dev --replay last

═══════════════════════════════════════════════
📊 MATCH SUMMARY
═══════════════════════════════════════════════
Match ID: match_1768673421286_f7c42ac6
Mode: mode1
Difficulty: medium
Rounds played: 1
Total moves: 5
Winner: bot (botX)
═══════════════════════════════════════════════

Game Results:
  Round 1: X wins (5 moves, 3×3)

Press Enter to start replay...

# (Press Enter)

═══════════════════════════════════════════════
🎬 REPLAY — MATCH match_176867...
═══════════════════════════════════════════════
Mode: mode1
Difficulty: medium
Move: 0 / 5
Player: (start)
═══════════════════════════════════════════════

  0 1 2
0 · · ·
1 · · ·
2 · · ·

Controls:
  n → next move
  p → previous move
  a → autoplay (500ms)
  f → fast-forward to end
  r → restart
  q → quit replay

> n

# (After pressing 'n')

═══════════════════════════════════════════════
🎬 REPLAY — MATCH match_176867...
═══════════════════════════════════════════════
Mode: mode1
Difficulty: medium
Move: 1 / 5
Player: X
═══════════════════════════════════════════════

  0 1 2
0 · · ·
1 · X ·
2 · · ·

Controls:
  n → next move
  p → previous move
  a → autoplay (500ms)
  f → fast-forward to end
  r → restart
  q → quit replay

> n

# Continue pressing 'n' to see each move...
# Or press 'a' to watch it play automatically
# Press 'q' when you're done

> q

# (Returns to terminal)
$
```

## Advanced Usage

### Replay a Specific Match

First, find the match ID by viewing the leaderboard:

```bash
pnpm dev --leaderboard
```

Then replay that specific match:

```bash
pnpm dev --replay match_1768673392954_efc079e5
```

### Replay Mode 2 Multi-Round Games

Mode 2 games have multiple rounds. The replay viewer automatically handles this:

```bash
# Play a Mode 2 game
pnpm dev --mode 2 --quiet

# Replay it
pnpm dev --replay last
```

You'll see round indicators like:

```
Round: 2 / 3
```

The replay will automatically transition between rounds.

## Tips & Tricks

### Quick Review

Use fast-forward (`f`) to jump to the end and see the final result immediately.

### Study Bot Moves

Use step-by-step (`n`/`p`) to carefully analyze each move and understand bot strategy.

### Compare Games

Replay multiple games to see how different starting positions lead to different outcomes:

```bash
# List all matches
pnpm dev --leaderboard

# Replay different ones
pnpm dev --replay match_ABC...
pnpm dev --replay match_XYZ...
```

### Verify Fairness

In competitive scenarios, replay can prove the game was fair and deterministic.

## Troubleshooting

### "No matches found"

You need to play at least one game first:

```bash
pnpm dev --quiet
```

### "Match not found: XYZ"

The match ID doesn't exist. Use `--replay last` or check the leaderboard for valid IDs.

### Board Looks Wrong

This shouldn't happen! If replay output differs from original gameplay, it's a bug. The replay uses the same engine as the game itself.

## What Replay Does NOT Do

- ❌ Change or edit matches
- ❌ Create new games
- ❌ Modify stored data
- ❌ Affect leaderboards
- ❌ Involve bots (it just shows recorded moves)

Replay is **read-only** and **safe** to use.

## Technical Details

Under the hood, replay:

1. Loads the `MatchResult` from `data/matches.json`
2. Starts with an empty board
3. Applies each move using the game engine reducer
4. Captures a snapshot after each move
5. Lets you navigate through these snapshots

This ensures replay is **100% accurate** because it uses the same code that ran the original game.

## Next Steps

- Try replaying different matches
- Compare bot strategies across games
- Use replay to learn game patterns
- Verify that your human games were fair

Enjoy exploring your games! 🎬
