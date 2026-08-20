"use client";

import { useState, useEffect } from "react";
import { checkUsernameAvailability } from "@/lib/player";
import { OAuthButtonGroup, type OAuthUserData } from "@/components/auth/OAuthButton";
import type { OAuthProvider } from "@/lib/player";

type UsernameRegistrationModalProps = {
  isOpen: boolean;
  onSubmit: (username: string, displayName: string) => void;
  onOAuthAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void;
  onClose?: () => void;
  error?: string | null;
  isLoading?: boolean;
  suggestedUsername?: string;
  showOAuth?: boolean;
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function UsernameRegistrationModal({
  isOpen,
  onSubmit,
  onOAuthAuth,
  onClose,
  error,
  isLoading = false,
  suggestedUsername,
  showOAuth = true,
}: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState(suggestedUsername || "");
  const [displayName, setDisplayName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  // Update username when suggestedUsername changes
  useEffect(() => {
    if (suggestedUsername) {
      setUsername(suggestedUsername);
    }
  }, [suggestedUsername]);

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      setValidationError(null);
      return;
    }

    // Client-side validation
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
    if (!pattern.test(username)) {
      setUsernameStatus("invalid");
      setValidationError("Only letters, numbers, and underscore allowed. Cannot start/end with underscore.");
      return;
    }

    if (username.length > 20) {
      setUsernameStatus("invalid");
      setValidationError("Username must be 20 characters or less");
      return;
    }

    setUsernameStatus("checking");
    setValidationError(null);

    // Debounce: wait 400ms after user stops typing
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);

        if (result.reason === "invalid_format") {
          setUsernameStatus("invalid");
          setValidationError(result.message || "Invalid username format");
        } else if (result.available) {
          setUsernameStatus("available");
          setValidationError(null);
        } else {
          setUsernameStatus("taken");
          setValidationError("Username already taken");
        }
      } catch (error) {
        setUsernameStatus("idle");
        setValidationError("Failed to check username availability");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameStatus !== "available") {
      return;
    }

    onSubmit(username.toLowerCase().trim(), displayName.trim());
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-accent-primary motion-reduce:animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
      case "available":
        return (
          <svg
            className="h-5 w-5 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "taken":
      case "invalid":
        return (
          <svg
            className="h-5 w-5 text-accent-error"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-board-grid bg-surface-elevated p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-2xl font-bold">Create Your Profile</h2>
        <p className="mb-6 text-sm text-text-secondary">
          Choose a username to get started. You can set a display name too!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username (required) */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username <span className="text-accent-error">*</span>
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setValidationError(null);
                }}
                placeholder="coolplayer123"
                className="w-full px-4 py-2 pr-10 border border-board-grid rounded-lg bg-surface-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                maxLength={20}
                required
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getUsernameStatusIcon()}
              </div>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              3-20 characters, letters, numbers, and underscore only
            </p>
          </div>

          {/* Display Name (optional) */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">
              Display Name <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cool Player"
              className="w-full px-4 py-2 border border-board-grid rounded-lg bg-surface-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              maxLength={50}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-text-muted">
              This is what others will see (can be changed later)
            </p>
          </div>

          {/* Errors */}
          {(validationError || error) && (
            <div className="rounded-lg border border-accent-error/40 bg-accent-error/10 p-3 text-sm text-accent-error">
              {validationError || error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || usernameStatus !== "available"}
            className="w-full rounded-lg bg-accent-primary px-4 py-3 font-semibold text-white hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Profile"}
          </button>
        </form>

        {/* OAuth Options */}
        {showOAuth && onOAuthAuth && (
          <div className="mt-6">
            <OAuthButtonGroup onAuth={onOAuthAuth} disabled={isLoading} />
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="mt-4 w-full text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
