import { SITE, getSiteUrl, PUBLIC_ROUTES, SOCIAL_PROFILES } from "./config";
import {
  ANSWER_SNIPPETS,
  ENTITY_DEFINITION,
  ENTITY_DISAMBIGUATION,
} from "./keywords";

type JsonLd = Record<string, unknown>;

function siteUrl(): string {
  return getSiteUrl();
}

/** Organization + WebSite — establishes entity for search and AI engines. */
export function organizationSchema(): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: SITE.name,
    alternateName: [SITE.shortName, "Infinite TTT", "infinite-ttt"],
    url,
    logo: `${url}/web-app-manifest-512x512.png`,
    description: ENTITY_DEFINITION,
    disambiguatingDescription: ENTITY_DISAMBIGUATION,
    // Omitted entirely while empty: an empty array is a positive claim that the
    // entity has no other presence, which is not what we mean.
    ...(SOCIAL_PROFILES.length > 0 ? { sameAs: [...SOCIAL_PROFILES] } : {}),
  };
}

export function webSiteSchema(): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": `${url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}${PUBLIC_ROUTES.leaderboard}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** WebApplication / VideoGame hybrid for app-store-style discovery. */
export function webApplicationSchema(): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "VideoGame"],
    "@id": `${url}/#application`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url,
    description: ENTITY_DEFINITION,
    disambiguatingDescription: ENTITY_DISAMBIGUATION,
    applicationCategory: SITE.applicationCategory,
    operatingSystem: SITE.operatingSystem,
    browserRequirements: "Requires JavaScript. Works in all modern browsers.",
    offers: {
      "@type": "Offer",
      price: SITE.price,
      priceCurrency: SITE.priceCurrency,
    },
    featureList: [
      "Sliding Mode — dynamic 3×3 board with disappearing marks",
      "Expanding Mode — growing board from 3×3 to 5×5",
      "Ranked Elo matchmaking and global leaderboard",
      "Online multiplayer with real-time WebSocket play",
      "AI practice bots with adjustable difficulty",
      "Friend challenges and private room invites",
      "Match replays and live spectating",
      "Progressive Web App — installable, no download",
    ],
    genre: ["Board Game", "Strategy", "Multiplayer"],
    playMode: ["MultiPlayer", "SinglePlayer", "CoOp"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 2,
    },
    inLanguage: SITE.language,
    isAccessibleForFree: true,
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage for a specific route.
 *
 * `path` matters: this previously hardcoded the `@id` to /how-to-play#faq, so
 * the homepage's FAQ and the tutorial's FAQ published the same `@id` — two
 * different node contents claiming one identifier, which is a structured-data
 * conflict. Each page's FAQ now gets its own node.
 */
export function faqPageSchema(
  items: FaqItem[],
  path: string = PUBLIC_ROUTES.howToPlay
): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}${path}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** HowTo schema for tutorial page — strong AEO signal. */
export function howToPlaySchema(): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}${PUBLIC_ROUTES.howToPlay}#howto`,
    name: "How to Play Infinite Tic-Tac-Toe",
    description: ANSWER_SNIPPETS.howToPlay,
    inLanguage: SITE.language,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Choose a game mode",
        text: "Select Sliding Mode for a dynamic 3×3 board, or Expanding Mode for round-based play on growing boards.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Find an opponent",
        text: "Play ranked or casual online matches, challenge a friend, practice against AI bots, or play with a friend on the same device.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Take turns placing marks",
        text: "Alternate placing X or O on empty cells. In Sliding mode, your oldest mark disappears after you have three on the board.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Win the match",
        text: "Get three (or N) marks in a row horizontally, vertically, or diagonally before your opponent.",
      },
    ],
  };
}

export interface LeaderboardEntrySchema {
  username: string;
  name: string;
  rating: number;
}

/**
 * ItemList for the global leaderboard.
 *
 * This is the only genuinely unique, first-party dataset on the site — live
 * ranked standings a competitor can't replicate — and it was previously
 * unmarked, so search and answer engines had no structured view of it.
 *
 * Capped deliberately: Google only reads the leading items of a long list, and
 * emitting all 50 mostly adds page weight. Players are `Person` with only a
 * display name, never an email or id, so nothing identifying leaks into markup.
 */
export function leaderboardSchema(
  entries: LeaderboardEntrySchema[],
  limit = 20
): JsonLd {
  const url = siteUrl();
  const top = entries.slice(0, limit);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}${PUBLIC_ROUTES.leaderboard}#itemlist`,
    name: `${SITE.name} Global Leaderboard`,
    description:
      "Top ranked Infinite Tic-Tac-Toe players by Elo rating across Sliding and Expanding modes.",
    url: `${url}${PUBLIC_ROUTES.leaderboard}`,
    inLanguage: SITE.language,
    numberOfItems: top.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: top.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name || entry.username,
      item: {
        "@type": "Person",
        name: entry.name || entry.username,
        alternateName: entry.username,
      },
    })),
  };
}

/** BreadcrumbList for inner pages. */
export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>
): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${url}${item.path}`,
    })),
  };
}

/** All global schemas injected on every page. */
export function globalSchemas(): JsonLd[] {
  return [organizationSchema(), webSiteSchema(), webApplicationSchema()];
}
