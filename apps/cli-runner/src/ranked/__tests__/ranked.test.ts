import { describe, it, expect } from "vitest";
import type { MatchResult } from "@infinite-ttt/shared";
import {
  getRankTier,
  getBotDifficultyForTier,
  createRankedPlayer,
  createRankedMatchContext,
  computePerformanceMultiplier,
  computeRankDelta,
  applyRankDelta,
  RANK_TIER_THRESHOLDS,
} from "../index";

describe("Ranked System", () => {
  describe("RankTier", () => {
    it("should return correct tier for points", () => {
      expect(getRankTier(0)).toBe("Bronze");
      expect(getRankTier(500)).toBe("Bronze");
      expect(getRankTier(999)).toBe("Bronze");
      expect(getRankTier(1000)).toBe("Silver");
      expect(getRankTier(1500)).toBe("Silver");
      expect(getRankTier(1999)).toBe("Silver");
      expect(getRankTier(2000)).toBe("Gold");
      expect(getRankTier(2500)).toBe("Gold");
      expect(getRankTier(2999)).toBe("Gold");
      expect(getRankTier(3000)).toBe("Platinum");
      expect(getRankTier(3500)).toBe("Platinum");
      expect(getRankTier(3999)).toBe("Platinum");
      expect(getRankTier(4000)).toBe("Diamond");
      expect(getRankTier(5000)).toBe("Diamond");
    });

    it("should return correct bot difficulty for tier", () => {
      expect(getBotDifficultyForTier("Bronze")).toBe("easy");
      expect(getBotDifficultyForTier("Silver")).toBe("medium");
      expect(getBotDifficultyForTier("Gold")).toBe("medium");
      expect(getBotDifficultyForTier("Platinum")).toBe("hard");
      expect(getBotDifficultyForTier("Diamond")).toBe("hard");
    });
  });

  describe("Performance Multiplier", () => {
    describe("Mode 1", () => {
      it("should give max multiplier for perfect win (5 moves)", () => {
        const match: MatchResult = {
          matchId: "test-1",
          mode: "mode1",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [{ winner: "player1" } as any],
          winner: "player1",
          roundsPlayed: 1,
          totalMoves: 5,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.3);
      });

      it("should give high multiplier for fast win (10 moves)", () => {
        const match: MatchResult = {
          matchId: "test-2",
          mode: "mode1",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [{ winner: "player1" } as any],
          winner: "player1",
          roundsPlayed: 1,
          totalMoves: 10,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.25);
      });

      it("should give standard multiplier for long win (45 moves)", () => {
        const match: MatchResult = {
          matchId: "test-3",
          mode: "mode1",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [{ winner: "player1" } as any],
          winner: "player1",
          roundsPlayed: 1,
          totalMoves: 45,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.0);
      });

      it("should give min multiplier for quick loss (8 moves)", () => {
        const match: MatchResult = {
          matchId: "test-4",
          mode: "mode1",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [{ winner: "player2" } as any],
          winner: "player2",
          roundsPlayed: 1,
          totalMoves: 8,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(0.8);
      });

      it("should give 1.0 multiplier for draw", () => {
        const match: MatchResult = {
          matchId: "test-5",
          mode: "mode1",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [{ winner: null } as any],
          winner: null,
          roundsPlayed: 1,
          totalMoves: 20,
          drawCount: 1,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.0);
      });
    });

    describe("Mode 2", () => {
      it("should give max multiplier for dominant win (3-0, no draws)", () => {
        const match: MatchResult = {
          matchId: "test-6",
          mode: "mode2",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [
            { winner: "player1" } as any,
            { winner: "player1" } as any,
            { winner: "player1" } as any,
          ],
          winner: "player1",
          roundsPlayed: 3,
          totalMoves: 30,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.3);
      });

      it("should give high multiplier for solid win (2-0, no draws)", () => {
        const match: MatchResult = {
          matchId: "test-7",
          mode: "mode2",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [
            { winner: "player1" } as any,
            { winner: "player1" } as any,
          ],
          winner: "player1",
          roundsPlayed: 2,
          totalMoves: 20,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(1.2);
      });

      it("should give min multiplier for blowout loss (0-3)", () => {
        const match: MatchResult = {
          matchId: "test-8",
          mode: "mode2",
          isRanked: true,
          difficulty: "medium",
          players: [
            { id: "player1", type: "human" },
            { id: "player2", type: "human" },
          ],
          games: [
            { winner: "player2" } as any,
            { winner: "player2" } as any,
            { winner: "player2" } as any,
          ],
          winner: "player2",
          roundsPlayed: 3,
          totalMoves: 30,
          drawCount: 0,
          createdAt: Date.now(),
        };

        const multiplier = computePerformanceMultiplier(match, "player1");
        expect(multiplier).toBe(0.8);
      });
    });
  });

  describe("Rank Delta Computation", () => {
    it("should compute max win points (+40) for dominant win", () => {
      const match: MatchResult = {
        matchId: "test-9",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: "player1" } as any],
        winner: "player1",
        roundsPlayed: 1,
        totalMoves: 5,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("win");
      expect(delta.pointsChange).toBe(39); // 30 * 1.3 = 39
      expect(delta.performanceMultiplier).toBe(1.3);
      expect(delta.vsBot).toBe(false);
      expect(delta.botPenaltyApplied).toBe(false);
    });

    it("should compute standard win points (~+30) for narrow win", () => {
      const match: MatchResult = {
        matchId: "test-10",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: "player1" } as any],
        winner: "player1",
        roundsPlayed: 1,
        totalMoves: 45,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("win");
      expect(delta.pointsChange).toBe(30); // 30 * 1.0 = 30
      expect(delta.performanceMultiplier).toBe(1.0);
    });

    it("should return 0 for draw", () => {
      const match: MatchResult = {
        matchId: "test-11",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: null } as any],
        winner: null,
        roundsPlayed: 1,
        totalMoves: 20,
        drawCount: 1,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("draw");
      expect(delta.pointsChange).toBe(0);
    });

    it("should compute standard loss points (~-30) for narrow loss", () => {
      const match: MatchResult = {
        matchId: "test-12",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: "player2" } as any],
        winner: "player2",
        roundsPlayed: 1,
        totalMoves: 45,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("loss");
      expect(delta.pointsChange).toBe(-30); // -30 * 1.0 = -30
    });

    it("should compute max loss points (-40) for blowout loss", () => {
      const match: MatchResult = {
        matchId: "test-13",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: "player2" } as any],
        winner: "player2",
        roundsPlayed: 1,
        totalMoves: 8,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("loss");
      expect(delta.pointsChange).toBe(-25); // -30 * 0.8 = -24, clamped to -25 (min loss)
    });

    it("should apply bot win penalty", () => {
      const match: MatchResult = {
        matchId: "test-14",
        mode: "mode1",
        isRanked: true,
        difficulty: "easy",
        players: [
          { id: "player1", type: "human" },
          { id: "bot:easy", type: "bot" },
        ],
        games: [{ winner: "player1" } as any],
        winner: "player1",
        roundsPlayed: 1,
        totalMoves: 5,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("bot:easy", 1000, "Silver", true, "easy"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("win");
      expect(delta.vsBot).toBe(true);
      expect(delta.botPenaltyApplied).toBe(true);
      expect(delta.pointsChange).toBe(25); // 30 * 1.3 * 0.6 = 23.4, clamped to 25
    });

    it("should NOT apply bot penalty for loss vs bot", () => {
      const match: MatchResult = {
        matchId: "test-15",
        mode: "mode1",
        isRanked: true,
        difficulty: "hard",
        players: [
          { id: "player1", type: "human" },
          { id: "bot:hard", type: "bot" },
        ],
        games: [{ winner: "bot:hard" } as any],
        winner: "bot:hard",
        roundsPlayed: 1,
        totalMoves: 8,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("bot:hard", 1000, "Silver", true, "hard"),
        true,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("loss");
      expect(delta.vsBot).toBe(true);
      expect(delta.botPenaltyApplied).toBe(false); // No penalty for losses
      expect(delta.pointsChange).toBe(-25); // -30 * 0.8 = -24, clamped to -25 (min loss)
    });

    it("should apply Mode 2 multiplier (1.5x)", () => {
      const match: MatchResult = {
        matchId: "test-16",
        mode: "mode2",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [
          { winner: "player1" } as any,
          { winner: "player1" } as any,
          { winner: "player1" } as any,
        ],
        winner: "player1",
        roundsPlayed: 3,
        totalMoves: 30,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        true,
        2
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.outcome).toBe("win");
      expect(delta.modeMultiplier).toBe(1.5);
      expect(delta.pointsChange).toBe(40); // 30 * 1.3 * 1.5 = 58.5, clamped to 40
    });

    it("should return 0 for unranked match", () => {
      const match: MatchResult = {
        matchId: "test-17",
        mode: "mode1",
        isRanked: false,
        difficulty: "medium",
        players: [
          { id: "player1", type: "human" },
          { id: "player2", type: "human" },
        ],
        games: [{ winner: "player1" } as any],
        winner: "player1",
        roundsPlayed: 1,
        totalMoves: 5,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(
        createRankedPlayer("player1", 1000, "Silver"),
        createRankedPlayer("player2", 1000, "Silver"),
        false,
        1
      );

      const delta = computeRankDelta(match, "player1", context);
      expect(delta.pointsChange).toBe(0);
    });
  });

  describe("Apply Rank Delta", () => {
    it("should apply positive delta and maintain tier", () => {
      const delta = {
        playerId: "player1",
        pointsChange: 30,
        outcome: "win" as const,
        performanceMultiplier: 1.0,
        vsBot: false,
        botPenaltyApplied: false,
        modeMultiplier: 1.0,
        explanation: "Win",
      };

      const result = applyRankDelta(1000, delta);
      expect(result.newPoints).toBe(1030);
      expect(result.newTier).toBe("Silver");
      expect(result.previousTier).toBe("Silver");
      expect(result.promoted).toBe(false);
      expect(result.demoted).toBe(false);
    });

    it("should detect promotion", () => {
      const delta = {
        playerId: "player1",
        pointsChange: 30,
        outcome: "win" as const,
        performanceMultiplier: 1.0,
        vsBot: false,
        botPenaltyApplied: false,
        modeMultiplier: 1.0,
        explanation: "Win",
      };

      const result = applyRankDelta(990, delta);
      expect(result.newPoints).toBe(1020);
      expect(result.newTier).toBe("Silver");
      expect(result.previousTier).toBe("Bronze");
      expect(result.promoted).toBe(true);
      expect(result.demoted).toBe(false);
    });

    it("should detect demotion", () => {
      const delta = {
        playerId: "player1",
        pointsChange: -30,
        outcome: "loss" as const,
        performanceMultiplier: 1.0,
        vsBot: false,
        botPenaltyApplied: false,
        modeMultiplier: 1.0,
        explanation: "Loss",
      };

      const result = applyRankDelta(1010, delta);
      expect(result.newPoints).toBe(980);
      expect(result.newTier).toBe("Bronze");
      expect(result.previousTier).toBe("Silver");
      expect(result.promoted).toBe(false);
      expect(result.demoted).toBe(true);
    });

    it("should not allow negative points", () => {
      const delta = {
        playerId: "player1",
        pointsChange: -50,
        outcome: "loss" as const,
        performanceMultiplier: 1.0,
        vsBot: false,
        botPenaltyApplied: false,
        modeMultiplier: 1.0,
        explanation: "Loss",
      };

      const result = applyRankDelta(30, delta);
      expect(result.newPoints).toBe(0);
      expect(result.newTier).toBe("Bronze");
    });

    it("should handle multiple promotions", () => {
      const delta = {
        playerId: "player1",
        pointsChange: 2500,
        outcome: "win" as const,
        performanceMultiplier: 1.0,
        vsBot: false,
        botPenaltyApplied: false,
        modeMultiplier: 1.0,
        explanation: "Massive win",
      };

      const result = applyRankDelta(500, delta);
      expect(result.newPoints).toBe(3000);
      expect(result.newTier).toBe("Platinum");
      expect(result.previousTier).toBe("Bronze");
      expect(result.promoted).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle full ranked match flow", () => {
      // Setup: Two silver players
      const player1 = createRankedPlayer("alice", 1500, "Silver");
      const player2 = createRankedPlayer("bob", 1600, "Silver");

      // Match: Alice dominates Bob in Mode 1
      const match: MatchResult = {
        matchId: "integration-1",
        mode: "mode1",
        isRanked: true,
        difficulty: "medium",
        players: [
          { id: "alice", type: "human" },
          { id: "bob", type: "human" },
        ],
        games: [{ winner: "alice" } as any],
        winner: "alice",
        roundsPlayed: 1,
        totalMoves: 5,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(player1, player2, true, 1);

      // Compute deltas
      const aliceDelta = computeRankDelta(match, "alice", context);
      const bobDelta = computeRankDelta(match, "bob", context);

      // Apply deltas
      const aliceResult = applyRankDelta(player1.points, aliceDelta);
      const bobResult = applyRankDelta(player2.points, bobDelta);

      // Verify Alice gains points (dominant win)
      expect(aliceDelta.outcome).toBe("win");
      expect(aliceDelta.pointsChange).toBe(39); // 30 * 1.3
      expect(aliceResult.newPoints).toBe(1539);
      expect(aliceResult.newTier).toBe("Silver");

      // Verify Bob loses points (quick loss)
      expect(bobDelta.outcome).toBe("loss");
      expect(bobDelta.pointsChange).toBe(-25); // -30 * 0.8 = -24, clamped to -25
      expect(bobResult.newPoints).toBe(1575); // 1600 - 25
      expect(bobResult.newTier).toBe("Silver");
    });

    it("should handle promotion scenario", () => {
      // Setup: Bronze player near threshold
      const player = createRankedPlayer("charlie", 980, "Bronze");
      const bot = createRankedPlayer("bot:easy", 500, "Bronze", true, "easy");

      // Match: Charlie wins
      const match: MatchResult = {
        matchId: "integration-2",
        mode: "mode1",
        isRanked: true,
        difficulty: "easy",
        players: [
          { id: "charlie", type: "human" },
          { id: "bot:easy", type: "bot" },
        ],
        games: [{ winner: "charlie" } as any],
        winner: "charlie",
        roundsPlayed: 1,
        totalMoves: 20,
        drawCount: 0,
        createdAt: Date.now(),
      };

      const context = createRankedMatchContext(player, bot, true, 1);
      const delta = computeRankDelta(match, "charlie", context);
      const result = applyRankDelta(player.points, delta);

      // Should be promoted to Silver (with bot penalty)
      expect(result.newPoints).toBeGreaterThanOrEqual(1000);
      expect(result.newTier).toBe("Silver");
      expect(result.promoted).toBe(true);
    });
  });
});
