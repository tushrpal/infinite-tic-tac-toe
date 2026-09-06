"use client";

/**
 * AccountLinkingBannerWrapper
 * App-wide nudge for anonymous players to link an account, dismissible per browser
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { AccountLinkingBanner } from "./AccountLinkingBanner";

const DISMISS_KEY = "infinite-ttt-linking-banner-dismissed";

export function AccountLinkingBannerWrapper() {
  const { player, isLoading } = usePlayer();
  const router = useRouter();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (isLoading || dismissed !== false || !player?.isAnonymous) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Ignore storage errors (private browsing, storage disabled, etc.)
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-4">
      <AccountLinkingBanner
        onLinkClick={() => router.push("/profile")}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
