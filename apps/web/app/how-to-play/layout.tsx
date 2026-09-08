import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema, howToPlaySchema, breadcrumbSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { PUBLIC_ROUTES } from "@/lib/seo/config";
import { faq } from "@/lib/tutorialContent";

export const metadata = buildPageMetadata({
  title: "How to Play",
  description:
    "Learn how to play Infinite Tic-Tac-Toe — rules for Sliding and Expanding modes, winning strategies, and answers to common questions. Free online tutorial.",
  path: PUBLIC_ROUTES.howToPlay,
  keywords: [...KEYWORD_CLUSTERS.learning, ...KEYWORD_CLUSTERS.modes],
});

export default function HowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          howToPlaySchema(),
          faqPageSchema(faq),
          breadcrumbSchema([
            { name: "Home", path: PUBLIC_ROUTES.home },
            { name: "How to Play", path: PUBLIC_ROUTES.howToPlay },
          ]),
        ]}
      />
      {children}
    </>
  );
}
