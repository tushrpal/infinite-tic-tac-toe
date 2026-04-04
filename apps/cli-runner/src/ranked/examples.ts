/**
 * Example: Using the Ranked System
 *
 * This file demonstrates how to use the ranked system to compute
 * rank changes from match results.
 */

import type { MatchResult } from "@infinite-ttt/shared";
import {
  computeRankDelta,
  applyRankDelta,
  createRankedMatchContext,
  createRankedPlayer,
  getRankTier,
  getBotDifficultyForTier,
} from "./index";

// Example 1: Human vs Human - Dominant Win (Mode 1)
function example1_DominantWin() {
  console.log("\n=== Example 1: Dominant Win (Mode 1) ===");

  // Setup: Two Silver players
  const alice = createRankedPlayer("alice", 1500, "Silver");
  const bob = createRankedPlayer("bob", 1600, "Silver");

  // Match result: Alice wins quickly (5 moves)
  const match: MatchResult = {
    matchId: "example-1",
    mode: "mode1",
    isRanked: true,
    difficulty: "medium",
    players: [
      { id: "alice", type: "human" },
      { id: "bob", type: "human" },
    ],
    games: [
      {
        winner: "alice",
        moveCount: 5,
      } as any,
    ],
    winner: "alice",
    roundsPlayed: 1,
    totalMoves: 5,
    drawCount: 0,
    createdAt: Date.now(),
  };

  // Create context
  const context = createRankedMatchContext(alice, bob, true, 1);

  // Compute deltas
  const aliceDelta = computeRankDelta(match, "alice", context);
  const bobDelta = computeRankDelta(match, "bob", context);

  // Apply deltas
  const aliceResult = applyRankDelta(alice.points, aliceDelta);
  const bobResult = applyRankDelta(bob.points, bobDelta);

  console.log("Alice (winner):");
  console.log(`  Before: ${alice.points} (${alice.tier})`);
  console.log(`  Delta: ${aliceDelta.pointsChange} points`);
  console.log(`  Explanation: ${aliceDelta.explanation}`);
  console.log(`  After: ${aliceResult.newPoints} (${aliceResult.newTier})`);
  if (aliceResult.promoted) console.log("  🎉 PROMOTED!");

  console.log("\nBob (loser):");
  console.log(`  Before: ${bob.points} (${bob.tier})`);
  console.log(`  Delta: ${bobDelta.pointsChange} points`);
  console.log(`  Explanation: ${bobDelta.explanation}`);
  console.log(`  After: ${bobResult.newPoints} (${bobResult.newTier})`);
  if (bobResult.demoted) console.log("  ⬇️  DEMOTED!");
}

// Example 2: Human vs Bot - Win with Penalty
function example2_BotWinPenalty() {
  console.log("\n=== Example 2: Win vs Bot (Penalty Applied) ===");

  // Setup: Bronze player vs easy bot
  const player = createRankedPlayer("charlie", 500, "Bronze");
  const bot = createRankedPlayer("bot:easy", 0, "Bronze", true, "easy");

  // Match result: Player wins
  const match: MatchResult = {
    matchId: "example-2",
    mode: "mode1",
    isRanked: true,
    difficulty: "easy",
    players: [
      { id: "charlie", type: "human" },
      { id: "bot:easy", type: "bot" },
    ],
    games: [
      {
        winner: "charlie",
        moveCount: 15,
      } as any,
    ],
    winner: "charlie",
    roundsPlayed: 1,
    totalMoves: 15,
    drawCount: 0,
    createdAt: Date.now(),
  };

  const context = createRankedMatchContext(player, bot, true, 1);
  const delta = computeRankDelta(match, "charlie", context);
  const result = applyRankDelta(player.points, delta);

  console.log("Charlie (winner vs bot):");
  console.log(`  Before: ${player.points} (${player.tier})`);
  console.log(`  Delta: ${delta.pointsChange} points`);
  console.log(`  Bot penalty: ${delta.botPenaltyApplied ? "YES (0.6x)" : "NO"}`);
  console.log(`  Explanation: ${delta.explanation}`);
  console.log(`  After: ${result.newPoints} (${result.newTier})`);
}

// Example 3: Mode 2 - Dominant Win (3-0)
function example3_Mode2DominantWin() {
  console.log("\n=== Example 3: Mode 2 Dominant Win (3-0) ===");

  const player1 = createRankedPlayer("diana", 2500, "Gold");
  const player2 = createRankedPlayer("eve", 2400, "Gold");

  // Match result: Diana wins 3-0 in Mode 2
  const match: MatchResult = {
    matchId: "example-3",
    mode: "mode2",
    isRanked: true,
    difficulty: "hard",
    players: [
      { id: "diana", type: "human" },
      { id: "eve", type: "human" },
    ],
    games: [
      { winner: "diana" } as any,
      { winner: "diana" } as any,
      { winner: "diana" } as any,
    ],
    winner: "diana",
    roundsPlayed: 3,
    totalMoves: 30,
    drawCount: 0,
    createdAt: Date.now(),
  };

  const context = createRankedMatchContext(player1, player2, true, 2);
  const delta = computeRankDelta(match, "diana", context);
  const result = applyRankDelta(player1.points, delta);

  console.log("Diana (winner 3-0 in Mode 2):");
  console.log(`  Before: ${player1.points} (${player1.tier})`);
  console.log(`  Delta: ${delta.pointsChange} points`);
  console.log(`  Performance: ${delta.performanceMultiplier}x (dominant)`);
  console.log(`  Mode multiplier: ${delta.modeMultiplier}x (Mode 2 bonus)`);
  console.log(`  Explanation: ${delta.explanation}`);
  console.log(`  After: ${result.newPoints} (${result.newTier})`);
}

// Example 4: Promotion Scenario
function example4_Promotion() {
  console.log("\n=== Example 4: Promotion (Bronze → Silver) ===");

  const player = createRankedPlayer("frank", 980, "Bronze");
  const opponent = createRankedPlayer("grace", 1200, "Silver");

  // Match result: Frank wins
  const match: MatchResult = {
    matchId: "example-4",
    mode: "mode1",
    isRanked: true,
    difficulty: "medium",
    players: [
      { id: "frank", type: "human" },
      { id: "grace", type: "human" },
    ],
    games: [{ winner: "frank" } as any],
    winner: "frank",
    roundsPlayed: 1,
    totalMoves: 20,
    drawCount: 0,
    createdAt: Date.now(),
  };

  const context = createRankedMatchContext(player, opponent, true, 1);
  const delta = computeRankDelta(match, "frank", context);
  const result = applyRankDelta(player.points, delta);

  console.log("Frank (near promotion threshold):");
  console.log(`  Before: ${player.points} (${player.tier})`);
  console.log(`  Threshold for Silver: 1000 points`);
  console.log(`  Delta: ${delta.pointsChange} points`);
  console.log(`  After: ${result.newPoints} (${result.newTier})`);
  if (result.promoted) {
    console.log(`  🎉 PROMOTED TO ${result.newTier.toUpperCase()}!`);
  }
}

// Example 5: Bot Difficulty for Tier
function example5_BotDifficultyMapping() {
  console.log("\n=== Example 5: Bot Difficulty by Tier ===");

  const tiers: Array<[string, number]> = [
    ["Bronze", 500],
    ["Silver", 1500],
    ["Gold", 2500],
    ["Platinum", 3500],
    ["Diamond", 5000],
  ];

  for (const [tierName, points] of tiers) {
    const tier = getRankTier(points);
    const botDiff = getBotDifficultyForTier(tier);
    console.log(`  ${tier} (${points} pts) → Bot: ${botDiff}`);
  }
}

// Run all examples
console.log("\n🎮 Ranked System Examples\n");
console.log("=" .repeat(50));

example1_DominantWin();
example2_BotWinPenalty();
example3_Mode2DominantWin();
example4_Promotion();
example5_BotDifficultyMapping();

console.log("\n" + "=".repeat(50));
console.log("\n✅ All examples completed successfully!\n");
