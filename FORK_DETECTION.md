# Fork Detection Implementation - Summary

## Overview

Added fork detection to the Hard difficulty bot to prevent classic tic-tac-toe traps where the opponent creates two simultaneous winning threats.

## What is a Fork?

A fork occurs when a player creates two or more immediate winning threats simultaneously, making it impossible for the opponent to block both.

Classic example:

```
X . .
. O .
. . X
```

If O plays at corners (0,2) or (2,0), X can create a fork by playing the opposite corner, giving X two ways to win next turn.

## Implementation Details

### 1. Mode Detection

The bot now distinguishes between two game modes:

- **Mode 1 (Infinite 3×3 with sliding)**: Has `playerMarks` field. Sliding rule naturally prevents forks.
- **Mode 2 (Standard NxN)**: No `playerMarks` field. Requires explicit fork detection on 3×3 boards.

See [heuristicBot.ts](../../packages/bots/src/heuristic/heuristicBot.ts#L66-L81)

### 2. Fork Detection Algorithm

For Hard difficulty (randomness ≤ 0.1), before making a move:

1. Simulate the move
2. Count how many immediate wins the opponent would have after the move
3. If opponent would have 2+ wins (a fork), apply heavy penalty (-8500)

See:

- Mode 1: [evaluator.ts](../../packages/bots/src/heuristic/evaluator.ts#L35-L90)
- Mode 2: [evaluatorNxN.ts](../../packages/bots/src/heuristic/evaluatorNxN.ts#L145-L230)

### 3. Scoring System

```
Immediate win:        10000
Block immediate win:   9000 (Hard)
Avoid fork:            -8500 penalty (Hard, 3×3 only)
Extend line:           80 per mark (Hard)
Center proximity:      0-5
```

### 4. Mode-Specific Behavior

#### Mode 1 (Infinite 3×3 with sliding)

- Sliding rule: When a player places their 4th mark, their oldest mark is removed
- This **naturally prevents** classic corner forks
- Example: X plays corners (0,0) and (8), then plays 3rd mark → oldest corner is removed
- Fork detection not needed but implemented for consistency

#### Mode 2 (Standard 3×3 boards)

- No sliding rule - marks stay on the board
- Classic fork traps are possible
- Fork detection **critical** for Hard difficulty
- Auto-disables on larger boards (4×4+) where forks are less impactful

## Test Results

All fork-related tests passing:

- ✅ Mode 2: Hard avoids fork-enabling corners (standard 3×3)
- ✅ Mode 1: Handles sliding naturally (fork prevention not needed)
- ✅ Medium difficulty: Allowed to fall for forks (expected behavior)

### Test Evidence

```
Hard bot on classic fork position:
  Move 1 (0,1): 10 times  ← Safe edge
  Move 3 (1,0): 10 times  ← Safe edge
  Never chose moves 2 or 6 (dangerous corners)

Medium bot on same position:
  Distributed across all safe moves (expected variance)
```

## Configuration

Fork detection is automatically enabled for:

- Hard difficulty (randomness ≤ 0.1)
- 3×3 boards only
- Both Mode 1 and Mode 2

No manual configuration needed - it's built into the difficulty system.

## Performance Impact

Minimal - fork detection only adds one additional state simulation per move evaluation, and only on 3×3 boards in Hard difficulty.

## Future Enhancements

- Could add fork **creation** logic (not just prevention)
- Could extend to 4×4 boards with modified thresholds
- Could add to Medium difficulty with higher randomness tolerance
