import { buildPageMetadata } from "@/lib/seo/metadata";
import { PUBLIC_ROUTES, SITE } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE.name} — how we handle account data, match history, and cookies.`,
  path: PUBLIC_ROUTES.privacy,
  noIndex: false,
});

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <article className="max-w-3xl mx-auto px-4 py-12 prose prose-invert">
        <h1 className="text-3xl font-display font-bold mb-6 text-text-primary">
          Privacy Policy
        </h1>
        <p className="text-text-secondary mb-6">
          Last updated: September 2026
        </p>

        <section className="space-y-6 text-text-secondary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Overview
            </h2>
            <p>
              {SITE.name} respects your privacy. This policy describes what
              information we collect when you use our free online game and how
              we use it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-primary">Account data</strong> —
                if you sign in, we store your display name, username, and OAuth
                provider identifier.
              </li>
              <li>
                <strong className="text-text-primary">Gameplay data</strong> —
                match results, ratings, replays, and leaderboard rankings.
              </li>
              <li>
                <strong className="text-text-primary">Technical data</strong> —
                browser type, IP address, and connection logs for security and
                performance.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              How We Use Your Data
            </h2>
            <p>
              We use collected data to operate matchmaking, maintain ratings
              and leaderboards, provide replays, prevent abuse, and improve the
              game experience. We do not sell personal data to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Cookies & Local Storage
            </h2>
            <p>
              We use cookies and local storage for authentication sessions,
              theme preferences, and anonymous player identifiers for guest
              play.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Contact
            </h2>
            <p>
              For privacy questions, contact us through the project repository
              issue tracker.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
