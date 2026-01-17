# Difficulty Levels Implementation

This document explains the implementation of Easy, Medium, and Hard difficulty levels for the bot system.

## Overview

Three distinct difficulty levels provide meaningful gameplay progression:

- **Easy**: Random, forgiving, unpredictable
- **Medium**: Balanced, fair, beatable (current baseline behavior)
- **Hard**: Strategic, punishing but fair

## Architecture

### Configuration-Based Approach

The difficulty system uses **configuration over branching logic** to tune bot behavior:

```typescript
interface HeuristicConfig {
  randomness: number; // Move selection variance (0-1)
  blockWeight: number; // Blocking priority multiplier
  extendWeight: number; // Line building multiplier
  centerWeight: number; // Positional bias multiplier
}
```

### Difficulty Mappings

#### Easy (Random Bot)

- Uses `RandomBot` implementation
- No heuristics
- Fully legal moves but intentionally weak
- Config: N/A (doesn't use HeuristicBot)

#### Medium (Default Heuristic)

- Uses `HeuristicBot` with default config
- **Preserves existing behavior** - baseline unchanged
- Config:
  ```typescript
  {
    randomness: 0.3,      // Consider top 3-4 equal moves
    blockWeight: 900,     // Strong blocking
    extendWeight: 10,     // Standard line extension
    centerWeight: 1.0,    // Normal center bias
  }
  ```

#### Hard (Tuned Heuristic)

- Uses `HeuristicBot` with tuned config
- More deterministic, stronger blocking, aggressive line building
- Config:
  ```typescript
  {
    randomness: 0.1,      // Prefer best move (top 1-2)
    blockWeight: 950,     // Even stronger blocking
    extendWeight: 12,     // More aggressive lines
    centerWeight: 0.7,    // Reduced center bias (especially on large boards)
  }
  ```

## Implementation Details

### Modified Files

#### Bot Package (`packages/bots/`)

1. **`src/core/types.ts`**
   - Added `Difficulty` enum
   - Added `HeuristicConfig` interface

2. **`src/heuristic/config.ts`** _(new file)_
   - Defines difficulty configurations
   - Exports `getConfig()` function

3. **`src/heuristic/heuristicBot.ts`**
   - Accepts optional `HeuristicConfig` parameter
   - Applies randomness based on config
   - Passes config to evaluators

4. **`src/heuristic/evaluatorNxN.ts`**
   - Accepts `HeuristicConfig` parameter
   - Applies weights from config to scoring

5. **`src/index.ts`**
   - Exports `Difficulty` enum
   - Exports `HeuristicConfig` type
   - Exports configuration utilities

#### CLI Package (`apps/cli-runner/`)

1. **`src/prompts.ts`**
   - Added `promptDifficulty()` function
   - Updated `printGameStart()` to show difficulty

2. **`src/input.ts`**
   - Added `readDifficulty()` function

3. **`src/humanVsBot.ts`**
   - Prompts for difficulty selection
   - Creates appropriate bot based on difficulty
   - Displays chosen difficulty before game

### Tests

**`packages/bots/src/heuristic/difficulty.test.ts`**

- Verifies configuration correctness
- Tests Easy (Random) behavior
- Tests Medium (Default) behavior
- Tests Hard (Tuned) behavior
- Compares difficulty levels
- Tests NxN board support

## Usage

### From CLI

```bash
pnpm cli

# Prompts will appear:
# Select difficulty:
#   1 - Easy (Random moves - forgiving, unpredictable)
#   2 - Medium (Balanced play - default, beatable)
#   3 - Hard (Strategic play - punishing but fair)
```

### Programmatic Usage

```typescript
import {
  createRandomBot,
  createHeuristicBot,
  Difficulty,
  getConfig,
} from "@infinite-ttt/bots";

// Easy - Random Bot
const easyBot = createRandomBot();

// Medium - Default Heuristic
const mediumConfig = getConfig(Difficulty.Medium);
const mediumBot = createHeuristicBot(mediumConfig);

// Hard - Tuned Heuristic
const hardConfig = getConfig(Difficulty.Hard);
const hardBot = createHeuristicBot(hardConfig);

// Custom configuration
const customBot = createHeuristicBot({
  randomness: 0.2,
  blockWeight: 920,
  extendWeight: 11,
  centerWeight: 0.8,
});
```

## Design Principles

### 1. **No Engine Modifications**

- Game rules remain unchanged
- Only bot behavior is tuned
- Engine agnostic implementation

### 2. **Preserve Medium Behavior**

- Medium difficulty matches previous bot behavior
- Existing baseline unchanged
- Backward compatible

### 3. **Configuration Over Branching**

- Single `HeuristicBot` class
- Behavior controlled by config
- No logic duplication
- Clean and extensible

### 4. **Board Size Agnostic**

- Works with 3×3, 4×4, 5×5, NxN boards
- No hardcoded board sizes
- Scales appropriately

### 5. **Testable and Deterministic**

- Each difficulty has clear expected behavior
- Tests verify win/block priorities
- Randomness controlled and measurable

## Difficulty Characteristics

### Easy vs Medium vs Hard

| Aspect             | Easy            | Medium       | Hard               |
| ------------------ | --------------- | ------------ | ------------------ |
| **Bot Type**       | Random          | Heuristic    | Heuristic          |
| **Always Wins**    | ✗ No            | ✓ Yes        | ✓ Yes              |
| **Always Blocks**  | ✗ Random (~17%) | ✓ Yes (100%) | ✓ Yes (100%)       |
| **Move Variance**  | High            | Medium       | Low                |
| **Line Building**  | None            | Standard     | Aggressive         |
| **Center Bias**    | None            | Normal       | Reduced            |
| **Predictability** | Unpredictable   | Fair         | More deterministic |

## Future Enhancements

Potential improvements without modifying the engine:

- **Expert Difficulty**: Add minimax with depth limit
- **Custom Difficulty**: Allow users to create custom configs
- **Adaptive Difficulty**: Adjust based on player performance
- **Strategy Profiles**: Define different playstyles (aggressive, defensive, balanced)

## Testing

Run all bot tests:

```bash
cd packages/bots
pnpm test
```

Specific difficulty tests:

```bash
pnpm test difficulty.test.ts
```

## Summary

The difficulty system provides:

- ✅ Three distinct, meaningful difficulty levels
- ✅ Clean, configuration-based architecture
- ✅ No engine modifications
- ✅ Preserved baseline behavior (Medium)
- ✅ Full test coverage
- ✅ Board size agnostic (NxN support)
- ✅ Extensible for future enhancements

Players now experience clear progression from Easy (random) to Medium (balanced) to Hard (strategic), making the game more replayable and ready for competitive features like leaderboards.
