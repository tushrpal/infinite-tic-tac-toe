import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-4">
              <span className="text-playerX-primary">Infinite</span>
              <br />
              <span className="text-text-primary">Tic-Tac-Toe</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-lg mx-auto">
              The classic game, reimagined. Challenge players worldwide in
              competitive matches with unique game modes.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href={ROUTES.PLAY}>
              <Button size="lg" className="w-full sm:w-auto min-w-[200px]">
                Play Now
              </Button>
            </Link>
            <Link href={ROUTES.LEADERBOARD}>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
              >
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<GameModeIcon />}
              title="Multiple Modes"
              description="Sliding mode where marks disappear, or Expanding mode with growing boards"
            />
            <FeatureCard
              icon={<OnlineIcon />}
              title="Online PvP"
              description="Real-time matches against players worldwide with WebSocket technology"
            />
            <FeatureCard
              icon={<RankedIcon />}
              title="Ranked Play"
              description="Climb the ladder, earn ranks, and compete for the top spots"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-board-grid">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            © 2026 Infinite Tic-Tac-Toe. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href={"/about" as Route}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href={"/privacy" as Route}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href={"/terms" as Route}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-colors">
      <div className="w-12 h-12 mb-4 mx-auto flex items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

// Icons
function GameModeIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function RankedIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  );
}
