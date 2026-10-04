import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { SLIDING_GUIDE } from "@/lib/seo/guideContent";
import { GuideArticle } from "@/components/guides/GuideArticle";

export const metadata = buildPageMetadata({
  title: SLIDING_GUIDE.title,
  description: SLIDING_GUIDE.description,
  path: SLIDING_GUIDE.path,
  keywords: [...KEYWORD_CLUSTERS.modes, ...KEYWORD_CLUSTERS.learning],
});

export default function SlidingGuidePage() {
  return <GuideArticle guide={SLIDING_GUIDE} />;
}
