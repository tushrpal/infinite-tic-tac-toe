# CLI Bot-vs-Bot Runner

Developer tool for simulating Bot-vs-Bot games in Infinite Tic-Tac-Toe.

## Purpose

This CLI runner is designed to:

- Stress-test the game engine
- Validate bot implementations
- Debug game logic
- Collect match statistics
- Test game balance

## Usage

### Run a single game (default: Heuristic vs Random)

```bash
pnpm dev
```

### Run with specific bot types

```bash
# Random vs Random
pnpm dev --x-bot random --o-bot random

# Heuristic vs Heuristic
pnpm dev --x-bot heuristic --o-bot heuristic
```

### Run multiple games

```bash
# Run 100 games and show statistics
pnpm dev --games 100 --quiet

# Run 10 games with full output
pnpm dev --games 10
```

### Add delay for readability

```bash
# 500ms delay between moves
pnpm dev --delay 500
```

## Command-Line Options

| Option           | Description                              | Default     |
| ---------------- | ---------------------------------------- | ----------- |
| `--x-bot <type>` | Bot type for X (`random` or `heuristic`) | `heuristic` |
| `--o-bot <type>` | Bot type for O (`random` or `heuristic`) | `random`    |
| `--delay <ms>`   | Delay between moves in milliseconds      | `0`         |
| `--games <n>`    | Number of games to run                   | `1`         |
| `--quiet`        | Disable verbose output (summary only)    | `false`     |
| `--help`         | Show help message                        | -           |

## Architecture

This CLI runner follows strict architectural rules:

- **No game logic** - All rules come from `@infinite-ttt/game-engine`
- **No direct state mutation** - All moves applied through engine reducer
- **Deterministic** - Same bots produce same results
- **Robust** - Handles invalid bot moves gracefully

### File Structure

```
apps/cli-runner/
├── src/
│   ├── index.ts       # Main game loop and CLI
│   ├── printer.ts     # Board rendering (no logic)
│   └── stats.ts       # Match statistics tracker
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Install dependencies

```bash
pnpm install
```

### Run in development mode

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
pnpm start
```

## Examples

### Quick stress test

```bash
pnpm dev --games 1000 --quiet
```

### Watch a single game unfold

```bash
pnpm dev --delay 800
```

### Test bot balance

```bash
# Should be roughly 50/50 if both are equal skill
pnpm dev --x-bot heuristic --o-bot heuristic --games 100 --quiet
```

## Notes

- Mode 1 (Infinite 3×3) has **no draws** by design
- Invalid moves are logged but handled gracefully by the engine
- Statistics are only shown when running multiple games
- Verbose mode prints the board after each move
