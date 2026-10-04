"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { OAuthButtonGroup, type OAuthUserData } from "@/components/auth/OAuthButton";
import type { OAuthProvider } from "@/lib/player";
import { cn } from "@/lib/helpers";
import { useFocusTrap, useFocusReturn } from "@/lib/accessibility";

type UsernameRegistrationModalProps = {
  isOpen: boolean;
  onSubmit: (displayName: string) => void;
  onOAuthAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void;
  onClose?: () => void;
  error?: string | null;
  isLoading?: boolean;
  showOAuth?: boolean;
};

const MAX_LENGTH = 30;
const WARN_AT = 25;
const MIN_LETTERS = 3;

const LETTER_PATTERN = new RegExp("\\p{L}", "gu");
const countLetters = (text: string) => (text.match(LETTER_PATTERN) ?? []).length;

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
  const errorId = useId();

  const dismissible = Boolean(onClose);
  const modalRef = useFocusTrap(isOpen);
  useFocusReturn(isOpen);

  if (!isOpen || typeof document === "undefined") return null;

  const trimmedName = displayName.trim();
  const letterCount = countLetters(trimmedName);
  const isNameValid = trimmedName.length > 0 && letterCount >= MIN_LETTERS && trimmedName.length <= MAX_LENGTH;
  const showNameHint = trimmedName.length > 0 && !isNameValid;
  const canSubmit = isNameValid && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameValid) {
      onSubmit(trimmedName);
    }
  };

  const handleOverlayClick = () => {
    if (dismissible) onClose?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-overlay backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape" && dismissible) onClose?.();
      }}
    >
      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-[201] w-full max-w-md",
          "bg-surface-elevated border border-board-grid rounded-xl shadow-2xl",
          "p-6 sm:p-8",
          "animate-scale-in",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-title"
        aria-describedby="registration-description"
      >
        {dismissible && (
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "absolute top-4 right-4 p-1.5 rounded-lg",
              "text-text-tertiary hover:text-text-primary hover:bg-board-grid",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-playerX-primary",
              "min-w-[36px] min-h-[36px] flex items-center justify-center",
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <MarkBadge />

        <h2 id="registration-title" className="font-display text-2xl font-bold text-text-primary text-center mt-4 mb-1">
          Choose your display name
        </h2>
        <p id="registration-description" className="text-text-secondary text-sm text-center mb-6">
          This is how other players will see you on the board.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="displayName" className="text-sm font-medium text-text-primary">
                Display name
              </label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  displayName.length >= WARN_AT ? "text-accent-warning" : "text-text-tertiary",
                )}
              >
                {displayName.length}/{MAX_LENGTH}
              </span>
            </div>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="e.g. QuantumFox"
              className={cn(
                "w-full px-4 py-2.5 bg-surface-base border rounded-lg",
                "text-text-primary placeholder-text-tertiary",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-playerX-primary focus:border-transparent",
                error ? "border-critical" : "border-board-grid",
              )}
              disabled={isLoading}
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            <p
              className={cn(
                "text-xs mt-1.5",
                showNameHint ? "text-critical" : "text-text-tertiary",
              )}
            >
              {showNameHint && letterCount < MIN_LETTERS
                ? `Needs at least ${MIN_LETTERS} letters.`
                : "At least 3 letters, up to 30 characters. Unicode, spaces, and emoji allowed."}
            </p>
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2 p-3 bg-critical/10 border border-critical/30 rounded-lg animate-shake"
            >
              <svg className="w-4 h-4 text-critical mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A1 1 0 003 19.5h18a1 1 0 00.89-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
              </svg>
              <p className="text-sm text-critical">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-medium transition-colors",
              "bg-playerX-primary hover:bg-playerX-secondary text-white",
              "focus:outline-none focus:ring-2 focus:ring-playerX-primary focus:ring-offset-2 focus:ring-offset-surface-elevated",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isLoading ? "Creating account..." : "Continue"}
          </button>
        </form>

        {showOAuth && onOAuthAuth && (
          <div className="mt-6">
            <OAuthButtonGroup onAuth={onOAuthAuth} disabled={isLoading} />
          </div>
        )}

        <p className="text-xs text-text-tertiary text-center mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" target="_blank" className="text-text-secondary underline hover:text-text-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="text-text-secondary underline hover:text-text-primary">
            Privacy Policy
          </Link>
          .
        </p>

        {dismissible && (
          <button
            onClick={onClose}
            className="mt-4 w-full text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

function MarkBadge() {
  return (
    <div className="mx-auto w-12 h-12 rounded-xl bg-surface-base border border-board-grid flex items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4L10 10M10 4L4 10"
          stroke="var(--player-x-primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="17"
          cy="17"
          r="4"
          stroke="var(--player-o-primary)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
