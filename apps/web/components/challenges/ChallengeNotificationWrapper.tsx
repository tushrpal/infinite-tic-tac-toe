"use client";

/**
 * ChallengeNotificationWrapper
 * Client component wrapper for challenge notifications with navigation
 */

import { useRouter } from "next/navigation";
import { ChallengeNotificationContainer } from "./ChallengeNotification";

export function ChallengeNotificationWrapper() {
  const router = useRouter();

  const handleNavigateToMatch = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  return <ChallengeNotificationContainer onNavigateToMatch={handleNavigateToMatch} />;
}
