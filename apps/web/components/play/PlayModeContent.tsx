import Link from "next/link";
import type { Route } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/json-ld";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import type { PlayModeContent as Content } from "@/lib/seo/playModeContent";

/**
 * Indexable content section for a /play/* route, rendered below the
 * interactive widget from the route's layout.
 *
 * Server component by design: this is static prose and links, so there is no
 * reason to ship it as client JS on top of the game screens, which already
 * carry the heaviest bundles on the site.
 */
export function PlayModeContent({
  content,
  path,
  title,
  breadcrumbLabel,
}: {
  content: Content;
  path: string;
  /** The <h2> that opens the section. Distinct per route. */
  title: string;
  breadcrumbLabel: string;
}) {
  return (
    <>
      <JsonLd
        data={[
          faqPageSchema(content.faq, path),
          breadcrumbSchema([
            { name: "Home", path: PUBLIC_ROUTES.home },
            { name: "Play", path: PUBLIC_ROUTES.play },
            { name: breadcrumbLabel, path },
          ]),
        ]}
      />

      <section
        aria-labelledby="mode-content-heading"
        className="border-t border-white/5 px-4 py-14"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="mode-content-heading"
            className="mb-4 font-display text-2xl font-bold text-text-primary"
          >
            {title}
          </h2>

          {/* Answer-first lead: answer engines extract the opening paragraph. */}
          <p className="mb-10 leading-relaxed text-text-secondary">
            {content.lead}
          </p>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="mb-2 font-semibold text-text-primary">
                  {section.heading}
                </h3>
                <p className="leading-relaxed text-text-secondary">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <h3 className="mb-4 mt-12 font-semibold text-text-primary">
            Frequently asked questions
          </h3>
          <dl className="space-y-4">
            {content.faq.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-white/5 bg-surface-elevated/40 p-4"
              >
                <dt className="mb-1 font-medium text-text-primary">
                  {item.question}
                </dt>
                <dd className="text-sm leading-relaxed text-text-secondary">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>

          <nav
            aria-label="Related pages"
            className="mt-12 border-t border-white/5 pt-6"
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {content.related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as Route}
                    className="text-accent-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}
