"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useFriends } from "@/components/providers/FriendsProvider";
import { FriendsPanel } from "@/components/friends/FriendsPanel";
import { Modal } from "@/components/ui/Modal";
import { logout } from "@/lib/player";

export function Navigation() {
  const pathname = usePathname();
  const { player } = usePlayer();
  const { receivedRequests } = useFriends();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

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

  return (
    <nav className="border-b border-board-grid bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="font-display font-bold text-xl" onClick={closeMobileMenu}>
            <span className="text-playerX-primary">Infinite</span>
            <span className="text-text-primary"> TTT</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href={ROUTES.PLAY}
              className={cn(
                "text-sm font-medium transition-colors hover:text-text-primary",
                isActive(ROUTES.PLAY)
                  ? "text-text-primary"
                  : "text-text-secondary"
              )}
            >
              Play
            </Link>
            <Link
              href={ROUTES.LEADERBOARD}
              className={cn(
                "text-sm font-medium transition-colors hover:text-text-primary",
                isActive(ROUTES.LEADERBOARD)
                  ? "text-text-primary"
                  : "text-text-secondary"
              )}
            >
              Leaderboard
            </Link>
            <Link
              href={ROUTES.HOW_TO_PLAY}
              className={cn(
                "text-sm font-medium transition-colors hover:text-text-primary",
                isActive(ROUTES.HOW_TO_PLAY)
                  ? "text-text-primary"
                  : "text-text-secondary"
              )}
            >
              How to Play
            </Link>
            <Link
              href={ROUTES.PROFILE}
              className={cn(
                "text-sm font-medium transition-colors hover:text-text-primary",
                isActive(ROUTES.PROFILE)
                  ? "text-text-primary"
                  : "text-text-secondary"
              )}
            >
              Profile
            </Link>

            {/* Friends Button */}
            {player && (
              <button
                onClick={() => setIsFriendsPanelOpen(true)}
                className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  "text-text-secondary hover:text-text-primary hover:bg-board-grid"
                )}
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

            {/* Desktop User Info */}
            {player && (
              <div className="flex items-center gap-4 ml-2 pl-4 border-l border-board-grid">
                <div className="text-sm">
                  <div className="font-medium text-text-primary">
                    {player.displayName || player.username}
                  </div>
                  {player.displayName && (
                    <div className="text-xs text-text-muted">
                      @{player.username}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-sm font-medium text-text-secondary hover:text-accent-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-primary hover:bg-board-grid transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-board-grid pt-4 animate-slide-in">
            <div className="flex flex-col gap-4">
              <Link
                href={ROUTES.PLAY}
                onClick={closeMobileMenu}
                className={cn(
                  "text-base font-medium transition-colors hover:text-text-primary py-2",
                  isActive(ROUTES.PLAY)
                    ? "text-text-primary"
                    : "text-text-secondary"
                )}
              >
                Play
              </Link>
              <Link
                href={ROUTES.LEADERBOARD}
                onClick={closeMobileMenu}
                className={cn(
                  "text-base font-medium transition-colors hover:text-text-primary py-2",
                  isActive(ROUTES.LEADERBOARD)
                    ? "text-text-primary"
                    : "text-text-secondary"
                )}
              >
                Leaderboard
              </Link>
              <Link
                href={ROUTES.HOW_TO_PLAY}
                onClick={closeMobileMenu}
                className={cn(
                  "text-base font-medium transition-colors hover:text-text-primary py-2",
                  isActive(ROUTES.HOW_TO_PLAY)
                    ? "text-text-primary"
                    : "text-text-secondary"
                )}
              >
                How to Play
              </Link>
              <Link
                href={ROUTES.PROFILE}
                onClick={closeMobileMenu}
                className={cn(
                  "text-base font-medium transition-colors hover:text-text-primary py-2",
                  isActive(ROUTES.PROFILE)
                    ? "text-text-primary"
                    : "text-text-secondary"
                )}
              >
                Profile
              </Link>

              {/* Friends Button - Mobile */}
              {player && (
                <button
                  onClick={() => {
                    setIsFriendsPanelOpen(true);
                    closeMobileMenu();
                  }}
                  className={cn(
                    "flex items-center gap-2 text-base font-medium transition-colors hover:text-text-primary py-2 text-left",
                    "text-text-secondary"
                  )}
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
                <div className="pt-4 mt-4 border-t border-board-grid">
                  <div className="text-sm mb-3">
                    <div className="font-medium text-text-primary">
                      {player.displayName || player.username}
                    </div>
                    {player.displayName && (
                      <div className="text-xs text-text-muted">
                        @{player.username}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left text-base font-medium text-text-secondary hover:text-accent-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
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
