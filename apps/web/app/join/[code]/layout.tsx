import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/config";

type JoinLayoutProps = {
  params: { code: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase() ?? "";

  return buildPageMetadata({
    title: `Join Match ${code}`,
    description: `You've been invited to an Infinite Tic-Tac-Toe match! Use code ${code} to join — free online multiplayer, no download required.`,
    path: `/join/${params.code}`,
    ogType: "website",
  });
}

export default function JoinLayout({ children }: JoinLayoutProps) {
  return children;
}
