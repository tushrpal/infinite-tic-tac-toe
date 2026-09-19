"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ROUTES, RANKS } from "@/lib/constants";
import { cn, getRankFromRating } from "@/lib/helpers";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useFriends } from "@/components/providers/FriendsProvider";
import { FriendsPanel } from "@/components/friends/FriendsPanel";
import { Modal } from "@/components/ui/Modal";
import { RankEmblem } from "@/components/ui/RankEmblem";
import { InfinityMark } from "@/components/ui/InfinityMark";
import { logout } from "@/lib/player";

const NAV_LINKS = [
  { href: ROUTES.PLAY, label: "Play" },
  { href: ROUTES.LEADERBOARD, label: "Leaderboard" },
  { href: ROUTES.HOW_TO_PLAY, label: "How to Play" },
  { href: ROUTES.PROFILE, label: "Profile" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const { player } = usePlayer();
  const { receivedRequests } = useFriends();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);

  // Highlight the section, not just the exact page (e.g. /play/ranked -> Play).
  const isActive = (path: string) =>
    path === ROUTES.HOME ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const displayName = player ? player.displayName || player.username || "Player" : "";
  const bestRating = player
    ? Math.max(player.ratingMode1 ?? 0, player.ratingMode2 ?? 0) || RANKS.DEFAULT_RATING
    : RANKS.DEFAULT_RATING;
  const rank = getRankFromRating(bestRating);

  return (
    <>
      <nav className="space-scope border-b border-white/5 sticky top-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl"
              onClick={closeMobileMenu}
            >
              <InfinityMark className="w-7 h-4 text-playerO-primary" />
              <span className="text-text-primary">
                Infinite <span className="text-accent-primary">TTT</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 items-center justify-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-accent-primary/20 text-text-primary shadow-[inset_0_0_0_1px_rgba(168,85,247,0.45)]"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {/* Friends Button */}
              {player && (
                <button
                  onClick={() => setIsFriendsPanelOpen(true)}
                  className="relative p-2 rounded-lg transition-colors text-text-secondary hover:text-text-primary hover:bg-white/5"
                  aria-label="Friends"
                >
                  <UsersIcon />
                  {receivedRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-critical text-white text-xs font-semibold rounded-full flex items-center justify-center">
                      {receivedRequests.length}
                    </span>
                  )}
                </button>
              )}

              {/* Desktop User Chip */}
              {player && (
                <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border border-white/10 bg-white/5">
                  <Link
                    href={ROUTES.PROFILE}
                    className="flex items-center gap-2.5 min-w-0"
                    aria-label="Open profile"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-playerO-primary text-sm font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block max-w-[8rem] truncate text-sm font-semibold text-text-primary">
                        {displayName}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: rank.color }}
                      >
                        <RankEmblem rank={rank.name} size={14} />
                        {rank.name}
                      </span>
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-full px-2 py-1 text-xs font-medium text-text-secondary hover:text-accent-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? "…" : "Logout"}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden no-touch-target p-2 rounded-lg text-text-primary hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* Mobile Menu — overlay drawer */}
          {isMobileMenuOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 top-[57px] bg-surface-overlay z-40"
                onClick={closeMobileMenu}
                aria-hidden="true"
              />
              <div className="md:hidden relative z-50 mt-4 pb-4 border-t border-white/10 pt-4 animate-slide-in">
                <div className="flex flex-col gap-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                        isActive(link.href)
                          ? "bg-accent-primary/20 text-text-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Friends Button - Mobile */}
                  {player && (
                    <button
                      onClick={() => {
                        setIsFriendsPanelOpen(true);
                        closeMobileMenu();
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-left text-text-secondary transition-colors hover:text-text-primary hover:bg-white/5"
                    >
                      <UsersIcon />
                      <span>Friends</span>
                      {receivedRequests.length > 0 && (
                        <span className="ml-auto w-5 h-5 bg-critical text-white text-xs font-semibold rounded-full flex items-center justify-center">
                          {receivedRequests.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Mobile User Info */}
                  {player && (
                    <div className="pt-4 mt-2 border-t border-white/10">
                      <div className="flex items-center gap-3 px-3 mb-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-playerO-primary text-sm font-bold text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                        <div className="text-sm">
                          <div className="font-medium text-text-primary">{displayName}</div>
                          <div className="text-xs" style={{ color: rank.color }}>
                            {rank.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left rounded-lg px-3 py-2.5 text-base font-medium text-text-secondary hover:text-accent-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Friends Panel Modal */}
        <Modal
          isOpen={isFriendsPanelOpen}
          onClose={() => setIsFriendsPanelOpen(false)}
          size="lg"
          showCloseButton={false}
        >
          <FriendsPanel onClose={() => setIsFriendsPanelOpen(false)} />
        </Modal>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="space-scope md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 safe-bottom">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive(tab.href) ? "page" : undefined}
              className={cn(
                "no-touch-target flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                isActive(tab.href) ? "text-accent-primary" : "text-text-secondary",
              )}
            >
              <TabIcon d={tab.icon} />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

const TABS = [
  { href: ROUTES.HOME, label: "Home", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  {
    href: ROUTES.PLAY,
    label: "Play",
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    href: ROUTES.LEADERBOARD,
    label: "Ranks",
    icon: "M8 21h8m-4-4v4m-5-18h10v6a5 5 0 01-10 0V3zm10 2h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3",
  },
  { href: ROUTES.PROFILE, label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" },
] as const;

function TabIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
