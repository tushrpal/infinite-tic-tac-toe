import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "Play - Infinite Tic-Tac-Toe",
  description: "Choose your game mode and start playing",
};

export default function PlayPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href={ROUTES.HOME}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-display font-bold mb-4">
            Select Game Mode
          </h1>
          <p className="text-text-secondary">Choose how you want to play</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid gap-6">
          {/* Local Play */}
          <GameModeCard
            href={ROUTES.PLAY_LOCAL}
            title="Local Play"
            description="Play against a friend on the same device or practice against AI"
            icon={<LocalIcon />}
            badge="Offline"
          />

          {/* Online Quick Play */}
          <GameModeCard
            href={ROUTES.PLAY_ONLINE}
            title="Online Quick Play"
            description="Jump into a casual match against a random opponent"
            icon={<OnlineIcon />}
            badge="Online"
            badgeColor="text-accent-success"
          />

          {/* Ranked */}
          <GameModeCard
            href={ROUTES.PLAY_RANKED}
            title="Ranked Match"
            description="Compete for ranking points and climb the leaderboard"
            icon={<RankedIcon />}
            badge="Competitive"
            badgeColor="text-accent-warning"
          />
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 rounded-xl bg-surface-elevated border border-board-grid">
          <h3 className="font-semibold mb-3">Game Modes Available</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-playerX-primary font-semibold">
                Mode 1 - Classic
              </span>
              <p className="text-text-secondary mt-1">
                Standard Tic-Tac-Toe. First to get 3 in a row wins.
              </p>
            </div>
            <div>
              <span className="text-playerO-primary font-semibold">
                Mode 2 - Sliding
              </span>
              <p className="text-text-secondary mt-1">
                After 3 marks each, your oldest mark disappears when you play.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Game Mode Card Component
function GameModeCard({
  href,
  title,
  description,
  icon,
  badge,
  badgeColor = "text-text-muted",
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Link href={href as any} className="block group">
      <div className="flex items-center gap-6 p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-all hover:shadow-lg hover:shadow-accent-primary/5">
        {/* Icon */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold group-hover:text-accent-primary transition-colors">
              {title}
            </h2>
            {badge && (
              <span className={`text-xs font-medium ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all">
          <ArrowIcon />
        </div>
      </div>
    </Link>
  );
}

// Icons
function LocalIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function RankedIcon() {
  return (
    <svg
      className="w-8 h-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
