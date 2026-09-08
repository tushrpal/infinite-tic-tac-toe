import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ANSWER_SNIPPETS, KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES, SITE } from "@/lib/seo/config";
import { ROUTES } from "@/lib/constants";

export const metadata = buildPageMetadata({
  title: "About",
  description: `${SITE.name} — ${ANSWER_SNIPPETS.whatIsIt}`,
  path: PUBLIC_ROUTES.about,
  keywords: [...KEYWORD_CLUSTERS.branded, ...KEYWORD_CLUSTERS.primary],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: PUBLIC_ROUTES.home },
          { name: "About", path: PUBLIC_ROUTES.about },
        ])}
      />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <header className="mb-10">
            <h1 className="text-4xl font-display font-bold mb-4">
              About {SITE.name}
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              {ANSWER_SNIPPETS.whatIsIt}
            </p>
          </header>

          <section className="space-y-8 text-text-secondary">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Game Modes
              </h2>
              <p className="mb-3">{ANSWER_SNIPPETS.gameModes}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-text-primary">Sliding Mode</strong> —
                  dynamic 3×3 board where marks disappear after three
                  placements per player. No draws possible.
                </li>
                <li>
                  <strong className="text-text-primary">Expanding Mode</strong>{" "}
                  — round-based play on boards that grow from 3×3 to 5×5 each
                  round.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Competitive Play
              </h2>
              <p>{ANSWER_SNIPPETS.rankedSystem}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Free to Play
              </h2>
              <p>{ANSWER_SNIPPETS.isFree}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Features
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Real-time online multiplayer</li>
                <li>Ranked Elo matchmaking and global leaderboard</li>
                <li>AI practice bots with adjustable difficulty</li>
                <li>Friend challenges and private room invites</li>
                <li>Match replays and live spectating</li>
                <li>Progressive Web App — works on desktop and mobile</li>
              </ul>
            </div>
          </section>

          <footer className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link href={ROUTES.PLAY}>
              <Button size="lg">Start Playing</Button>
            </Link>
            <Link href={ROUTES.HOW_TO_PLAY}>
              <Button variant="secondary" size="lg">
                How to Play
              </Button>
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}
