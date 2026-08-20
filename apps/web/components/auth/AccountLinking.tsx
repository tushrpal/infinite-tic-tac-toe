"use client";

import { useState } from "react";
import { linkAccountToOAuth, type OAuthProvider } from "@/lib/player";
import { OAuthButtonGroup, type OAuthUserData } from "@/components/auth/OAuthButton";

type AccountLinkingProps = {
  playerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AccountLinking({ playerId, onSuccess, onCancel }: AccountLinkingProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLink = async (provider: OAuthProvider, userData: OAuthUserData) => {
    setIsLinking(true);
    setError(null);

    try {
      await linkAccountToOAuth(playerId, provider, userData.oauthId, userData.email);

      // Account successfully linked
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to link account";
      setError(message);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="rounded-xl border border-board-grid bg-surface-elevated p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Secure Your Account</h3>
        <p className="text-sm text-text-secondary">
          Link your account to save your progress across devices. You can login from anywhere and never lose
          your stats!
        </p>
      </div>

      <div className="mb-4 p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30">
        <h4 className="text-sm font-semibold mb-2 text-accent-primary">Benefits of linking:</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Access your account from any device</li>
          <li>✓ Never lose your progress or rating</li>
          <li>✓ Secure authentication</li>
          <li>✓ Recover account if you clear browser data</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-accent-error/40 bg-accent-error/10 p-3 text-sm text-accent-error">
          {error}
        </div>
      )}

      <OAuthButtonGroup onAuth={handleOAuthLink} disabled={isLinking} />

      {onCancel && (
        <button
          onClick={onCancel}
          disabled={isLinking}
          className="mt-4 w-full text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          Maybe later
        </button>
      )}
    </div>
  );
}

type AccountLinkingBannerProps = {
  onLinkClick: () => void;
  onDismiss?: () => void;
};

export function AccountLinkingBanner({ onLinkClick, onDismiss }: AccountLinkingBannerProps) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
      <div className="text-2xl">⚠️</div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">Account Not Secured</h4>
        <p className="text-xs text-text-secondary mb-3">
          Your progress is only saved in this browser. Link your account to prevent data loss.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onLinkClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            Link Account
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
