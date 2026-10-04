import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { EXPANDING_GUIDE } from "@/lib/seo/guideContent";
import { GuideArticle } from "@/components/guides/GuideArticle";

export const metadata = buildPageMetadata({
  title: EXPANDING_GUIDE.title,
  description: EXPANDING_GUIDE.description,
  path: EXPANDING_GUIDE.path,
  keywords: [...KEYWORD_CLUSTERS.modes, ...KEYWORD_CLUSTERS.learning],
});

export default function ExpandingGuidePage() {
  return <GuideArticle guide={EXPANDING_GUIDE} />;
}
