import { buildPageMetadata } from "@/lib/seo/metadata";
import { PUBLIC_ROUTES, SITE } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${SITE.name} — rules for fair play, account use, and acceptable behavior.`,
  path: PUBLIC_ROUTES.terms,
});

export default function TermsPage() {
  return (
    <main className="flex-1">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold mb-6 text-text-primary">
          Terms of Service
        </h1>
        <p className="text-text-secondary mb-6">Last updated: September 2026</p>

        <section className="space-y-6 text-text-secondary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Acceptance
            </h2>
            <p>
              By using {SITE.name}, you agree to these terms. If you do not
              agree, please do not use the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Service Description
            </h2>
            <p>
              {SITE.name} is a free online multiplayer tic-tac-toe game
              provided as-is. We may update, modify, or discontinue features at
              any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Fair Play
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not use bots, scripts, or exploits in ranked matches.</li>
              <li>Do not harass, abuse, or impersonate other players.</li>
              <li>Do not attempt to disrupt the service or other users.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Accounts
            </h2>
            <p>
              You are responsible for activity on your account. We may suspend
              or terminate accounts that violate these terms or harm the
              community.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Limitation of Liability
            </h2>
            <p>
              {SITE.name} is provided without warranty. We are not liable for
              interruptions, data loss, or damages arising from use of the
              service.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
