import { SITE, getSiteUrl, PUBLIC_ROUTES } from "./config";
import { ANSWER_SNIPPETS, ENTITY_DEFINITION } from "./keywords";

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
    sameAs: [],
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

export function faqPageSchema(items: FaqItem[]): JsonLd {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}${PUBLIC_ROUTES.howToPlay}#faq`,
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
        text: "Play ranked or casual online matches, challenge a friend, practice against AI bots, or play locally on the same device.",
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
