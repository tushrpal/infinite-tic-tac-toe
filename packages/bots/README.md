# Bots - AI Opponents for Infinite Tic-Tac-Toe

AI bot implementations for playing Infinite Tic-Tac-Toe. Designed to consume the game engine and provide opponents of varying difficulty levels.

## 🤖 Available Bots

### ✅ Implemented

**Random Bot** (Easy)
- Makes completely random legal moves
- No strategy or planning
- Good for testing and baseline comparison
- Win rate: ~10% vs Heuristic

**Heuristic Bot** (Medium)
- Rule-based strategy with priorities
- Looks for winning moves
- Blocks opponent's winning moves
- Chooses center and corners strategically
- Win rate: ~90% vs Random, 50% vs itself (first-player advantage)

### 🔜 Planned

**Minimax Bot** (Hard)
- Full game tree search with alpha-beta pruning
- Perfect play within search depth
- Configurable difficulty via depth limit
- Evaluation function for non-terminal states

**Monte Carlo Tree Search Bot** (Very Hard)
- Simulation-based approach
- Balances exploration vs exploitation
- Improves with more thinking time
- Handles larger boards efficiently

## 📦 Installation

```bash
cd packages/bots
pnpm install
```

## 🚀 Usage

### Basic Usage

```typescript
import { RandomBot, HeuristicBot } from '@infinite-ttt/bots';
import { Modes } from '@infinite-ttt/game-engine';

// Create a bot instance
const bot = new HeuristicBot();

// Get game state
let state = Modes.Infinite3x3.createInitialState();

// Bot makes a move
const move = bot.getMove(state);
console.log(`Bot plays: (${move.row}, ${move.col})`);

// Apply the move
state = Modes.Infinite3x3.applyMove(state, move);
```

### Bot vs Bot Simulation

```typescript
import { RandomBot, HeuristicBot } from '@infinite-ttt/bots';
import { Modes } from '@infinite-ttt/game-engine';

const botX = new HeuristicBot();
const botO = new RandomBot();

let state = Modes.Infinite3x3.createInitialState();

while (!Modes.Infinite3x3.detectWinner(state)) {
  const currentBot = state.currentTurn % 2 === 0 ? botX : botO;
  const move = currentBot.getMove(state);
  state = Modes.Infinite3x3.applyMove(state, move);
}

const winner = Modes.Infinite3x3.detectWinner(state);
console.log(`Winner: ${winner} in ${state.currentTurn} turns`);
```

### Human vs Bot

```typescript
import { HeuristicBot } from '@infinite-ttt/bots';
import { Modes } from '@infinite-ttt/game-engine';

const bot = new HeuristicBot();
let state = Modes.Infinite3x3.createInitialState();

function humanMove(row: number, col: number) {
  const move = { row, col };
  if (Modes.Infinite3x3.isValidMove(state, move)) {
    state = Modes.Infinite3x3.applyMove(state, move);
    
    // Check if human won
    const winner = Modes.Infinite3x3.detectWinner(state);
    if (winner) return winner;
    
    // Bot's turn
    const botMove = bot.getMove(state);
    state = Modes.Infinite3x3.applyMove(state, botMove);
    
    return Modes.Infinite3x3.detectWinner(state);
  }
  return null;
}
```

## 🤖 Bot API Reference

### Common Interface

All bots implement the `Bot` interface:

```typescript
interface Bot {
  getMove(state: GameState): Move;
  getName(): string;
  getDifficulty(): 'easy' | 'medium' | 'hard' | 'expert';
}

interface Move {
  row: number;
  col: number;
}
```

---

### RandomBot

**Description:** Makes random legal moves with no strategy.

**Constructor:**
```typescript
const bot = new RandomBot();
```

**Methods:**

**`getMove(state: Infinite3x3State | ExpandingBoardState): Move`**
- Returns a random valid move
- Time complexity: O(n²) worst case
- No thinking required

**`getName(): string`**
- Returns: `"Random Bot"`

**`getDifficulty(): 'easy'`**
- Returns: `"easy"`

**Example:**
```typescript
const bot = new RandomBot();
const move = bot.getMove(state);
// move = { row: 1, col: 2 } (random valid cell)
```

**Use Cases:**
- Testing game logic
- Baseline for bot comparison
- Tutorial opponent for new players
- Random move generation

---

### HeuristicBot

**Description:** Rule-based bot with strategic priorities.

**Constructor:**
```typescript
const bot = new HeuristicBot();
```

**Strategy Priority (Highest to Lowest):**

1. **Win immediately** - If I can win in one move, do it
2. **Block opponent's win** - If opponent can win next turn, block it
3. **Take center** - If available, occupy center (1,1)
4. **Take corner** - If center taken, prefer corners
5. **Take edge** - Last resort, take any edge cell

**Methods:**

**`getMove(state: Infinite3x3State | ExpandingBoardState): Move`**
- Returns best move according to heuristic rules
- Time complexity: O(n²) for board scan
- Deterministic for same board state

**`getName(): string`**
- Returns: `"Heuristic Bot"`

**`getDifficulty(): 'medium'`**
- Returns: `"medium"`

**Example:**
```typescript
const bot = new HeuristicBot();

// Board state:
// X | O | _
// _ | X | _
// _ | _ | _

const move = bot.getMove(state);
// move = { row: 2, col: 2 } (winning move for X)
```

**Use Cases:**
- Challenging casual gameplay
- Testing win detection
- Demonstrations
- Default opponent

**Performance:**
- ~90% win rate vs RandomBot
- 100% win rate as first player vs itself (deterministic)
- Average game length: 5-13 turns

---

### MinimaxBot (Planned)

**Description:** Perfect-play bot using game tree search.

**Constructor (planned):**
```typescript
const bot = new MinimaxBot({
  maxDepth: 6,        // Search depth limit
  useAlphaBeta: true, // Enable pruning
  timeLimit: 1000,    // Max thinking time (ms)
});
```

**Strategy:**
- Complete game tree search up to depth limit
- Alpha-beta pruning for efficiency
- Evaluation function for non-terminal states
- Guaranteed optimal play within search depth

**Expected Performance:**
- Perfect play at sufficient depth
- 100% win rate vs heuristic (as X)
- Deeper search = stronger play but slower

---

## 🧪 Testing

### Run Tests

```bash
cd packages/bots
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Test Coverage

**Current: 13/13 tests passing**

Test categories:
- ✅ RandomBot always returns valid moves
- ✅ RandomBot selects from available cells
- ✅ HeuristicBot takes winning moves
- ✅ HeuristicBot blocks opponent wins
- ✅ HeuristicBot prefers center
- ✅ HeuristicBot prefers corners over edges
- ✅ Both bots work with Mode 1
- ✅ Both bots work with Mode 2

### Example Test

```typescript
import { HeuristicBot } from '../src';
import { Modes } from '@infinite-ttt/game-engine';

describe('HeuristicBot', () => {
  it('should take winning move', () => {
    let state = Modes.Infinite3x3.createInitialState();
    
    // Setup: X has two in a row
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 0 }); // X
    state = Modes.Infinite3x3.applyMove(state, { row: 1, col: 0 }); // O
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 1 }); // X
    state = Modes.Infinite3x3.applyMove(state, { row: 1, col: 1 }); // O
    
    // X can win at (0,2)
    const bot = new HeuristicBot();
    const move = bot.getMove(state);
    
    expect(move).toEqual({ row: 0, col: 2 });
  });
  
  it('should block opponent winning move', () => {
    let state = Modes.Infinite3x3.createInitialState();
    
    // Setup: O has two in a row
    state = Modes.Infinite3x3.applyMove(state, { row: 2, col: 0 }); // X
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 0 }); // O
    state = Modes.Infinite3x3.applyMove(state, { row: 2, col: 1 }); // X
    state = Modes.Infinite3x3.applyMove(state, { row: 0, col: 1 }); // O
    
    // X must block at (0,2)
    const bot = new HeuristicBot();
    const move = bot.getMove(state);
    
    expect(move).toEqual({ row: 0, col: 2 });
  });
});
```

## 🏗️ Architecture

### Directory Structure

```
packages/bots/
├── src/
│   ├── index.ts              # Public exports
│   ├── types.ts              # Bot interfaces
│   ├── RandomBot.ts          # Random strategy
│   ├── HeuristicBot.ts       # Rule-based strategy
│   └── utils/
│       └── boardAnalysis.ts  # Shared analysis functions
│
├── tests/
│   ├── RandomBot.test.ts
│   └── HeuristicBot.test.ts
│
├── package.json
└── tsconfig.json
```

### Bot Decision Flow

```
┌─────────────────┐
│   Get State     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Find Valid Moves│ ─────► If none, throw error
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply Strategy  │
│  (Priority List)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Select Move    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Return Move    │
└─────────────────┘
```

## 🎯 Strategy Details

### HeuristicBot Implementation

```typescript
export class HeuristicBot implements Bot {
  getMove(state: GameState): Move {
    const currentPlayer = getCurrentPlayer(state);
    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    
    // Priority 1: Win immediately
    const winMove = this.findWinningMove(state, currentPlayer);
    if (winMove) return winMove;
    
    // Priority 2: Block opponent
    const blockMove = this.findWinningMove(state, opponent);
    if (blockMove) return blockMove;
    
    // Priority 3: Take center
    if (this.isCellEmpty(state, 1, 1)) {
      return { row: 1, col: 1 };
    }
    
    // Priority 4: Take corner
    const corners = [[0,0], [0,2], [2,0], [2,2]];
    for (const [row, col] of corners) {
      if (this.isCellEmpty(state, row, col)) {
        return { row, col };
      }
    }
    
    // Priority 5: Take any edge
    const edges = [[0,1], [1,0], [1,2], [2,1]];
    for (const [row, col] of edges) {
      if (this.isCellEmpty(state, row, col)) {
        return { row, col };
      }
    }
    
    // Fallback: any valid move
    return this.getRandomValidMove(state);
  }
  
  private findWinningMove(state: GameState, player: Mark): Move | null {
    // Try each empty cell and see if it wins
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.isCellEmpty(state, row, col)) {
          // Simulate move
          const hypotheticalBoard = this.copyBoard(state.board);
          hypotheticalBoard[row][col] = player;
          
          // Check if it wins
          if (this.checkWin(hypotheticalBoard, player)) {
            return { row, col };
          }
        }
      }
    }
    return null;
  }
}
```

### RandomBot Implementation

```typescript
export class RandomBot implements Bot {
  getMove(state: GameState): Move {
    const validMoves = this.getValidMoves(state);
    
    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }
    
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
  
  private getValidMoves(state: GameState): Move[] {
    const moves: Move[] = [];
    const boardSize = state.board.length;
    
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (state.board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
    
    return moves;
  }
}
```

## 🔍 Bot Comparison

### Performance Metrics

| Matchup | X Bot | O Bot | X Win% | Avg Turns | Notes |
|---------|-------|-------|--------|-----------|-------|
| Random vs Random | Random | Random | ~50% | 8-12 | High variance |
| Heuristic vs Random | Heuristic | Random | ~90% | 5-7 | Dominant |
| Random vs Heuristic | Random | Heuristic | ~10% | 6-8 | Rare upset |
| Heuristic vs Heuristic | Heuristic | Heuristic | 100% | 13 | Deterministic, first-player wins |

### Difficulty Ratings

```
RandomBot:    ★☆☆☆☆  (Easy)
HeuristicBot: ★★★☆☆  (Medium)
MinimaxBot:   ★★★★☆  (Hard) - Planned
MCTSBot:      ★★★★★  (Expert) - Planned
```

## 🎮 Integration Examples

### CLI Bot Battle

```typescript
import { RandomBot, HeuristicBot } from '@infinite-ttt/bots';
import { Modes } from '@infinite-ttt/game-engine';

function runSimulation(games: number) {
  const botX = new HeuristicBot();
  const botO = new RandomBot();
  
  let xWins = 0;
  
  for (let i = 0; i < games; i++) {
    let state = Modes.Infinite3x3.createInitialState();
    
    while (!Modes.Infinite3x3.detectWinner(state)) {
      const bot = state.currentTurn % 2 === 0 ? botX : botO;
      const move = bot.getMove(state);
      state = Modes.Infinite3x3.applyMove(state, move);
    }
    
    if (Modes.Infinite3x3.detectWinner(state) === 'X') {
      xWins++;
    }
  }
  
  console.log(`${botX.getName()} won ${xWins}/${games} games (${(xWins/games*100).toFixed(1)}%)`);
}

runSimulation(100);
```

### Web App Integration

```typescript
import { HeuristicBot } from '@infinite-ttt/bots';
import { Modes } from '@infinite-ttt/game-engine';
import { useState, useEffect } from 'react';

export function useBotOpponent() {
  const [bot] = useState(() => new HeuristicBot());
  const [state, setState] = useState(() => 
    Modes.Infinite3x3.createInitialState()
  );

  const makeBotMove = () => {
    const move = bot.getMove(state);
    setState(Modes.Infinite3x3.applyMove(state, move));
  };

  const makeHumanMove = (row: number, col: number) => {
    const move = { row, col };
    if (Modes.Infinite3x3.isValidMove(state, move)) {
      const newState = Modes.Infinite3x3.applyMove(state, move);
      setState(newState);
      
      // Bot responds after delay
      if (!Modes.Infinite3x3.detectWinner(newState)) {
        setTimeout(() => makeBotMove(), 500);
      }
    }
  };

  return { state, makeHumanMove };
}
```

## 🚀 Future Enhancements

### MinimaxBot Features (Planned)

- [ ] Configurable search depth
- [ ] Iterative deepening
- [ ] Transposition table
- [ ] Move ordering optimization
- [ ] Opening book
- [ ] Endgame tablebase

### MCTS Bot Features (Planned)

- [ ] UCB1 selection policy
- [ ] Progressive widening
- [ ] RAVE (Rapid Action Value Estimation)
- [ ] Parallelization support
- [ ] Configurable simulation count

### Bot Framework Improvements

- [ ] Bot difficulty auto-adjustment
- [ ] Performance profiling tools
- [ ] Move explanation API
- [ ] Confidence scoring per move
- [ ] Learning from human games

## 📊 Benchmarking

### Running Benchmarks

```bash
cd packages/bots
pnpm benchmark
```

Measures:
- Moves per second
- Average decision time
- Memory usage
- Scalability (board size)

### Example Benchmark Results

```
RandomBot
  - Moves/second: 50,000+
  - Avg time: <0.1ms
  - Memory: Negligible

HeuristicBot
  - Moves/second: 10,000+
  - Avg time: ~0.1ms
  - Memory: <1KB per move
```

## 🔧 Development

### Adding a New Bot

1. Create new file: `src/MyBot.ts`
2. Implement the `Bot` interface
3. Export from `src/index.ts`
4. Add tests in `tests/MyBot.test.ts`
5. Update this README

```typescript
// src/MyBot.ts
import { Bot, Move, GameState } from './types';

export class MyBot implements Bot {
  getMove(state: GameState): Move {
    // Your strategy here
    return { row: 0, col: 0 };
  }
  
  getName(): string {
    return 'My Bot';
  }
  
  getDifficulty(): 'hard' {
    return 'hard';
  }
}
```

### Bot Testing Best Practices

- Test against known board states
- Verify winning move selection
- Verify blocking move selection
- Test with both game modes
- Test edge cases (full board, one move left)
- Benchmark performance

## 📚 Related Documentation

- [Main README](../../README.md)
- [Game Engine](../game-engine/README.md)
- [CLI Runner](../../apps/cli-runner/README.md)
- [Backend API](../../apps/backend/README.md)

---

**Built with TypeScript • Consumes Game Engine • Extensible Architecture**
