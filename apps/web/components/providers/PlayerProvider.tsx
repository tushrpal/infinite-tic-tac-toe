"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  ensurePlayer,
  getStoredPlayerId,
  handleOAuthCallback,
  registerWithOAuth,
  type PlayerProfile,
  type OAuthProvider,
  type OAuthCallbackResponse,
} from "@/lib/player";
import { UsernameRegistrationModal } from "@/components/modals/UsernameRegistrationModal";
import type { OAuthUserData } from "@/components/auth/OAuthButton";

type PlayerContextType = {
  player: PlayerProfile | null;
  isLoading: boolean;
  needsRegistration: boolean;
  refreshPlayer: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { update: updateSession } = useSession();

  // OAuth state
  const [oauthData, setOAuthData] = useState<
    (OAuthCallbackResponse["oauthData"] & { suggestedUsername?: string }) | null
  >(null);

  const loadPlayer = async () => {
    setIsLoading(true);

    // Check if user is already logged in via OAuth BEFORE processing a fresh callback
    const storedSessionToken = localStorage.getItem('infinite-ttt-session-token');

    // The Profile page's "Link Account" flow owns its own OAuth redirect and
    // signals it via these sessionStorage flags. When present, defer entirely
    // to that component - auto-processing here as well races it and can pop
    // the "choose a username" modal while the correct link is being written.
    const isDedicatedLinkingFlow = sessionStorage.getItem('oauth-linking-mode') === 'true';

    // Check if there's a fresh OAuth session first
    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();

        // If we have a fresh OAuth session, handle it
        if (session?.user?.oauthProvider && session?.user?.freshOAuth) {
          if (isDedicatedLinkingFlow) {
            console.log('OAuth session detected but linking flow owns this callback - skipping auto-process');
            // Fall through to normal player loading
          } else if (storedSessionToken) {
            // Already fully authenticated via OAuth (e.g. re-triggered sign-in
            // while logged in) - nothing new to link, just continue normally.
            console.log('OAuth session detected but user already logged in - skipping auto-process');
            // Fall through to normal player loading
          } else {
            // Attach any existing anonymous player so a pre-chosen username
            // gets linked to this OAuth identity instead of re-registering.
            const anonymousPlayerId = getStoredPlayerId() || undefined;
            console.log('Found fresh OAuth session, processing...', { anonymousPlayerId });
            await handleOAuthAuth(
              session.user.oauthProvider,
              {
                oauthId: session.user.oauthId,
                email: session.user.email || '',
                name: session.user.name || undefined,
              },
              anonymousPlayerId
            );
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.log('No OAuth session found, continuing with regular flow');
    }

    const storedId = getStoredPlayerId();

    if (!storedId) {
      // No stored player - show registration modal
      setNeedsRegistration(true);
      setIsLoading(false);
      return;
    }

    try {
      // Try to load existing player (session token or playerId)
      const existingPlayer = await ensurePlayer();
      setPlayer(existingPlayer);
      setNeedsRegistration(false);
    } catch (error) {
      console.log('Player not found, showing registration');
      // If player not found, show registration
      setNeedsRegistration(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayer();
  }, []);

  const handleRegistration = async (displayName: string) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      let newPlayer: PlayerProfile;

      if (oauthData) {
        // Complete OAuth registration with display name only
        console.log('Completing OAuth registration:', { displayName, oauthData });

        newPlayer = await registerWithOAuth(
          oauthData.provider,
          oauthData.oauthId,
          oauthData.email,
          displayName,
          oauthData.suggestedUsername!
        );

        console.log('OAuth registration successful:', newPlayer);
        setOAuthData(null);

        // Clear the freshOAuth flag now that registration is complete -
        // otherwise a later remount re-enters the OAuth auto-processing branch.
        await updateSession();
      } else {
        // Regular anonymous registration with display name
        console.log('Creating anonymous player:', { displayName });
        newPlayer = await ensurePlayer(displayName);
      }

      setPlayer(newPlayer);
      setNeedsRegistration(false);
    } catch (error) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : "Failed to create player";
      setRegistrationError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOAuthAuth = async (
    provider: OAuthProvider,
    userData: OAuthUserData,
    anonymousPlayerId?: string
  ) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      console.log('OAuth authentication started:', { provider, userData, anonymousPlayerId });

      const response = await handleOAuthCallback(
        provider,
        userData.oauthId,
        userData.email,
        userData.name,
        anonymousPlayerId
      );

      console.log('OAuth callback response:', response);

      if (response.isNewUser) {
        // New OAuth user - show username modal
        console.log('New OAuth user - showing username modal');
        setOAuthData(
          response.oauthData
            ? { ...response.oauthData, suggestedUsername: response.suggestedUsername }
            : null
        );
        setNeedsRegistration(true);
        setIsRegistering(false);
        // Deliberately leave freshOAuth set - the user hasn't finished
        // choosing a username yet, so a reload before they submit should
        // still recognize this as an in-progress OAuth sign-in and re-fetch
        // the suggested username / oauthData rather than falling back to a
        // disconnected anonymous registration.
      } else {
        // Existing user, or an anonymous account that was just linked - login successful
        console.log('Existing OAuth user - logging in');

        // Store session token and player ID in localStorage
        if (response.sessionToken) {
          localStorage.setItem('infinite-ttt-session-token', response.sessionToken);
        }
        if (response.playerId) {
          localStorage.setItem('infinite-ttt-player-id', response.playerId);
        }

        setPlayer({
          playerId: response.playerId!,
          username: response.username!,
          displayName: response.displayName || undefined,
          rating: response.rating || 0,
          isAnonymous: false,
        });
        setNeedsRegistration(false);
        setIsRegistering(false);

        // Clear the freshOAuth flag from the session
        await updateSession();
      }
    } catch (error) {
      console.error('OAuth authentication error:', error);
      const message = error instanceof Error ? error.message : "OAuth authentication failed";
      setRegistrationError(message);
      setIsRegistering(false);
    }
  };

  const refreshPlayer = async () => {
    await loadPlayer();
  };

  return (
    <PlayerContext.Provider value={{ player, isLoading, needsRegistration, refreshPlayer }}>
      {children}

      {/* Registration Modal */}
      <UsernameRegistrationModal
        isOpen={needsRegistration && !isLoading}
        onSubmit={handleRegistration}
        onOAuthAuth={oauthData ? undefined : handleOAuthAuth}
        error={registrationError}
        isLoading={isRegistering}
        showOAuth={!oauthData}
      />
    </PlayerContext.Provider>
  );
}
