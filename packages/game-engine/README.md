# Game Engine - Infinite Tic-Tac-Toe

A pure, deterministic, framework-agnostic TypeScript game engine for Infinite Tic-Tac-Toe with two distinct game modes.

## 🎯 Design Philosophy

### Core Principles

1. **Pure Functions** - No side effects, same input always produces same output
2. **Immutable State** - All state transitions return new state objects
3. **Framework-Agnostic** - Zero dependencies on UI frameworks, network, or databases
4. **Deterministic** - No randomness in the engine itself
5. **Type-Safe** - Strict TypeScript with complete type coverage

### Consumer Pattern

- ✅ UIs **consume** the engine
- ✅ Bots **consume** the engine
- ✅ Server **validates** using the engine
- ❌ Nobody **modifies** the engine for convenience

## 🎮 Game Modes

### Mode 1: Infinite 3×3 (Sliding Moves)

A fixed 3×3 board where players can have a maximum of 3 marks at once.

**Rules:**
- 3×3 fixed board
- Each player may have **maximum 3 marks** on the board simultaneously
- On a player's **4th move**, their **oldest mark is automatically removed**
- First to form **3-in-a-row** wins immediately
- **No draws possible** - game continues indefinitely until someone wins

**Why It Works:**
- Eliminates stalemate positions
- Forces dynamic, strategic play
- Position memory becomes crucial
- Creates continuous pressure

**State Structure:**
```typescript
interface Infinite3x3State {
  board: Board;           // 3×3 grid of cells
  currentTurn: number;    // Move counter (0-indexed)
  moveHistory: Move[];    // Complete move history
  playerMarks: {          // Track mark age for sliding
    X: Move[];
    O: Move[];
  };
}
```

### Mode 2: Expanding Board (Round-Based)

A round-based game where the board expands after each stalemate.

**Rules:**
- Starts with 3×3 board
- Round-based gameplay
- Win condition: **N-in-a-row** where N = current board size
- If no winner: board expands by 1 (3×3 → 4×4 → 5×5...)
- Starting player alternates each round
- All marks persist through rounds
- Eventually guarantees a winner

**Why It Works:**
- Progressive complexity increase
- Rewards tactical AND strategic thinking
- Natural escalation maintains engagement
- Eliminates possibility of infinite games

**State Structure:**
```typescript
interface ExpandingBoardState {
  board: Board;           // N×N grid (starts at 3×3)
  boardSize: number;      // Current dimension
  currentTurn: number;    // Turn counter
  currentRound: number;   // Round counter (0-indexed)
  roundHistory: RoundResult[];  // Results of completed rounds
  startingPlayer: Mark;   // Who started current round
}
```

## 📦 Installation

```bash
cd packages/game-engine
pnpm install
```

## 🚀 Usage

### Mode 1: Infinite 3×3

```typescript
import { Modes } from '@infinite-ttt/game-engine';

// Create initial state
let state = Modes.Infinite3x3.createInitialState();

// Make a move
const move = { row: 1, col: 1 };
if (Modes.Infinite3x3.isValidMove(state, move)) {
  state = Modes.Infinite3x3.applyMove(state, move);
}

// Check for winner
const winner = Modes.Infinite3x3.detectWinner(state);
if (winner) {
  console.log(`${winner} wins!`);
}

// Get current player
const currentPlayer = Modes.Infinite3x3.getCurrentPlayer(state);
```

### Mode 2: Expanding Board

```typescript
import { Modes } from '@infinite-ttt/game-engine';

// Create initial state
let state = Modes.ExpandingBoard.createInitialState();

// Make a move
const move = { row: 0, col: 2 };
if (Modes.ExpandingBoard.isValidMove(state, move)) {
  state = Modes.ExpandingBoard.applyMove(state, move);
}

// Check if round is complete
if (Modes.ExpandingBoard.isRoundComplete(state)) {
  const winner = Modes.ExpandingBoard.detectWinner(state);
  
  if (winner) {
    console.log(`${winner} wins the game!`);
  } else {
    // Expand board for next round
    state = Modes.ExpandingBoard.createNextRoundState(state);
    console.log(`Board expanded to ${state.boardSize}×${state.boardSize}`);
  }
}
```

### Helper Functions

```typescript
import { getNextPlayer, isValidPosition } from '@infinite-ttt/game-engine';

// Get next player based on turn
const player = getNextPlayer(0); // 'X' (even turns)
const player = getNextPlayer(1); // 'O' (odd turns)

// Validate position
const valid = isValidPosition(0, 0, 3); // true (within 3×3)
const invalid = isValidPosition(3, 3, 3); // false (out of bounds)
```

## 📚 API Reference

### Mode 1: Infinite 3×3

#### State Management

**`createInitialState(): Infinite3x3State`**
- Creates a fresh game state
- Returns empty 3×3 board with turn 0

**`createEmptyBoard(): Board`**
- Creates an empty 3×3 board
- All cells initialized to `null`

**`isValidPosition(row: number, col: number): boolean`**
- Checks if position is within board bounds (0-2)

**`isCellEmpty(state: Infinite3x3State, row: number, col: number): boolean`**
- Checks if specified cell is unoccupied

#### Game Logic

**`isValidMove(state: Infinite3x3State, move: Move): boolean`**
- Validates a move
- Checks: position in bounds, cell empty
- Returns `true` if move is legal

**`applyMove(state: Infinite3x3State, move: Move): Infinite3x3State`**
- Applies move and returns new state
- Automatically removes oldest mark if player has 3 marks
- Updates move history
- Increments turn counter
- **Does NOT validate** - call `isValidMove` first

**`getCurrentPlayer(state: Infinite3x3State): Mark`**
- Returns current player ('X' or 'O')
- Based on turn number: even = X, odd = O

#### Win Detection

**`checkWin(board: Board, player: Mark): WinInfo | null`**
- Checks if player has won
- Returns `WinInfo` with winning line or `null`
- Checks all rows, columns, and diagonals

**`detectWinner(state: Infinite3x3State): Mark | null`**
- Convenience function
- Checks both players for win
- Returns winner or `null`

**`getWinInfo(state: Infinite3x3State): WinInfo | null`**
- Gets detailed win information
- Includes winning line coordinates
- Returns `null` if no winner

---

### Mode 2: Expanding Board

#### State Management

**`createInitialState(config?: GameConfig): ExpandingBoardState`**
- Creates initial 3×3 board
- Optional config: `{ initialBoardSize: number }`

**`createEmptyBoard(size: number): Board`**
- Creates empty N×N board

**`createNextRoundState(state: ExpandingBoardState): ExpandingBoardState`**
- Expands board by 1
- Preserves all existing marks
- Alternates starting player
- Increments round counter

**`isValidPosition(row: number, col: number, boardSize: number): boolean`**
- Checks if position is within current board size

**`isCellEmpty(state: ExpandingBoardState, row: number, col: number): boolean`**
- Checks if cell is unoccupied

#### Game Logic

**`isValidMove(state: ExpandingBoardState, move: Move): boolean`**
- Validates move for current board size
- Checks: position in bounds, cell empty

**`applyMove(state: ExpandingBoardState, move: Move): ExpandingBoardState`**
- Applies move and returns new state
- Updates board
- Updates move history
- Increments turn counter
- **Does NOT validate** - call `isValidMove` first

**`isRoundComplete(state: ExpandingBoardState): boolean`**
- Checks if round has ended
- True if: winner detected OR all cells filled

**`getRoundStartingPlayer(roundNumber: number): Mark`**
- Determines who starts a given round
- Even rounds: X, Odd rounds: O

#### Win Detection

**`checkWin(board: Board, player: Mark, boardSize: number): WinInfo | null`**
- Checks for N-in-a-row (N = boardSize)
- Checks rows, columns, diagonals
- Returns `WinInfo` or `null`

**`detectWinner(state: ExpandingBoardState): Mark | null`**
- Checks both players for win
- Uses current board size as win length

---

### Shared Types

```typescript
// Core types
type Mark = 'X' | 'O';
type Cell = Mark | null;
type Board = Cell[][];

// Move
interface Move {
  row: number;
  col: number;
}

// Win information
interface WinInfo {
  player: Mark;
  line: Position[];
  type: 'row' | 'col' | 'diag-main' | 'diag-anti';
}

interface Position {
  row: number;
  col: number;
}
```

## 🧪 Testing

### Run Tests

```bash
cd packages/game-engine
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Test Coverage

**Current: 15/15 tests passing**

Test categories:
- ✅ State initialization
- ✅ Move validation
- ✅ Move application
- ✅ Win detection (rows, columns, diagonals)
- ✅ Sliding mechanism (Mode 1)
- ✅ Board expansion (Mode 2)
- ✅ Round completion
- ✅ Edge cases

### Example Test

```typescript
import { Modes } from '../src';

describe('Infinite3x3', () => {
  it('should remove oldest mark when 4th mark is placed', () => {
    let state = Modes.Infinite3x3.createInitialState();
    
    // X plays 3 moves
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 0 });
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 1 }); // O
    state = Modes.Infinite3x3.applyMove(state, { row: 1, col: 0 });
    state = Modes.Infinite3x3.applyMove(state, { row: 1, col: 1 }); // O
    state = Modes.Infinite3x3.applyMove(state, { row: 2, col: 0 });
    state = Modes.Infinite3x3.applyMove(state, { row: 2, col: 1 }); // O
    
    // X's 4th move should remove the first mark at (0,0)
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 2 });
    
    expect(state.board[0][0]).toBeNull(); // First mark removed
    expect(state.board[0][2]).toBe('X');   // New mark placed
    expect(state.playerMarks.X).toHaveLength(3); // Still max 3 marks
  });
});
```

## 🏗️ Architecture

### Directory Structure

```
packages/game-engine/
├── src/
│   ├── index.ts                      # Public API
│   ├── core/
│   │   ├── types.ts                  # Shared types
│   │   └── errors.ts                 # Error classes
│   ├── modes/
│   │   ├── index.ts                  # Mode exports
│   │   ├── infinite-3x3/
│   │   │   ├── index.ts              # Mode 1 API
│   │   │   ├── state.ts              # State management
│   │   │   ├── reducer.ts            # Game logic
│   │   │   └── winDetection.ts       # Win checking
│   │   └── expanding-board/
│   │       ├── index.ts              # Mode 2 API
│   │       ├── types.ts              # Mode-specific types
│   │       ├── state.ts              # State management
│   │       ├── reducer.ts            # Game logic
│   │       └── winDetection.ts       # Win checking
│   └── utils/
│       └── common.ts                 # Shared utilities
│
├── tests/
│   ├── infinite-3x3.test.ts
│   └── expanding-board.test.ts
│
├── package.json
└── tsconfig.json
```

### State Flow

```
┌─────────────────┐
│ Initial State   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Move  │──► Invalid → Return Error
└────────┬────────┘
         │ Valid
         ▼
┌─────────────────┐
│   Apply Move    │──► New State
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Winner   │──► Winner Found → Game Over
└────────┬────────┘     No Winner → Continue
         │
         ▼
┌─────────────────┐
│  Next Turn/Round│
└─────────────────┘
```

## 🔍 Implementation Details

### Mode 1: Sliding Mechanism

The sliding mechanism is implemented by tracking mark age:

```typescript
// When applying a move
if (playerMarks.length >= MAX_MARKS) {
  const oldestMark = playerMarks[0];
  board[oldestMark.row][oldestMark.col] = null; // Remove
  playerMarks.shift(); // Remove from history
}

// Add new mark
board[row][col] = currentPlayer;
playerMarks.push({ row, col });
```

### Mode 2: Board Expansion

Board expansion preserves all existing marks:

```typescript
const expandBoard = (oldBoard: Board, oldSize: number): Board => {
  const newSize = oldSize + 1;
  const newBoard = createEmptyBoard(newSize);
  
  // Copy existing marks
  for (let row = 0; row < oldSize; row++) {
    for (let col = 0; col < oldSize; col++) {
      newBoard[row][col] = oldBoard[row][col];
    }
  }
  
  return newBoard;
};
```

### Win Detection Algorithm

Efficient O(n) win checking:

```typescript
const checkWin = (board: Board, player: Mark, size: number): WinInfo | null => {
  // Check rows
  for (let row = 0; row < size; row++) {
    if (board[row].every(cell => cell === player)) {
      return { player, line: [...], type: 'row' };
    }
  }
  
  // Check columns
  for (let col = 0; col < size; col++) {
    if (board.every(row => row[col] === player)) {
      return { player, line: [...], type: 'col' };
    }
  }
  
  // Check diagonals (main and anti)
  // ...
  
  return null;
};
```

## 🚫 What This Engine Does NOT Do

- ❌ **No UI rendering** - That's for consumers
- ❌ **No network code** - Handle in your app layer
- ❌ **No persistence** - Save/load is your responsibility
- ❌ **No AI/bots** - See `@infinite-ttt/bots` package
- ❌ **No randomness** - Deterministic only
- ❌ **No timers** - Time management is external
- ❌ **No validation on applyMove** - Call `isValidMove` first

## 🔄 Migration Between Modes

Modes are intentionally separate - no cross-mode state transitions.

To switch modes mid-session:
1. Save final state of current mode
2. Create new initial state for target mode
3. Optionally carry over metadata (players, scores)

## 📈 Performance Characteristics

### Time Complexity

| Operation | Mode 1 | Mode 2 |
|-----------|--------|--------|
| Create Initial State | O(1) | O(n²) |
| Validate Move | O(1) | O(1) |
| Apply Move | O(1) | O(1) |
| Check Win | O(1) | O(n) |
| Expand Board | N/A | O(n²) |

Where n = board size

### Space Complexity

| State Component | Mode 1 | Mode 2 |
|----------------|--------|--------|
| Board | O(1) - Fixed 3×3 | O(n²) |
| Move History | O(m) | O(m) |
| Total | O(m) | O(n² + m) |

Where m = number of moves

## 🎯 Design Decisions

### Why Pure Functions?

- Predictable behavior
- Easy to test
- Enables time travel / replay
- No hidden state mutations

### Why Immutable State?

- React-friendly (reference equality)
- Undo/redo support
- Thread-safe (for future optimizations)
- No defensive copying needed

### Why No Validation in applyMove?

- Performance: validate once, apply many times (e.g., replay)
- Flexibility: consumers control validation timing
- Simplicity: single responsibility per function

## 📦 Build & Distribution

### Build

```bash
pnpm build
```

Output: `dist/` directory with compiled JavaScript and type definitions

### Publishing

```bash
pnpm publish --access public
```

Or use as workspace dependency:
```json
{
  "dependencies": {
    "@infinite-ttt/game-engine": "workspace:*"
  }
}
```

## 🤝 Integration Examples

### React Hook

```typescript
import { useState } from 'react';
import { Modes } from '@infinite-ttt/game-engine';

export const useInfinite3x3 = () => {
  const [state, setState] = useState(() => 
    Modes.Infinite3x3.createInitialState()
  );

  const makeMove = (row: number, col: number) => {
    const move = { row, col };
    if (Modes.Infinite3x3.isValidMove(state, move)) {
      setState(Modes.Infinite3x3.applyMove(state, move));
      return true;
    }
    return false;
  };

  const reset = () => {
    setState(Modes.Infinite3x3.createInitialState());
  };

  return { state, makeMove, reset };
};
```

### Backend Validation

```typescript
import { Modes } from '@infinite-ttt/game-engine';

app.post('/match/:id/move', (req, res) => {
  const { state, move } = req.body;
  
  // Validate on server
  if (!Modes.Infinite3x3.isValidMove(state, move)) {
    return res.status(400).json({ error: 'Invalid move' });
  }
  
  const newState = Modes.Infinite3x3.applyMove(state, move);
  // Save newState to database
  res.json({ state: newState });
});
```

## 📚 Related Documentation

- [Main README](../../README.md)
- [Bots Package](../bots/README.md)
- [Backend API](../../apps/backend/README.md)
- [Web App](../../apps/web/README.md)

---

**Built with Pure TypeScript • Zero Dependencies • 100% Test Coverage Goal**
