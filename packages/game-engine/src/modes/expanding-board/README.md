# Mode 2: Expanding Board

Round-based Tic-Tac-Toe with progressive board expansion and strategic depth.

## Overview

Mode 2 is a round-based variant where:

- Games consist of multiple rounds
- Board size starts at 3×3 and expands after each round
- Win condition scales with board size (N-in-a-row on N×N board)
- No sliding mechanics - marks persist for the entire round
- Pure, deterministic engine

## Key Features

### Round-Based Gameplay

Each round is a complete game on a fixed-size board. When a player wins a round, the board expands for the next round.

### Progressive Board Expansion

- Round 1: 3×3 board
- Round 2: 4×4 board
- Round 3: 5×5 board
- And so on...

### Scaling Win Condition

The number of marks needed to win equals the board size:

- 3×3 board requires 3-in-a-row
- 4×4 board requires 4-in-a-row
- 5×5 board requires 5-in-a-row

### Starting Player Alternation

The starting player alternates each round to ensure fairness:

- Round 1: Player determined by game config
- Round 2: Opposite player
- Round 3: Back to first player
- And so on...

## Usage Example

```typescript
import { Modes } from "@infinite-ttt/game-engine";

const {
  createInitialState,
  applyMove,
  isRoundComplete,
  createNextRoundState,
  getRoundStartingPlayer,
} = Modes.ExpandingBoard;

// Start a new game
let state = createInitialState();
console.log(
  `Round ${state.roundNumber}: ${state.boardSize}×${state.boardSize} board`,
);

// Play Round 1 (3×3)
state = applyMove(state, "X", { row: 0, col: 0 });
state = applyMove(state, "O", { row: 1, col: 0 });
state = applyMove(state, "X", { row: 0, col: 1 });
state = applyMove(state, "O", { row: 1, col: 1 });
state = applyMove(state, "X", { row: 0, col: 2 }); // X wins!

if (isRoundComplete(state)) {
  console.log(`Round 1 winner: ${state.roundWinner}`);

  // Start next round with expanded board
  const nextPlayer = getRoundStartingPlayer(2, "X");
  state = createNextRoundState(state, nextPlayer);
  console.log(
    `Round ${state.roundNumber}: ${state.boardSize}×${state.boardSize} board`,
  );
}
```

## API Reference

### State Management

#### `createInitialState(config?)`

Creates initial game state for round 1.

**Parameters:**

- `config.initialBoardSize` - Starting board size (default: 3)
- `config.firstPlayer` - Player who starts round 1 (default: 'X')

**Returns:** `ExpandingBoardState`

#### `createNextRoundState(previousState, startingPlayer)`

Creates state for the next round with expanded board.

**Parameters:**

- `previousState` - State from previous round
- `startingPlayer` - Player who starts the new round

**Returns:** `ExpandingBoardState`

### Game Logic

#### `applyMove(state, player, position)`

Applies a move to the current state.

**Parameters:**

- `state` - Current game state
- `player` - Player making the move ('X' or 'O')
- `position` - `{ row, col }` position

**Returns:** New state (or unchanged if invalid)

#### `isValidMove(state, player, position)`

Checks if a move is legal.

**Returns:** `boolean`

#### `isRoundComplete(state)`

Checks if the current round has ended.

**Returns:** `boolean`

#### `getRoundStartingPlayer(roundNumber, firstPlayer)`

Determines who starts a given round (handles alternation).

**Parameters:**

- `roundNumber` - Round number (1-indexed)
- `firstPlayer` - Player who started round 1

**Returns:** `Player` ('X' or 'O')

### Win Detection

#### `detectWinner(board, boardSize)`

Checks if either player has won.

**Returns:** `{ winner, winningLine } | null`

#### `checkWin(board, boardSize, player)`

Checks if a specific player has won.

**Returns:** `Position[] | null` (winning line positions)

## State Structure

```typescript
interface ExpandingBoardState {
  board: Cell[][]; // Current board (2D array)
  boardSize: number; // Current board size (N)
  roundNumber: number; // Current round (1-indexed)
  currentTurn: number; // Turn within round (0-indexed)
  roundWinner: Player | null; // Winner of current round
  winningLine: Position[] | null; // Winning positions
  moveHistory: Move[]; // Moves in current round
  roundHistory: RoundResult[]; // Results of completed rounds
}
```

## Design Principles

### What the Engine Handles

- Round state management
- Move validation and application
- Win detection (N-in-a-row)
- Board expansion between rounds
- Round history tracking

### What the Engine Does NOT Handle

- Match scoring (external concern)
- Player identities for fairness (external concern)
- Target score or game end conditions (external concern)
- UI/rendering (pure engine)

### Determinism

The engine is **pure and deterministic**:

- Same inputs always produce same outputs
- No randomness or side effects
- Testable and predictable
- Replay-friendly

## Fairness

Starting player alternation prevents first-round advantage from compounding across a multi-round game. Match-level fairness (who plays as X/O) should be handled externally, similar to Mode 1.

## Testing

Run tests:

```bash
cd packages/game-engine
pnpm test expanding-board
```

All tests validate:

- State creation and board expansion
- Move validation and application
- Win detection for 3×3, 4×4, and 5×5 boards
- Starting player alternation
- Round history tracking

## Differences from Mode 1

| Feature         | Mode 1 (Infinite 3×3)  | Mode 2 (Expanding Board)       |
| --------------- | ---------------------- | ------------------------------ |
| Board size      | Fixed 3×3              | Starts 3×3, expands each round |
| Win condition   | 3-in-a-row             | N-in-a-row (scales with size)  |
| Sliding rule    | Yes (marks disappear)  | No (marks persist)             |
| Game structure  | Single continuous game | Multiple rounds                |
| Cognitive load  | High (track sliding)   | Lower (no sliding)             |
| Strategic depth | Short-term, tactical   | Long-term, planning            |

## Future Enhancements (Not in v1)

The following are explicitly **NOT** in v1:

- Sliding mechanics
- Bonus points for special wins
- Power-ups or special moves
- Draw handling
- Advanced bot strategies

These may be added in future versions.
