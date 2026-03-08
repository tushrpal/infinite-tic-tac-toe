"use client";

/**
 * Profile Page
 * User profile with stats, match history, and settings
 */

import { useState } from "react";
import Link from "next/link";
import { RankBadge } from "@/components/hud/RankBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";
import { ROUTES, RANKS } from "@/lib/constants";
import {
  cn,
  getRankFromRating,
  getRankProgress,
  formatRelativeTime,
} from "@/lib/helpers";
import type { ThemeId } from "@/theme/themes";

// Mock user data - in real app comes from auth context
const mockUser = {
  username: "Player123",
  rating: 1340,
  gamesPlayed: 156,
  wins: 89,
  losses: 67,
  winRate: 57.1,
  longestWinStreak: 8,
  currentStreak: 3,
  memberSince: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
};

const mockMatchHistory = [
  {
    id: "1",
    opponent: "TicTacPro",
    result: "win",
    rating: "+15",
    date: Date.now() - 3600000,
  },
  {
    id: "2",
    opponent: "QuickWin99",
    result: "loss",
    rating: "-12",
    date: Date.now() - 7200000,
  },
  {
    id: "3",
    opponent: "CenterFirst",
    result: "win",
    rating: "+18",
    date: Date.now() - 86400000,
  },
  {
    id: "4",
    opponent: "DiagonalMaster",
    result: "win",
    rating: "+14",
    date: Date.now() - 172800000,
  },
  {
    id: "5",
    opponent: "CornerKing",
    result: "loss",
    rating: "-11",
    date: Date.now() - 259200000,
  },
];

export default function ProfilePage() {
  const { theme, themeId, setTheme, availableThemes } = useTheme();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const rank = getRankFromRating(mockUser.rating);
  const rankProgress = getRankProgress(mockUser.rating);
  const nextRank =
    RANKS.TIERS[RANKS.TIERS.findIndex((t) => t.name === rank.name) + 1];

  return (
    <main className="flex-1 px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar & Username */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-xl bg-accent-primary/20 flex items-center justify-center text-4xl">
              🎮
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{mockUser.username}</h1>
              <RankBadge
                rank={rank.name}
                color={rank.color}
                rating={mockUser.rating}
              />
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Playing since{" "}
              {new Date(mockUser.memberSince).toLocaleDateString()}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              Settings
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">{mockUser.gamesPlayed}</div>
              <div className="text-xs text-text-muted">Games</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-success">
                {mockUser.wins}
              </div>
              <div className="text-xs text-text-muted">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-error">
                {mockUser.losses}
              </div>
              <div className="text-xs text-text-muted">Losses</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Rank Progress */}
          <div className="lg:col-span-1 space-y-6">
            {/* Rank Card */}
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h2 className="font-semibold mb-4">Rank Progress</h2>

              <div className="text-center mb-4">
                <div className="text-4xl font-bold mb-2">{mockUser.rating}</div>
                <RankBadge
                  rank={rank.name}
                  color={rank.color}
                  size="lg"
                  showTooltip={false}
                />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>{rank.name}</span>
                  <span>{nextRank?.name ?? "Max"}</span>
                </div>
                <div className="h-3 bg-board-grid rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${rankProgress.progress}%`,
                      backgroundColor: rank.color,
                    }}
                  />
                </div>
                {nextRank && (
                  <div className="text-xs text-text-muted mt-1 text-center">
                    {nextRank.minRating - mockUser.rating} points to{" "}
                    {nextRank.name}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h2 className="font-semibold mb-4">Statistics</h2>

              <div className="space-y-3">
                <StatRow
                  label="Win Rate"
                  value={`${mockUser.winRate.toFixed(1)}%`}
                />
                <StatRow
                  label="Best Streak"
                  value={`${mockUser.longestWinStreak} wins`}
                />
                <StatRow
                  label="Current Streak"
                  value={`${mockUser.currentStreak} wins`}
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Right Column - Match History */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Matches</h2>
                <Link
                  href={"/matches" as any}
                  className="text-sm text-accent-primary hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {mockMatchHistory.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-board-grid/30 hover:bg-board-grid/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          match.result === "win"
                            ? "bg-accent-success"
                            : "bg-accent-error",
                        )}
                      />
                      <div>
                        <span className="font-medium">vs {match.opponent}</span>
                        <span className="text-xs text-text-muted ml-2">
                          {formatRelativeTime(match.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          match.result === "win"
                            ? "text-accent-success"
                            : "text-accent-error",
                        )}
                      >
                        {match.rating}
                      </span>
                      <Link href={ROUTES.REPLAY(match.id)}>
                        <Button variant="ghost" size="sm">
                          Replay
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Settings"
      >
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {availableThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    themeId === t.id
                      ? "border-accent-primary bg-accent-primary/10"
                      : "border-board-grid hover:border-text-muted",
                  )}
                >
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.description}</div>
                  {/* Color preview */}
                  <div className="flex gap-1 mt-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: t.playerX.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: t.playerO.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: t.accent.primary }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Other settings could go here */}
          <div className="pt-4 border-t border-board-grid">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowSettingsModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

// Stat Row Component
function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn("font-semibold", highlight && "text-accent-primary")}>
        {value}
      </span>
    </div>
  );
}
