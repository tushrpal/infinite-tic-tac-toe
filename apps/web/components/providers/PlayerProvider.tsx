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
  const [oauthData, setOAuthData] = useState<OAuthCallbackResponse["oauthData"] | null>(null);
  const [suggestedUsername, setSuggestedUsername] = useState<string | undefined>(undefined);

  const loadPlayer = async () => {
    setIsLoading(true);

    // Check if user is already logged in BEFORE processing OAuth
    const storedSessionToken = localStorage.getItem('infinite-ttt-session-token');

    // Check if there's a fresh OAuth session first
    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();

        // If we have a fresh OAuth session, handle it
        if (session?.user?.oauthProvider && session?.user?.freshOAuth) {
          // If there's already a logged-in session, this is an account linking attempt
          // DON'T auto-process - let AccountLinking component handle the conflict
          if (storedSessionToken) {
            console.log('OAuth session detected but user already logged in - skipping auto-process for account linking');
            // Fall through to normal player loading
          } else {
            // No existing session - this is a new OAuth signup
            console.log('Found fresh OAuth session, processing...');
            await handleOAuthAuth(
              session.user.oauthProvider,
              {
                oauthId: session.user.oauthId,
                email: session.user.email || '',
                name: session.user.name || undefined,
              }
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

  const handleRegistration = async (username: string, displayName: string) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      let newPlayer: PlayerProfile;

      if (oauthData) {
        // Complete OAuth registration with chosen username
        console.log('Completing OAuth registration:', { username, displayName, oauthData });

        newPlayer = await registerWithOAuth(
          oauthData.provider,
          oauthData.oauthId,
          oauthData.email,
          username,
          displayName || undefined
        );

        console.log('OAuth registration successful:', newPlayer);
        setOAuthData(null);
        setSuggestedUsername(undefined);
      } else {
        // Regular anonymous registration
        console.log('Creating anonymous player:', { username, displayName });
        newPlayer = await ensurePlayer(username, displayName || undefined);
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

  const handleOAuthAuth = async (provider: OAuthProvider, userData: OAuthUserData) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      console.log('OAuth authentication started:', { provider, userData });

      const response = await handleOAuthCallback(
        provider,
        userData.oauthId,
        userData.email,
        userData.name
      );

      console.log('OAuth callback response:', response);

      if (response.isNewUser) {
        // New OAuth user - show username selection with suggestion
        console.log('New OAuth user - showing username modal');
        setOAuthData(response.oauthData || null);
        setSuggestedUsername(response.suggestedUsername);
        setNeedsRegistration(true);
        setIsRegistering(false);
      } else {
        // Existing user - login successful
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
        suggestedUsername={suggestedUsername}
        showOAuth={!oauthData}
      />
    </PlayerContext.Provider>
  );
}
