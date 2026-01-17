/**
 * Example: Complete Ranked Match Flow
 *
 * This demonstrates the full ranked match flow:
 * 1. Create session
 * 2. Pre-match preview
 * 3. Execute match
 * 4. Post-match summary
 */

import type { MatchResult } from "@infinite-ttt/shared";
import {
  RankedMatchController,
  createRankedSession,
  createRankedSessionWithPoints,
} from "./index";

/**
 * Example 1: Basic Ranked Match Flow
 */
function example1_BasicFlow() {
  console.log("\n=== Example 1: Basic Ranked Match Flow ===\n");

  // Step 1: Create session (new player starts at Bronze 0)
  const session = createRankedSession("Alice");
  console.log("Session created:");
  console.log(`  Player: ${session.player.playerId}`);
  console.log(`  Rank: ${session.player.tier} (${session.player.points} pts)`);

  // Step 2: Create controller
  const controller = new RankedMatchController(session);

  // Step 3: Pre-match setup (Mode 1, bot fallback)
  const { opponent, preview, previewText } = controller.preMatch(1);
  console.log(previewText);

  console.log("Opponent resolved:");
  console.log(`  Type: ${opponent.type}`);
  console.log(`  Player: ${opponent.player.playerId}`);
  console.log(`  Bot fallback: ${opponent.isBotFallback}`);

  // Step 4: Simulate match result (Alice wins)
  const matchResult: MatchResult = {
    matchId: "ranked-example-1",
    mode: "mode1",
    isRanked: true,
    difficulty: opponent.player.botDifficulty || "easy",
    players: [
      { id: session.player.playerId, type: "human" },
      { id: opponent.player.playerId, type: "bot" },
    ],
    games: [{ winner: session.player.playerId } as any],
    winner: session.player.playerId,
    roundsPlayed: 1,
    totalMoves: 10, // Fast win
    drawCount: 0,
    createdAt: Date.now(),
  };

  // Step 5: Post-match update
  const { summary, summaryText, updatedSession } = controller.postMatch(
    matchResult,
    opponent
  );
  console.log(summaryText);

  console.log("Session updated:");
  console.log(`  New rank: ${updatedSession.player.tier} (${updatedSession.player.points} pts)`);
  console.log(`  Record: ${updatedSession.wins}W - ${updatedSession.losses}L - ${updatedSession.draws}D`);
}

/**
 * Example 2: Multiple Ranked Matches (Progression)
 */
function example2_Progression() {
  console.log("\n=== Example 2: Multiple Matches (Progression) ===\n");

  // Start at Bronze with some points
  let session = createRankedSessionWithPoints("Bob", 950);
  const controller = new RankedMatchController(session);

  console.log("Starting rank:");
  console.log(`  ${session.player.tier}: ${session.player.points} pts`);
  console.log("");

  // Play 3 ranked matches
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Match ${i} ---`);

    // Pre-match
    const { opponent, preview } = controller.preMatch(1);
    console.log(`Opponent: ${opponent.player.playerId}`);
    console.log(`Expected win: +${preview.winRange.min} to +${preview.winRange.max}`);

    // Simulate win
    const matchResult: MatchResult = {
      matchId: `ranked-progression-${i}`,
      mode: "mode1",
      isRanked: true,
      difficulty: opponent.player.botDifficulty || "easy",
      players: [
        { id: session.player.playerId, type: "human" },
        { id: opponent.player.playerId, type: "bot" },
      ],
      games: [{ winner: session.player.playerId } as any],
      winner: session.player.playerId,
      roundsPlayed: 1,
      totalMoves: 15,
      drawCount: 0,
      createdAt: Date.now(),
    };

    // Post-match
    const { summary } = controller.postMatch(matchResult, opponent);
    session = controller.getSession();

    console.log(`Result: ${summary.outcome.toUpperCase()}`);
    console.log(`Points: ${summary.delta.pointsChange >= 0 ? "+" : ""}${summary.delta.pointsChange}`);
    console.log(`New rank: ${session.player.tier} (${session.player.points} pts)`);

    if (summary.promoted) {
      console.log(`🌟 PROMOTED TO ${session.player.tier.toUpperCase()}!`);
    }
  }

  // Show final status
  console.log("\n" + controller.showRankStatus());
}

/**
 * Example 3: Mode 2 Dominant Win
 */
function example3_Mode2Dominant() {
  console.log("\n=== Example 3: Mode 2 Dominant Win ===\n");

  // Gold tier player
  const session = createRankedSessionWithPoints("Charlie", 2500);
  const controller = new RankedMatchController(session);

  console.log("Starting rank: Gold (2500 pts)\n");

  // Pre-match (Mode 2)
  const { opponent, previewText } = controller.preMatch(2);
  console.log(previewText);

  // Simulate dominant win (3-0)
  const matchResult: MatchResult = {
    matchId: "mode2-dominant",
    mode: "mode2",
    isRanked: true,
    difficulty: opponent.player.botDifficulty || "medium",
    players: [
      { id: session.player.playerId, type: "human" },
      { id: opponent.player.playerId, type: "bot" },
    ],
    games: [
      { winner: session.player.playerId } as any,
      { winner: session.player.playerId } as any,
      { winner: session.player.playerId } as any,
    ],
    winner: session.player.playerId,
    roundsPlayed: 3,
    totalMoves: 30,
    drawCount: 0,
    createdAt: Date.now(),
  };

  // Post-match
  const { summaryText } = controller.postMatch(matchResult, opponent);
  console.log(summaryText);
}

/**
 * Example 4: Loss and Demotion
 */
function example4_LossAndDemotion() {
  console.log("\n=== Example 4: Loss and Potential Demotion ===\n");

  // Player just above Silver threshold
  const session = createRankedSessionWithPoints("Diana", 1010);
  const controller = new RankedMatchController(session);

  console.log("Starting rank: Silver (1010 pts) - Close to demotion!\n");

  // Pre-match
  const { opponent, previewText } = controller.preMatch(1);
  console.log(previewText);

  // Simulate loss
  const matchResult: MatchResult = {
    matchId: "loss-demotion",
    mode: "mode1",
    isRanked: true,
    difficulty: opponent.player.botDifficulty || "medium",
    players: [
      { id: session.player.playerId, type: "human" },
      { id: opponent.player.playerId, type: "bot" },
    ],
    games: [{ winner: opponent.player.playerId } as any],
    winner: opponent.player.playerId,
    roundsPlayed: 1,
    totalMoves: 8, // Quick loss
    drawCount: 0,
    createdAt: Date.now(),
  };

  // Post-match
  const { summaryText } = controller.postMatch(matchResult, opponent);
  console.log(summaryText);
}

/**
 * Example 5: Draw (No Points Change)
 */
function example5_Draw() {
  console.log("\n=== Example 5: Draw (No Points Change) ===\n");

  const session = createRankedSessionWithPoints("Eve", 1500);
  const controller = new RankedMatchController(session);

  console.log("Starting rank: Silver (1500 pts)\n");

  // Pre-match
  const { opponent } = controller.preMatch(1);

  // Simulate draw
  const matchResult: MatchResult = {
    matchId: "draw-example",
    mode: "mode1",
    isRanked: true,
    difficulty: opponent.player.botDifficulty || "medium",
    players: [
      { id: session.player.playerId, type: "human" },
      { id: opponent.player.playerId, type: "bot" },
    ],
    games: [{ winner: null } as any],
    winner: null,
    roundsPlayed: 1,
    totalMoves: 20,
    drawCount: 1,
    createdAt: Date.now(),
  };

  // Post-match
  const { summaryText } = controller.postMatch(matchResult, opponent);
  console.log(summaryText);
}

/**
 * Example 6: Using executeRankedMatch (All-in-One)
 */
async function example6_ExecuteRankedMatch() {
  console.log("\n=== Example 6: Using executeRankedMatch() ===\n");

  const session = createRankedSession("Frank");
  const controller = new RankedMatchController(session);

  // Execute complete flow
  const result = await controller.executeRankedMatch(
    1, // Mode 1
    async (opponent) => {
      console.log(`\nPlaying match against ${opponent.player.playerId}...\n`);

      // Simulate game execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return match result
      return {
        matchId: "all-in-one",
        mode: "mode1",
        isRanked: true,
        difficulty: opponent.player.botDifficulty || "easy",
        players: [
          { id: session.player.playerId, type: "human" },
          { id: opponent.player.playerId, type: "bot" },
        ],
        games: [{ winner: session.player.playerId } as any],
        winner: session.player.playerId,
        roundsPlayed: 1,
        totalMoves: 12,
        drawCount: 0,
        createdAt: Date.now(),
      };
    }
  );

  console.log("Preview:");
  console.log(`  Opponent: ${result.opponent.player.playerId}`);
  console.log(`  Win range: +${result.preview.winRange.min} to +${result.preview.winRange.max}`);

  console.log("\nMatch completed!");
  console.log(`  Winner: ${result.matchResult.winner}`);

  console.log("\nSummary:");
  console.log(`  Outcome: ${result.summary.outcome}`);
  console.log(`  Points: ${result.summary.delta.pointsChange >= 0 ? "+" : ""}${result.summary.delta.pointsChange}`);
  console.log(`  New rank: ${result.updatedSession.player.tier} (${result.updatedSession.player.points} pts)`);
}

// Run all examples
console.log("\n🎮 Ranked Match Flow Examples\n");
console.log("=".repeat(60));

example1_BasicFlow();
example2_Progression();
example3_Mode2Dominant();
example4_LossAndDemotion();
example5_Draw();
await example6_ExecuteRankedMatch();

console.log("\n" + "=".repeat(60));
console.log("\n✅ All examples completed successfully!\n");
