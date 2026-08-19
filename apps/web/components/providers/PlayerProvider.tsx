"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ensurePlayer, getStoredPlayerId, type PlayerProfile } from "@/lib/player";
import { UsernameRegistrationModal } from "@/components/modals/UsernameRegistrationModal";

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

  const loadPlayer = async () => {
    setIsLoading(true);
    const storedId = getStoredPlayerId();

    if (!storedId) {
      // No stored player - show registration modal
      setNeedsRegistration(true);
      setIsLoading(false);
      return;
    }

    try {
      // Try to load existing player (without username requirement)
      const existingPlayer = await ensurePlayer();
      setPlayer(existingPlayer);
      setNeedsRegistration(false);
    } catch (error) {
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
      const newPlayer = await ensurePlayer(username, displayName || undefined);
      setPlayer(newPlayer);
      setNeedsRegistration(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create player";
      setRegistrationError(message);
    } finally {
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
        error={registrationError}
        isLoading={isRegistering}
      />
    </PlayerContext.Provider>
  );
}
