import Link from "next/link";
import type { Route } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/json-ld";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import type { GuideContent } from "@/lib/seo/guideContent";

/**
 * Server-rendered guide article. Static prose and links only, so it ships no
 * client JavaScript. Question-shaped <h2>s and an answer-first lead are the
 * AEO structure from docs/SEO_AEO_GEO_PLAN.md §3 Phase 3.
 */
export function GuideArticle({ guide, children }: { guide: GuideContent; children?: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          faqPageSchema(guide.faq, guide.path),
          breadcrumbSchema([
            { name: "Home", path: PUBLIC_ROUTES.home },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: guide.path },
          ]),
        ]}
      />

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-muted">
          <Link href={"/guides" as Route} className="hover:text-text-primary">
            Guides
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{guide.title}</span>
        </nav>

        <h1 className="mb-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
          {guide.title}
        </h1>

        {/* Answer-first lead: answer engines extract the opening paragraph. */}
        <p className="mb-10 text-lg leading-relaxed text-text-secondary">{guide.lead}</p>

        {children && <div className="mb-12">{children}</div>}

        <div className="space-y-10">
          {guide.sections.map((section, index) => (
            <section key={section.heading} aria-labelledby={`${guide.slug}-s${index}`}>
              <h2
                id={`${guide.slug}-s${index}`}
                className="mb-3 font-display text-xl font-bold text-text-primary sm:text-2xl"
              >
                {section.heading}
              </h2>
              <div className="space-y-3 leading-relaxed text-text-secondary">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="guide-faq" className="mt-14">
          <h2 id="guide-faq" className="mb-4 font-display text-xl font-bold text-text-primary sm:text-2xl">
            Frequently asked questions
          </h2>
          <dl className="space-y-4">
            {guide.faq.map((item) => (
              <div key={item.question} className="rounded-2xl border border-white/5 bg-surface-elevated/40 p-4">
                <dt className="mb-1 font-medium text-text-primary">{item.question}</dt>
                <dd className="text-sm leading-relaxed text-text-secondary">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav aria-label="Related pages" className="mt-12 border-t border-white/5 pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {guide.related.map((link) => (
              <li key={link.href}>
                <Link href={link.href as Route} className="text-accent-primary underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
