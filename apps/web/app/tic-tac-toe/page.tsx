import { buildPageMetadata } from "@/lib/seo/metadata";
import { KEYWORD_CLUSTERS } from "@/lib/seo/keywords";
import { TIC_TAC_TOE_GUIDE } from "@/lib/seo/guideContent";
import { GuideArticle } from "@/components/guides/GuideArticle";
import { ClassicBoard } from "@/components/guides/ClassicBoard";

export const metadata = buildPageMetadata({
  title: TIC_TAC_TOE_GUIDE.title,
  description: TIC_TAC_TOE_GUIDE.description,
  path: TIC_TAC_TOE_GUIDE.path,
  keywords: [...KEYWORD_CLUSTERS.primary, ...KEYWORD_CLUSTERS.learning],
});

export default function TicTacToePage() {
  return (
    <GuideArticle guide={TIC_TAC_TOE_GUIDE}>
      <ClassicBoard />
    </GuideArticle>
  );
}
