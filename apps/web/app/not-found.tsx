import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

/**
 * Custom 404. Next's default ("404: This page could not be found.") is a dead
 * end with no navigation, which wastes every broken inbound link and every
 * expired /join/{code} share. Next still serves this with a 404 status and a
 * `noindex` robots tag, so the only thing changing is the recovery path.
 */
export default function NotFound() {
  return (
    <main className="space-scope flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.35em] text-text-muted">
        404
      </p>

      <h1 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
        This square is empty
      </h1>

      <p className="mt-4 max-w-md text-text-secondary">
        The page you were looking for doesn&apos;t exist. If you followed a
        match or room invite link, it may have expired — those are only valid
        while the game is live.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={ROUTES.PLAY}>
          <Button size="lg">Play a Match</Button>
        </Link>
        <Link href={ROUTES.HOME}>
          <Button variant="secondary" size="lg">
            Back Home
          </Button>
        </Link>
      </div>

      <nav
        aria-label="Popular pages"
        className="mt-12 border-t border-white/5 pt-8"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-muted">
          Or try one of these
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {RECOVERY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href as Route}
                className="text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

const RECOVERY_LINKS = [
  { href: PUBLIC_ROUTES.playRanked, label: "Ranked Match" },
  { href: PUBLIC_ROUTES.playOnline, label: "Quick Play" },
  { href: PUBLIC_ROUTES.playPractice, label: "Practice vs AI" },
  { href: PUBLIC_ROUTES.playRooms, label: "Private Rooms" },
  { href: PUBLIC_ROUTES.leaderboard, label: "Leaderboard" },
  { href: PUBLIC_ROUTES.howToPlay, label: "How to Play" },
  { href: PUBLIC_ROUTES.about, label: "About" },
] as const;
