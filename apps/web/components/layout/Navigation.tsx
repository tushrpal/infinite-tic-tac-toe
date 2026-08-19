"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/helpers";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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
        </div>
      </div>
    </nav>
  );
}
