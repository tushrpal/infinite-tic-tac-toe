"use client";

import { useState } from "react";

type UsernameRegistrationModalProps = {
  isOpen: boolean;
  onSubmit: (username: string, displayName: string) => void;
  onClose?: () => void;
  error?: string | null;
  isLoading?: boolean;
};

export function UsernameRegistrationModal({
  isOpen,
  onSubmit,
  onClose,
  error,
  isLoading = false,
}: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateUsername = (value: string): boolean => {
    if (value.length < 3 || value.length > 20) {
      setValidationError("Username must be 3-20 characters");
      return false;
    }

    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
    if (!pattern.test(value)) {
      setValidationError("Only letters, numbers, and underscore allowed. Cannot start/end with underscore.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      return;
    }

    onSubmit(username.toLowerCase().trim(), displayName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-board-grid bg-surface-elevated p-6 shadow-2xl">
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
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationError(null);
              }}
              placeholder="coolplayer123"
              className="w-full px-4 py-2 border border-board-grid rounded-lg bg-surface-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              maxLength={20}
              required
              disabled={isLoading}
            />
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
            disabled={isLoading || !username.trim()}
            className="w-full rounded-lg bg-accent-primary px-4 py-3 font-semibold text-white hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Profile"}
          </button>
        </form>

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
