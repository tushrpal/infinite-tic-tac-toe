import { describe, it, expect } from 'vitest';
import {
  faqPageSchema,
  leaderboardSchema,
  breadcrumbSchema,
  organizationSchema,
} from '../json-ld';
import { PLAY_MODE_CONTENT } from '../playModeContent';
import {
  PUBLIC_ROUTES,
  NOINDEX_ROUTES,
  CRAWLER_DISALLOW,
  SOCIAL_PROFILES,
  SITE,
} from '../config';

/**
 * Guards for the structured-data and content invariants that are easy to break
 * by accident and expensive to notice — a bad `@id` or a thin play page only
 * shows up weeks later in Search Console.
 */

describe('faqPageSchema', () => {
  it('scopes @id to the page the FAQ is on', () => {
    // Regression: this used to hardcode /how-to-play#faq, so the homepage FAQ
    // and the tutorial FAQ published the same @id with different contents.
    const home = faqPageSchema([{ question: 'q', answer: 'a' }], PUBLIC_ROUTES.home);
    const ranked = faqPageSchema([{ question: 'q', answer: 'a' }], PUBLIC_ROUTES.playRanked);

    expect(home['@id']).not.toBe(ranked['@id']);
    expect(String(ranked['@id'])).toContain(PUBLIC_ROUTES.playRanked);
  });

  it('emits one Question per item', () => {
    const schema = faqPageSchema([
      { question: 'one', answer: 'a' },
      { question: 'two', answer: 'b' },
    ]);
    expect(schema.mainEntity).toHaveLength(2);
  });
});

describe('leaderboardSchema', () => {
  const players = Array.from({ length: 50 }, (_, i) => ({
    username: `player${i}`,
    name: `Player ${i}`,
    rating: 2000 - i,
  }));

  it('caps the list rather than emitting every row', () => {
    const schema = leaderboardSchema(players);
    expect(schema.itemListElement).toHaveLength(20);
    expect(schema.numberOfItems).toBe(20);
  });

  it('numbers positions from 1 in descending rating order', () => {
    const items = leaderboardSchema(players, 3).itemListElement as Array<{
      position: number;
      name: string;
    }>;
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[0].name).toBe('Player 0');
  });

  it('falls back to username when a display name is empty', () => {
    const items = leaderboardSchema(
      [{ username: 'anon7', name: '', rating: 900 }],
      1
    ).itemListElement as Array<{ name: string }>;
    expect(items[0].name).toBe('anon7');
  });

  it('never puts an internal player id in the markup', () => {
    // Players are marked up as Person by display name only. Leaking playerId
    // into public structured data would expose an internal identifier.
    const serialized = JSON.stringify(
      leaderboardSchema([{ username: 'a', name: 'A', rating: 1 }])
    );
    expect(serialized).not.toContain('playerId');
  });
});

describe('breadcrumbSchema', () => {
  it('numbers positions from 1', () => {
    const items = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Play', path: '/play' },
    ]).itemListElement as Array<{ position: number }>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
  });
});

describe('play mode content', () => {
  const entries = Object.entries(PLAY_MODE_CONTENT);

  it('covers every indexable /play/* route', () => {
    expect(Object.keys(PLAY_MODE_CONTENT).sort()).toEqual([
      'local',
      'online',
      'practice',
      'ranked',
      'rooms',
    ]);
  });

  it.each(entries)('%s has enough substance to be worth indexing', (_key, content) => {
    // These routes were previously thin content: one h1 and a widget. The
    // thresholds are deliberately low-bar — they catch a page regressing back
    // to a stub, not a page being merely short.
    expect(content.sections.length).toBeGreaterThanOrEqual(3);
    expect(content.faq.length).toBeGreaterThanOrEqual(3);
    expect(content.related.length).toBeGreaterThanOrEqual(2);

    const words = [
      content.lead,
      ...content.sections.map((s) => s.body),
      ...content.faq.map((f) => f.answer),
    ]
      .join(' ')
      .split(/\s+/).length;
    expect(words).toBeGreaterThan(300);
  });

  it('gives each route distinct copy', () => {
    // The point of the content is that each page answers a different
    // question. Identical leads would mean five near-duplicate pages again.
    const leads = entries.map(([, c]) => c.lead);
    expect(new Set(leads).size).toBe(leads.length);
  });

  it('only links to indexable routes', () => {
    const indexable = new Set<string>(Object.values(PUBLIC_ROUTES));
    for (const [, content] of entries) {
      for (const link of content.related) {
        expect(indexable.has(link.href)).toBe(true);
      }
    }
  });
});

describe('entity graph', () => {
  it('omits sameAs entirely rather than emitting an empty array', () => {
    // An empty array is a positive claim that the entity has no other
    // presence. Absence is the honest encoding of "we have none listed".
    const schema = organizationSchema();
    if (SOCIAL_PROFILES.length === 0) {
      expect(schema).not.toHaveProperty('sameAs');
    } else {
      expect(schema.sameAs).toEqual([...SOCIAL_PROFILES]);
    }
  });

  it('only lists absolute https profile URLs', () => {
    // These are corroboration anchors for generative engines. A relative or
    // malformed URL resolves to nothing and is worse than omitting it.
    for (const url of SOCIAL_PROFILES) {
      expect(() => new URL(url)).not.toThrow();
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('keeps the Twitter handle consistent with the listed X profile', () => {
    // Regression: the site published twitter:site="@InfiniteTTT" for an
    // account that did not exist. If an X profile is listed in SOCIAL_PROFILES,
    // the handle metadata must match it.
    const xProfile = SOCIAL_PROFILES.find((u) => /(^|\.)x\.com\//.test(u));
    if (!xProfile) return;
    const handle = new URL(xProfile).pathname.replace(/^\//, '');
    expect(SITE.twitterHandle.toLowerCase()).toBe(`@${handle.toLowerCase()}`);
  });
});

describe('crawler disallow list', () => {
  it('stays in sync with the noindex routes', () => {
    // robots.ts builds its rules from this, so a route added to NOINDEX_ROUTES
    // can't silently stay crawlable.
    for (const route of NOINDEX_ROUTES) {
      expect(CRAWLER_DISALLOW).toContain(route);
    }
    expect(CRAWLER_DISALLOW).toContain('/api/');
  });

  it('does not disallow anything that is in the sitemap', () => {
    for (const path of Object.values(PUBLIC_ROUTES)) {
      const blocked = CRAWLER_DISALLOW.some(
        (rule) => path === rule || path.startsWith(rule)
      );
      expect(blocked, `${path} is both indexable and disallowed`).toBe(false);
    }
  });
});
