import { RankedQueueController, QueueEvent } from "./RankedQueueController";
import { RankTier } from "../ranked/RankTier";
import { MatchmakingRules } from "./MatchmakingRules";
import { BotFallbackResolver } from "./BotFallbackResolver";
import { QueueTicket } from "./QueueTicket";

/**
 * Example 1: Bronze player → waits → bot fallback (Easy)
 */
export async function example1_BronzePlayerBotFallback() {
  console.log("\n=== Example 1: Bronze Player → Bot Fallback (Easy) ===\n");

  const controller = new RankedQueueController({
    timeoutMs: 5_000, // 5s for demo
    recheckIntervalMs: 1_000,
  });

  // Log all events
  controller.on((event: QueueEvent) => {
    switch (event.type) {
      case "queued":
        console.log(`⏳ Searching for ranked opponent...`);
        console.log(`   Rank: ${event.ticket.rankTier}`);
        console.log(`   Mode: ${event.ticket.mode}`);
        break;
      case "searching":
        console.log(`   Waiting... ${Math.floor(event.waitTime / 1000)}s`);
        break;
      case "timeout":
        console.log(`\n⚠️  No opponent found in 5s`);
        console.log(`🤖 Assigned bot (${event.botDifficulty} difficulty)`);
        break;
    }
  });

  const result = await controller.findMatch("player1", "Bronze", "mode1");

  if (result.type === "bot") {
    console.log(`\n✅ Match Ready!`);
    console.log(`   Type: Bot`);
    console.log(`   Difficulty: ${result.botDifficulty}`);
    console.log(`   Player Rank: ${result.human.rankTier}`);
  }
}

/**
 * Example 2: Silver + Silver → matched immediately
 * This demonstrates the queue finding a match when compatible players are present
 */
export async function example2_SilverVsSilverImmediate() {
  console.log("\n=== Example 2: Silver vs Silver → Immediate Match ===\n");

  const controller = new RankedQueueController();

  // Manually add first player to queue (simulating them already waiting)
  const player1: QueueTicket = {
    playerId: "player1",
    rankTier: "Silver",
    mode: "mode2",
    enteredAt: Date.now(),
  };

  // Use internal queue to simulate player1 already waiting
  (controller as any).queue.enqueue(player1);

  console.log("Player 1 already waiting in queue:");
  console.log(`  Player: ${player1.playerId}`);
  console.log(`  Rank: ${player1.rankTier}`);
  console.log(`  Mode: ${player1.mode}`);

  console.log("\nPlayer 2 enters queue:");
  console.log("  Rank: Silver");
  console.log("  Mode: Mode 2");

  controller.on((event: QueueEvent) => {
    if (event.type === "matched") {
      console.log(`\n✅ Opponent found!`);
      console.log(`   Type: Human`);
      console.log(`   Player A: ${event.playerA.playerId} (${event.playerA.rankTier})`);
      console.log(`   Player B: ${event.playerB.playerId} (${event.playerB.rankTier})`);
    }
  });

  // Player 2 enters and should match immediately with player 1
  const result = await controller.findMatch("player2", "Silver", "mode2");

  if (result.type === "human") {
    console.log(`\n✅ Match created successfully!`);
    console.log(`   Both players removed from queue`);
  }
}

/**
 * Example 3: Gold waits → bot fallback (Medium)
 */
export async function example3_GoldPlayerBotFallback() {
  console.log("\n=== Example 3: Gold Player → Bot Fallback (Medium) ===\n");

  const controller = new RankedQueueController({
    timeoutMs: 5_000,
    recheckIntervalMs: 1_000,
  });

  controller.on((event: QueueEvent) => {
    switch (event.type) {
      case "queued":
        console.log(`⏳ Searching for ranked opponent...`);
        console.log(`   Rank: ${event.ticket.rankTier}`);
        console.log(`   Mode: ${event.ticket.mode}`);
        break;
      case "searching":
        console.log(`   Waiting... ${Math.floor(event.waitTime / 1000)}s`);
        break;
      case "timeout":
        console.log(`\n⚠️  No opponent found in 5s`);
        console.log(`🤖 Assigned bot (${event.botDifficulty} difficulty)`);
        break;
    }
  });

  const result = await controller.findMatch("player1", "Gold", "mode2");

  if (result.type === "bot") {
    console.log(`\n✅ Match Ready!`);
    console.log(`   Type: Bot`);
    console.log(`   Difficulty: ${result.botDifficulty}`);
    console.log(`   Expected: medium (Gold tier)`);
  }
}

/**
 * Example 4: Diamond vs Silver → rejected (rank gap too large)
 */
export function example4_DiamondVsSilverRejected() {
  console.log("\n=== Example 4: Diamond vs Silver → Rejected (Rank Gap) ===\n");

  const diamondPlayer = {
    playerId: "player1",
    rankTier: "Diamond" as RankTier,
    mode: "mode1" as const,
    enteredAt: Date.now(),
  };

  const silverPlayer = {
    playerId: "player2",
    rankTier: "Silver" as RankTier,
    mode: "mode1" as const,
    enteredAt: Date.now(),
  };

  console.log("Attempting to match:");
  console.log(`  Player 1: ${diamondPlayer.rankTier}`);
  console.log(`  Player 2: ${silverPlayer.rankTier}`);
  console.log(`  Mode: ${diamondPlayer.mode}`);

  const canMatch = MatchmakingRules.canMatch(diamondPlayer, silverPlayer);
  const tierDistance = MatchmakingRules.calculateTierDistance(
    diamondPlayer.rankTier,
    silverPlayer.rankTier
  );

  console.log(`\n❌ Match Rejected!`);
  console.log(`   Reason: ${MatchmakingRules.getMatchRejectionReason(diamondPlayer, silverPlayer)}`);
  console.log(`   Tier Distance: ${tierDistance} (max allowed: 1)`);
  console.log(`   Can Match: ${canMatch}`);
}

/**
 * Example 5: Mode 1 & Mode 2 queues do NOT mix
 */
export function example5_ModesDoNotMix() {
  console.log("\n=== Example 5: Mode 1 & Mode 2 Do NOT Mix ===\n");

  const mode1Player = {
    playerId: "player1",
    rankTier: "Silver" as RankTier,
    mode: "mode1" as const,
    enteredAt: Date.now(),
  };

  const mode2Player = {
    playerId: "player2",
    rankTier: "Silver" as RankTier,
    mode: "mode2" as const,
    enteredAt: Date.now(),
  };

  console.log("Attempting to match:");
  console.log(`  Player 1: ${mode1Player.rankTier} (${mode1Player.mode})`);
  console.log(`  Player 2: ${mode2Player.rankTier} (${mode2Player.mode})`);

  const canMatch = MatchmakingRules.canMatch(mode1Player, mode2Player);

  console.log(`\n❌ Match Rejected!`);
  console.log(`   Reason: ${MatchmakingRules.getMatchRejectionReason(mode1Player, mode2Player)}`);
  console.log(`   Can Match: ${canMatch}`);
  console.log(`\n   Note: Players must be in same mode to match`);
}

/**
 * Example 6: Bot difficulty mapping demonstration
 */
export function example6_BotDifficultyMapping() {
  console.log("\n=== Example 6: Bot Difficulty Mapping ===\n");

  const ranks: RankTier[] = [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
  ];

  console.log("Rank → Bot Difficulty Mapping:\n");

  ranks.forEach((rank) => {
    const difficulty = BotFallbackResolver.resolveBotDifficulty(rank);
    console.log(`  ${rank.padEnd(15)} → ${difficulty}`);
  });

  console.log("\nRules:");
  console.log("  Bronze      → Easy");
  console.log("  Silver/Gold → Medium");
  console.log("  Platinum+   → Hard");
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   RANKED QUEUE & MATCHMAKING EXAMPLES                 ║");
  console.log("╚═══════════════════════════════════════════════════════╝");

  // Synchronous examples
  example4_DiamondVsSilverRejected();
  example5_ModesDoNotMix();
  example6_BotDifficultyMapping();

  // Async examples
  await example1_BronzePlayerBotFallback();
  await example2_SilverVsSilverImmediate();
  await example3_GoldPlayerBotFallback();

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║   ALL EXAMPLES COMPLETED                              ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");
}

// Allow running directly
runAllExamples().catch(console.error);
