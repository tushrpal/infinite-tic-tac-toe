import { SITE, getSiteUrl } from "@/lib/seo/config";

export type ShareCampaign =
  | "homepage"
  | "match_win"
  | "match_invite"
  | "leaderboard"
  | "how_to_play"
  | "general";

export interface ShareOptions {
  /** Path or full URL to share. Defaults to homepage. */
  url?: string;
  title?: string;
  text?: string;
  campaign?: ShareCampaign;
  /** Override utm_source (e.g. twitter, whatsapp) */
  source?: string;
}

const DEFAULT_SHARE_TEXT =
  "Play Infinite Tic-Tac-Toe online for free — Sliding & Expanding modes, ranked matchmaking, and friend challenges. No download needed!";

/** Build a share URL with UTM tracking for feed attribution. */
export function buildShareUrl(options: ShareOptions = {}): string {
  const siteUrl = getSiteUrl();
  const rawUrl = options.url ?? siteUrl;
  const base = rawUrl.startsWith("http") ? rawUrl : `${siteUrl}${rawUrl}`;

  const url = new URL(base);
  url.searchParams.set("utm_source", options.source ?? "share");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", options.campaign ?? "general");

  return url.toString();
}

export function getDefaultShareTitle(): string {
  return `${SITE.name} — Free Online Multiplayer Tic-Tac-Toe`;
}

export function getDefaultShareText(): string {
  return DEFAULT_SHARE_TEXT;
}

/** Victory share copy for post-match feed posts. */
export function getMatchWinShareText(modeLabel?: string): string {
  const mode = modeLabel ? ` in ${modeLabel} mode` : "";
  return `I just won a match${mode} on Infinite Tic-Tac-Toe! 🏆 Think you can beat me? Play free:`;
}

/** Invite share copy for private match links. */
export function getInviteShareText(code: string): string {
  return `Join my Infinite Tic-Tac-Toe match! Code: ${code} — tap the link to play.`;
}

export interface SocialPlatform {
  id: string;
  label: string;
  /** Opens in a new window/tab */
  getShareHref: (url: string, text: string, title?: string) => string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "x",
    label: "Post on X",
    getShareHref: (url, text) =>
      `https://twitter.com/intent/tweet?${new URLSearchParams({
        text: `${text}\n${url}`,
      }).toString()}`,
  },
  {
    id: "whatsapp",
    label: "Share on WhatsApp",
    getShareHref: (url, text) =>
      `https://wa.me/?${new URLSearchParams({
        text: `${text} ${url}`,
      }).toString()}`,
  },
  {
    id: "facebook",
    label: "Share on Facebook",
    getShareHref: (url) =>
      `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({
        u: url,
      }).toString()}`,
  },
  {
    id: "reddit",
    label: "Post on Reddit",
    getShareHref: (url, text, title) =>
      `https://reddit.com/submit?${new URLSearchParams({
        url,
        title: title ?? text.slice(0, 280),
      }).toString()}`,
  },
  {
    id: "telegram",
    label: "Share on Telegram",
    getShareHref: (url, text) =>
      `https://t.me/share/url?${new URLSearchParams({
        url,
        text,
      }).toString()}`,
  },
  {
    id: "linkedin",
    label: "Share on LinkedIn",
    getShareHref: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({
        url,
      }).toString()}`,
  },
];

/** Native Web Share API when available; returns true if a share sheet opened. */
export async function nativeShare(options: ShareOptions): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;

  const url = buildShareUrl(options);
  const title = options.title ?? getDefaultShareTitle();
  const text = options.text ?? getDefaultShareText();

  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false;
  }
}

export async function copyShareLink(options: ShareOptions = {}): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(buildShareUrl(options));
    return true;
  } catch {
    return false;
  }
}
