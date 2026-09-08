import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ANSWER_SNIPPETS, KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { ROUTES } from "@/lib/constants";
import { ShareButtons } from "@/components/share/ShareButtons";

const SITE_DESCRIPTION =
  "Play Infinite Tic-Tac-Toe online for free. Multiplayer Sliding & Expanding modes, ranked matchmaking, AI bots, and friend challenges — no download required.";

export const metadata = buildPageMetadata({
  title: "Infinite Tic-Tac-Toe — Play Online Free",
  description: SITE_DESCRIPTION,
  path: PUBLIC_ROUTES.home,
  keywords: [
    ...KEYWORD_CLUSTERS.primary,
    ...KEYWORD_CLUSTERS.modes,
    ...KEYWORD_CLUSTERS.platform,
  ],
});

const HOME_FAQ = [
  {
    question: "What is Infinite Tic-Tac-Toe?",
    answer: ANSWER_SNIPPETS.whatIsIt,
  },
  {
    question: "Is Infinite Tic-Tac-Toe free to play?",
    answer: ANSWER_SNIPPETS.isFree,
  },
  {
    question: "How is Sliding mode different from regular tic-tac-toe?",
    answer:
      "In Sliding mode, each player can only have 3 marks on the board at once. When you place a 4th mark, your oldest mark disappears. This prevents draws and creates dynamic, fast-paced games.",
  },
  {
    question: "Can I play tic-tac-toe online with friends?",
    answer:
      "Yes. Create a private room, share an invite link, or challenge friends directly from your friends list. You can also play ranked or casual matches against random opponents worldwide.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqPageSchema(HOME_FAQ)} />
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
              Play tic-tac-toe online free with unique Sliding and Expanding
              modes. Challenge players worldwide in ranked multiplayer matches.
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

      {/* SEO / AEO content section */}
      <section
        aria-labelledby="about-game-heading"
        className="px-4 py-16 border-t border-board-grid bg-surface-elevated/30"
      >
        <div className="max-w-3xl mx-auto">
          <h2
            id="about-game-heading"
            className="text-2xl font-display font-bold mb-4 text-center"
          >
            Free Online Multiplayer Tic-Tac-Toe
          </h2>
          <p className="text-text-secondary text-center mb-10 leading-relaxed">
            {ANSWER_SNIPPETS.whatIsIt}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-5 rounded-xl border border-board-grid">
              <h3 className="font-semibold mb-2">Sliding Mode</h3>
              <p className="text-sm text-text-secondary">
                Dynamic 3×3 board — marks slide off after three placements.
                No draws, ever.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-board-grid">
              <h3 className="font-semibold mb-2">Expanding Mode</h3>
              <p className="text-sm text-text-secondary">
                Board grows each round from 3×3 to 5×5. Win N-in-a-row on an
                N×N board.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {HOME_FAQ.map((item) => (
              <div
                key={item.question}
                className="p-4 rounded-xl border border-board-grid"
              >
                <dt className="font-medium text-text-primary mb-1">
                  {item.question}
                </dt>
                <dd className="text-sm text-text-secondary">{item.answer}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 pt-8 border-t border-board-grid">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Love the game? Share it!
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Help friends discover Infinite Tic-Tac-Toe — post it to your feed.
            </p>
            <ShareButtons campaign="homepage" variant="full" />
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
    </>
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
