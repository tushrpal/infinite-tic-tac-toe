"use client";

/**
 * Challenges Context Provider
 * Manages challenges, private matches, and real-time updates via WebSocket
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { useSocketEvent } from "@/hooks/useWebSocket";
import { announce } from "@/lib/accessibility";
import {
  getChallenges,
  sendChallenge,
  respondToChallenge,
  cancelChallenge,
  createPrivateMatch,
  cancelPrivateMatch,
} from "@/lib/challenges";
import type {
  Challenge,
  SendChallengePayload,
  RespondToChallengePayload,
  PrivateMatch,
  CreatePrivateMatchPayload,
} from "@/types/challenges";

interface ChallengesContextType {
  sentChallenges: Challenge[];
  receivedChallenges: Challenge[];
  activePrivateMatch: PrivateMatch | null;
  isLoading: boolean;
  error: string | null;
  refreshChallenges: () => Promise<void>;
  sendNewChallenge: (payload: SendChallengePayload) => Promise<void>;
  respondToReceivedChallenge: (payload: RespondToChallengePayload) => Promise<string | null>;
  cancelSentChallenge: (challengeId: string) => Promise<void>;
  createNewPrivateMatch: (payload: CreatePrivateMatchPayload) => Promise<PrivateMatch>;
  cancelActivePrivateMatch: (matchId: string) => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error("useChallenges must be used within ChallengesProvider");
  }
  return context;
}

export function ChallengesProvider({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [activePrivateMatch, setActivePrivateMatch] = useState<PrivateMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load challenges from API
   */
  const loadChallenges = useCallback(async () => {
    if (!player) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const challenges = await getChallenges();
      setSentChallenges(challenges.sent);
      setReceivedChallenges(challenges.received);
    } catch (err) {
      console.error("Failed to load challenges:", err);
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setIsLoading(false);
    }
  }, [player]);

  /**
   * Initial load when player is available
   */
  useEffect(() => {
    if (player) {
      loadChallenges();
    } else {
      setSentChallenges([]);
      setReceivedChallenges([]);
      setActivePrivateMatch(null);
      setIsLoading(false);
    }
  }, [player, loadChallenges]);

  /**
   * Send a challenge
   */
  const sendNewChallenge = useCallback(async (payload: SendChallengePayload) => {
    try {
      const newChallenge = await sendChallenge(payload);
      setSentChallenges(prev => [...prev, newChallenge]);
    } catch (err) {
      console.error("Failed to send challenge:", err);
      throw err;
    }
  }, []);

  /**
   * Respond to a challenge
   */
  const respondToReceivedChallenge = useCallback(async (payload: RespondToChallengePayload): Promise<string | null> => {
    try {
      const response = await respondToChallenge(payload);

      // Remove from received challenges
      setReceivedChallenges(prev =>
        prev.filter(challenge => challenge.challengeId !== payload.challengeId)
      );

      // Return matchId if accepted
      return response.matchId || null;
    } catch (err) {
      console.error("Failed to respond to challenge:", err);
      throw err;
    }
  }, []);

  /**
   * Cancel a sent challenge
   */
  const cancelSentChallenge = useCallback(async (challengeId: string) => {
    try {
      await cancelChallenge(challengeId);
      setSentChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
    } catch (err) {
      console.error("Failed to cancel challenge:", err);
      throw err;
    }
  }, []);

  /**
   * Create a private match
   */
  const createNewPrivateMatch = useCallback(async (payload: CreatePrivateMatchPayload): Promise<PrivateMatch> => {
    try {
      const match = await createPrivateMatch(payload);
      setActivePrivateMatch(match);
      return match;
    } catch (err) {
      console.error("Failed to create private match:", err);
      throw err;
    }
  }, []);

  /**
   * Cancel a private match
   */
  const cancelActivePrivateMatch = useCallback(async (matchId: string) => {
    try {
      await cancelPrivateMatch(matchId);
      setActivePrivateMatch(null);
    } catch (err) {
      console.error("Failed to cancel private match:", err);
      throw err;
    }
  }, []);

  /**
   * WebSocket Event Listeners
   */

  // Challenge received
  useSocketEvent('CHALLENGE_RECEIVED', (payload: any) => {
    const newChallenge: Challenge = {
      challengeId: payload.challengeId,
      challengerId: payload.challengerId,
      challengerUsername: payload.challengerUsername,
      challengerDisplayName: payload.challengerDisplayName,
      challengerRating: payload.challengerRating,
      challengedId: payload.challengedId,
      challengedUsername: payload.challengedUsername,
      challengedDisplayName: payload.challengedDisplayName,
      challengedRating: payload.challengedRating,
      mode: payload.mode,
      status: 'PENDING',
      expiresAt: payload.expiresAt,
      createdAt: payload.createdAt,
    };
    setReceivedChallenges(prev => [...prev, newChallenge]);

    // Announce to screen readers
    announce(`Challenge received from ${payload.challengerDisplayName || payload.challengerUsername}`, 'assertive');
  }, []);

  // Challenge accepted
  useSocketEvent('CHALLENGE_ACCEPTED', (payload: any) => {
    setSentChallenges(prev =>
      prev.filter(c => c.challengeId !== payload.challengeId)
    );
  }, []);

  // Challenge declined
  useSocketEvent('CHALLENGE_DECLINED', (payload: any) => {
    setSentChallenges(prev =>
      prev.filter(c => c.challengeId !== payload.challengeId)
    );
  }, []);

  // Challenge cancelled
  useSocketEvent('CHALLENGE_CANCELLED', (payload: any) => {
    setReceivedChallenges(prev =>
      prev.filter(c => c.challengeId !== payload.challengeId)
    );
  }, []);

  // Challenge expired
  useSocketEvent('CHALLENGE_EXPIRED', (payload: any) => {
    setSentChallenges(prev =>
      prev.filter(c => c.challengeId !== payload.challengeId)
    );
    setReceivedChallenges(prev =>
      prev.filter(c => c.challengeId !== payload.challengeId)
    );
  }, []);

  // Private match joined
  useSocketEvent('PRIVATE_MATCH_JOINED', (payload: any) => {
    if (activePrivateMatch?.matchId === payload.matchId) {
      setActivePrivateMatch(null);
    }
  }, [activePrivateMatch]);

  // Private match expired
  useSocketEvent('PRIVATE_MATCH_EXPIRED', (payload: any) => {
    if (activePrivateMatch?.matchId === payload.matchId) {
      setActivePrivateMatch(null);
    }
  }, [activePrivateMatch]);

  return (
    <ChallengesContext.Provider
      value={{
        sentChallenges,
        receivedChallenges,
        activePrivateMatch,
        isLoading,
        error,
        refreshChallenges: loadChallenges,
        sendNewChallenge,
        respondToReceivedChallenge,
        cancelSentChallenge,
        createNewPrivateMatch,
        cancelActivePrivateMatch,
      }}
    >
      {children}
    </ChallengesContext.Provider>
  );
}
