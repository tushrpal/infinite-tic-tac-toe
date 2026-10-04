import Link from "next/link";
import type { Route } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { GUIDE_HUB, GUIDES } from "@/lib/seo/guideContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/json-ld";
import { PUBLIC_ROUTES } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: GUIDE_HUB.title,
  description: GUIDE_HUB.description,
  path: GUIDE_HUB.path,
  keywords: [...KEYWORD_CLUSTERS.learning, ...KEYWORD_CLUSTERS.modes],
});

export default function GuidesHubPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: PUBLIC_ROUTES.home },
          { name: "Guides", path: GUIDE_HUB.path },
        ])}
      />
      <h1 className="mb-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
        Tic-Tac-Toe Guides
      </h1>
      <p className="mb-10 text-lg leading-relaxed text-text-secondary">
        Rules and strategy for the two modes in Infinite Tic-Tac-Toe. Each guide answers one question about how the
        mode works.
      </p>
      <ul className="space-y-4">
        {GUIDES.map((guide) => (
          <li key={guide.path} className="rounded-2xl border border-white/5 bg-surface-elevated/40 p-5">
            <h2 className="mb-2 font-display text-xl font-bold text-text-primary">
              <Link href={guide.path as Route} className="hover:underline">
                {guide.title}
              </Link>
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">{guide.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
