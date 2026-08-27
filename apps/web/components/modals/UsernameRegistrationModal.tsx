"use client";

import { useState } from "react";
import { OAuthButtonGroup, type OAuthUserData } from "@/components/auth/OAuthButton";
import type { OAuthProvider } from "@/lib/player";

type UsernameRegistrationModalProps = {
  isOpen: boolean;
  onSubmit: (displayName: string) => void;
  onOAuthAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void;
  onClose?: () => void;
  error?: string | null;
  isLoading?: boolean;
  showOAuth?: boolean;
};

export function UsernameRegistrationModal({
  isOpen,
  onSubmit,
  onOAuthAuth,
  onClose,
  error,
  isLoading = false,
  showOAuth = true,
}: UsernameRegistrationModalProps) {
  const [displayName, setDisplayName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  const canSubmit = displayName.trim().length > 0 && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-board-grid rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Choose Your Display Name
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          This is how other players will see you in the game.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Enter your display name"
              className="w-full px-4 py-2 bg-surface-base border border-board-grid rounded-lg
                       text-text-primary placeholder-text-tertiary
                       focus:outline-none focus:ring-2 focus:ring-playerX-primary focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1">
              1-30 characters. Unicode, spaces, and emoji allowed.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2 px-4 bg-playerX-primary hover:bg-playerX-secondary
                     text-white font-medium rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Continue"}
          </button>
        </form>

        {showOAuth && onOAuthAuth && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-board-grid" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-elevated text-text-tertiary">
                  or sign in with
                </span>
              </div>
            </div>

            <OAuthButtonGroup onAuth={onOAuthAuth} />
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
