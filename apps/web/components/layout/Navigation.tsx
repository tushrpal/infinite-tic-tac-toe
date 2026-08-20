"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { logout } from "@/lib/player";

export function Navigation() {
  const pathname = usePathname();
  const { player } = usePlayer();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      // Logout from backend (clears session token)
      await logout();

      // Logout from NextAuth (clears OAuth session)
      await signOut({ redirect: false });

      // Reload to reset state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="border-b border-board-grid bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="font-display font-bold text-xl">
          <span className="text-playerX-primary">Infinite</span>
          <span className="text-text-primary"> TTT</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
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

          {/* User Info & Logout */}
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
      </div>
    </nav>
  );
}
