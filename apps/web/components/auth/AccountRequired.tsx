"use client";

/**
 * AccountRequired
 * Guard for features that need an OAuth-linked account (rooms, friends, private
 * matches). Anonymous players have no session token, so these endpoints would
 * just 401 - show a clear prompt instead of an empty list or a raw error.
 */

import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/providers/PlayerProvider";

interface AccountRequiredProps {
  feature: string;
  children: React.ReactNode;
}

export function AccountRequired({ feature, children }: AccountRequiredProps) {
  const { player, isLoading } = usePlayer();
  const router = useRouter();
  const isAuthenticated = !!player && player.isAnonymous === false;

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-6 rounded-xl bg-surface-elevated border border-board-grid max-w-md mx-auto">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
        <p className="text-sm text-text-secondary mb-6">
          {feature} requires a linked account so your data can sync across devices.
        </p>
        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 rounded-lg bg-accent-primary text-accent-primary-foreground text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          Link Account
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
