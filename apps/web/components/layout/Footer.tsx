import Link from "next/link";
import type { Route } from "next";
import { PUBLIC_ROUTES, SITE } from "@/lib/seo/config";

/**
 * Sitewide footer.
 *
 * Before this existed, only the homepage had a footer (About / Privacy /
 * Terms) and every other page ended with nothing — which meant /how-to-play,
 * the site's one substantial content page, was reachable only from the top
 * nav, and the five /play/* routes linked to the rules from nowhere. This is
 * the cheapest way to give the site a real internal link graph.
 *
 * Deliberately a server component: it is pure links, so there is no reason to
 * ship it as client JS on every route.
 */

type FooterLink = { href: string; label: string };

const COLUMNS: Array<{ heading: string; links: readonly FooterLink[] }> = [
  {
    heading: "Play",
    links: [
      { href: PUBLIC_ROUTES.playRanked, label: "Ranked Match" },
      { href: PUBLIC_ROUTES.playOnline, label: "Quick Play" },
      { href: PUBLIC_ROUTES.playPractice, label: "Practice vs AI" },
      { href: PUBLIC_ROUTES.playRooms, label: "Private Rooms" },
      { href: PUBLIC_ROUTES.playLocal, label: "Local 2-Player" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: PUBLIC_ROUTES.howToPlay, label: "How to Play" },
      { href: PUBLIC_ROUTES.leaderboard, label: "Leaderboard" },
      { href: PUBLIC_ROUTES.about, label: "About the Game" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: PUBLIC_ROUTES.privacy, label: "Privacy Policy" },
      { href: PUBLIC_ROUTES.terms, label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-surface-base/60 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link
              href={PUBLIC_ROUTES.home as Route}
              className="font-display text-lg font-bold text-text-primary transition-colors hover:text-accent-primary"
            >
              {SITE.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
              {SITE.tagline}. Two modes that make draws impossible — free in
              your browser, no download.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-labelledby={`footer-${column.heading}`}>
              <h2
                id={`footer-${column.heading}`}
                className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted"
              >
                {column.heading}
              </h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as Route}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-white/5 pt-6">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
