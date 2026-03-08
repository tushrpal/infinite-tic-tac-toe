import Link from "next/link";
import { RankBadge } from "@/components/hud/RankBadge";
import { Button } from "@/components/ui/Button";
import { ROUTES, RANKS } from "@/lib/constants";
import { cn, getRankFromRating, formatRelativeTime } from "@/lib/helpers";

export const metadata = {
  title: "Leaderboard - Infinite Tic-Tac-Toe",
  description: "See the top players and their rankings",
};

// Mock leaderboard data - in real app this comes from API
const mockLeaderboard = [
  {
    rank: 1,
    username: "GrandMaster_X",
    rating: 2150,
    wins: 342,
    losses: 89,
    winRate: 79.4,
  },
  {
    rank: 2,
    username: "TicTacPro",
    rating: 2080,
    wins: 298,
    losses: 102,
    winRate: 74.5,
  },
  {
    rank: 3,
    username: "UndefeatedO",
    rating: 1980,
    wins: 256,
    losses: 78,
    winRate: 76.6,
  },
  {
    rank: 4,
    username: "StrategyKing",
    rating: 1920,
    wins: 234,
    losses: 112,
    winRate: 67.6,
  },
  {
    rank: 5,
    username: "QuickWin99",
    rating: 1850,
    wins: 312,
    losses: 156,
    winRate: 66.7,
  },
  {
    rank: 6,
    username: "DiagonalMaster",
    rating: 1780,
    wins: 198,
    losses: 98,
    winRate: 66.9,
  },
  {
    rank: 7,
    username: "CornerKing",
    rating: 1720,
    wins: 245,
    losses: 145,
    winRate: 62.8,
  },
  {
    rank: 8,
    username: "CenterFirst",
    rating: 1680,
    wins: 178,
    losses: 102,
    winRate: 63.6,
  },
  {
    rank: 9,
    username: "PatientPlayer",
    rating: 1620,
    wins: 156,
    losses: 98,
    winRate: 61.4,
  },
  {
    rank: 10,
    username: "SlidingPro",
    rating: 1590,
    wins: 134,
    losses: 89,
    winRate: 60.1,
  },
];

export default function LeaderboardPage() {
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
            <p className="text-text-secondary mt-1">Top ranked players</p>
          </div>
          <Link href={ROUTES.PLAY_RANKED}>
            <Button>Play Ranked</Button>
          </Link>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="pt-8">
            <PodiumCard player={mockLeaderboard[1]} position={2} />
          </div>
          {/* 1st Place */}
          <div>
            <PodiumCard player={mockLeaderboard[0]} position={1} />
          </div>
          {/* 3rd Place */}
          <div className="pt-12">
            <PodiumCard player={mockLeaderboard[2]} position={3} />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl bg-surface-elevated border border-board-grid overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-board-grid">
                <th className="text-left py-4 px-4 text-sm font-semibold text-text-secondary">
                  Rank
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-text-secondary">
                  Player
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-text-secondary hidden sm:table-cell">
                  Tier
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary">
                  Rating
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary hidden md:table-cell">
                  W/L
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-text-secondary hidden lg:table-cell">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((player, index) => {
                const rank = getRankFromRating(player.rating);
                return (
                  <tr
                    key={player.username}
                    className={cn(
                      "border-b border-board-grid/50 last:border-0",
                      "hover:bg-board-grid/30 transition-colors",
                    )}
                  >
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "font-semibold",
                          player.rank === 1 && "text-yellow-500",
                          player.rank === 2 && "text-gray-400",
                          player.rank === 3 && "text-amber-600",
                        )}
                      >
                        #{player.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium">{player.username}</span>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <RankBadge
                        rank={rank.name}
                        color={rank.color}
                        size="sm"
                        showTooltip={false}
                      />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-semibold">
                        {player.rating}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      <span className="text-accent-success">{player.wins}</span>
                      <span className="text-text-muted mx-1">/</span>
                      <span className="text-accent-error">{player.losses}</span>
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      <span
                        className={cn(
                          player.winRate >= 70
                            ? "text-accent-success"
                            : player.winRate >= 50
                              ? "text-text-primary"
                              : "text-accent-error",
                        )}
                      >
                        {player.winRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rank Tiers Legend */}
        <div className="mt-8 p-6 rounded-xl bg-surface-elevated border border-board-grid">
          <h3 className="font-semibold mb-4">Rank Tiers</h3>
          <div className="flex flex-wrap gap-3">
            {RANKS.TIERS.map((tier) => (
              <div key={tier.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-sm text-text-secondary">
                  {tier.name} ({tier.minRating}+)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// Podium Card Component
function PodiumCard({
  player,
  position,
}: {
  player: (typeof mockLeaderboard)[0];
  position: 1 | 2 | 3;
}) {
  const rank = getRankFromRating(player.rating);
  const colors = {
    1: { bg: "bg-yellow-500/10", border: "border-yellow-500", medal: "🥇" },
    2: { bg: "bg-gray-400/10", border: "border-gray-400", medal: "🥈" },
    3: { bg: "bg-amber-600/10", border: "border-amber-600", medal: "🥉" },
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border-2 text-center",
        colors[position].bg,
        colors[position].border,
      )}
    >
      <div className="text-3xl mb-2">{colors[position].medal}</div>
      <h3 className="font-semibold text-sm sm:text-base truncate">
        {player.username}
      </h3>
      <div className="mt-2">
        <RankBadge
          rank={rank.name}
          color={rank.color}
          rating={player.rating}
          size="sm"
        />
      </div>
      <div className="mt-2 text-lg font-bold font-mono">{player.rating}</div>
    </div>
  );
}
