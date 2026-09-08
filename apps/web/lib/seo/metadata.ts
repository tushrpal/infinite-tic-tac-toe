import type { Metadata } from "next";
import { SITE, getSiteUrl } from "./config";
import { ALL_KEYWORDS } from "./keywords";

export interface PageSeoOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
}

/** Build consistent Next.js Metadata for any public page. */
export function buildPageMetadata(options: PageSeoOptions): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = options.path ?? "/";
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const title = options.title.includes(SITE.name)
    ? options.title
    : `${options.title} | ${SITE.name}`;

  const metadata: Metadata = {
    title,
    description: options.description,
    keywords: [...(options.keywords ?? ALL_KEYWORDS)],
    authors: [{ name: `${SITE.name} Team`, url: siteUrl }],
    creator: SITE.name,
    publisher: SITE.name,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": `${siteUrl}/feed.xml`,
      },
    },
    openGraph: {
      title,
      description: options.description,
      url: canonicalUrl,
      siteName: SITE.name,
      locale: SITE.locale,
      type: options.ogType ?? "website",
      ...(options.ogImage
        ? {
            images: [
              {
                url: options.ogImage,
                width: 1200,
                height: 630,
                alt: `${SITE.name} — ${SITE.tagline}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: options.description,
      site: SITE.twitterHandle,
      creator: SITE.twitterHandle,
      ...(options.ogImage ? { images: [options.ogImage] } : {}),
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    category: SITE.category,
  };

  return metadata;
}

/** Default site-wide metadata for root layout. */
export function buildRootMetadata(): Metadata {
  return {
    ...buildPageMetadata({
      title: SITE.name,
      description: SITE.description,
      path: "/",
    }),
    applicationName: SITE.shortName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: SITE.shortName,
    },
    formatDetection: {
      telephone: false,
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}
