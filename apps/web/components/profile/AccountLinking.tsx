"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { linkAccountToOAuth, type OAuthProvider } from "@/lib/player";
import { AccountConflictModal } from "./AccountConflictModal";
import { LinkIcon } from "./ProfileIcons";

type AccountLinkingProps = {
  playerId: string;
  isAnonymous: boolean;
  linkedProviders?: {
    google?: boolean;
    discord?: boolean;
  };
};

const PROVIDER_CONFIG = {
  google: {
    name: "Google",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>
    ),
    color: "bg-white text-gray-800 hover:bg-gray-100 border border-gray-300",
  },
  discord: {
    name: "Discord",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
        <path fill="#8c9eff" d="M40,12c0,0-4.585-3.588-10-4l-0.488,0.976C34.408,10.174,36.654,11.891,39,14c-4.045-2.065-8.039-4-15-4s-10.955,1.935-15,4c2.346-2.109,5.018-4.015,9.488-5.024L18,8c-5.681,0.537-10,4-10,4s-5.121,7.425-6,22c5.162,5.953,13,6,13,6l1.639-2.185C13.857,36.848,10.715,35.121,8,32c3.238,2.45,8.125,5,16,5s12.762-2.55,16-5c-2.715,3.121-5.857,4.848-8.639,5.815L33,40c0,0,7.838-0.047,13-6C45.121,19.425,40,12,40,12z M17.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C21,28.209,19.433,30,17.5,30z M30.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C34,28.209,32.433,30,30.5,30z"></path>
      </svg>
    ),
    color: "bg-[#5865F2] text-white hover:bg-[#4752C4]",
  },
};

export function AccountLinking({ playerId, isAnonymous, linkedProviders }: AccountLinkingProps) {
  const { update: updateSession } = useSession();
  const [linkingProvider, setLinkingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    provider: OAuthProvider;
    providerName: string;
    existingAccount: { username: string; displayName: string | null };
    oauthId: string;
    email: string;
  } | null>(null);

  // Check if any provider is already linked
  const hasLinkedProvider = linkedProviders?.google || linkedProviders?.discord;
  const linkedProviderName = linkedProviders?.google ? 'Google' : linkedProviders?.discord ? 'Discord' : null;

  // Handle OAuth callback after redirect
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const isLinkingMode = sessionStorage.getItem('oauth-linking-mode');
      const linkingPlayerId = sessionStorage.getItem('oauth-linking-playerId');
      const linkingProvider = sessionStorage.getItem('oauth-linking-provider');

      if (!isLinkingMode || !linkingPlayerId || !linkingProvider) {
        return; // Not in linking mode
      }

      console.log('Processing OAuth callback for account linking...');

      // Clear the flags
      sessionStorage.removeItem('oauth-linking-mode');
      sessionStorage.removeItem('oauth-linking-playerId');
      sessionStorage.removeItem('oauth-linking-provider');

      setLinkingProvider(linkingProvider as OAuthProvider);

      try {
        // Get OAuth session data
        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!sessionResponse.ok) {
          throw new Error('Failed to get OAuth session');
        }

        const session = await sessionResponse.json();
        // Email is intentionally not required - some providers (e.g. a
        // Discord account with no verified email) never send one.
        if (!session?.user?.oauthId) {
          throw new Error('OAuth session missing required data');
        }

        console.log('Attempting to link account:', {
          playerId: linkingPlayerId,
          provider: linkingProvider,
          oauthId: session.user.oauthId,
        });

        // Attempt to link the account
        const linkResult = await linkAccountToOAuth(
          linkingPlayerId,
          linkingProvider,
          session.user.oauthId,
          session.user.email || ''
        );

        if (linkResult.success) {
          setSuccess(`Successfully linked your ${PROVIDER_CONFIG[linkingProvider as OAuthProvider].name} account!`);
          // Clear the freshOAuth flag now that linking is complete - otherwise
          // a remount before the reload fires could re-enter OAuth auto-processing.
          await updateSession();
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err: any) {
        console.error('Account linking callback error:', err);

        // Check for conflict
        if (err?.status === 409 && err?.data?.code === 'OAUTH_ALREADY_LINKED') {
          console.log('OAuth conflict detected, showing modal');

          const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
          const session = await sessionResponse.json();

          setConflictData({
            provider: linkingProvider as OAuthProvider,
            providerName: PROVIDER_CONFIG[linkingProvider as OAuthProvider].name,
            existingAccount: err.data.existingAccount,
            oauthId: session.user.oauthId,
            email: session.user.email || '',
          });
          setShowConflictModal(true);
        } else {
          setError(err?.message || 'Failed to link account');
        }
      } finally {
        setLinkingProvider(null);
      }
    };

    handleOAuthCallback();
  }, []);

  const handleSwitchToExisting = async () => {
    if (!conflictData) return;

    setLinkingProvider(conflictData.provider);
    setError(null);

    try {
      // Call the backend to log into the existing account
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: conflictData.provider,
          oauthId: conflictData.oauthId,
          email: conflictData.email,
        }),
      });

      const data = await response.json();

      if (data.sessionToken && data.playerId) {
        // Clear current anonymous account
        localStorage.clear();

        // Set the existing account's session
        localStorage.setItem('infinite-ttt-session-token', data.sessionToken);
        localStorage.setItem('infinite-ttt-player-id', data.playerId);

        // Reload to switch to the existing account
        window.location.href = '/profile';
      }
    } catch (err) {
      console.error('Switch account error:', err);
      setError('Failed to switch accounts');
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleStayWithCurrent = () => {
    // Close modal and stay with current account
    setShowConflictModal(false);
    setConflictData(null);
    setError(null);
  };

  const handleLinkAccount = async (provider: OAuthProvider) => {
    setLinkingProvider(provider);
    setError(null);
    setSuccess(null);

    try {
      console.log('Starting account linking for:', provider);

      // Store current player info to restore later
      const currentPlayerId = localStorage.getItem('infinite-ttt-player-id');
      const currentSessionToken = localStorage.getItem('infinite-ttt-session-token');

      // Store a flag indicating we're in linking mode
      sessionStorage.setItem('oauth-linking-mode', 'true');
      sessionStorage.setItem('oauth-linking-playerId', playerId);
      sessionStorage.setItem('oauth-linking-provider', provider);

      // Trigger NextAuth OAuth flow with redirect
      // After OAuth, page will reload and we'll check sessionStorage
      await signIn(provider, {
        redirect: true,
        callbackUrl: window.location.href,
      });
    } catch (err: any) {
      console.error('Account linking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start linking process');
      setLinkingProvider(null);
    }
  };

  return (
    <section className="glass-panel p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold sm:text-lg">
        <LinkIcon className="h-5 w-5 text-accent-primary sm:h-6 sm:w-6" />
        Connected Accounts
      </h2>

      {hasLinkedProvider ? (
        // Already linked to a provider - show only the linked one
        <div className="space-y-3">
          {(['google', 'discord'] as OAuthProvider[]).map((provider) => {
            const isLinked = linkedProviders?.[provider] || false;
            if (!isLinked) return null; // Hide unlinked providers

            const config = PROVIDER_CONFIG[provider];

            return (
              <div
                key={provider}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span>{config.icon}</span>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-xs text-text-muted">Connected</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-accent-success">✓ Linked</span>
                </div>
              </div>
            );
          })}

          <div className="mt-4 p-3 rounded-lg border border-accent-primary/40 bg-accent-primary/10 text-sm text-text-secondary">
            💡 Your account is linked to {linkedProviderName}. You can only link one OAuth provider at a time.
          </div>
        </div>
      ) : (
        // No provider linked yet - show all options
        <div className="space-y-3">
          {(['google', 'discord'] as OAuthProvider[]).map((provider) => {
            const config = PROVIDER_CONFIG[provider];

            return (
              <div
                key={provider}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span>{config.icon}</span>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-xs text-text-muted">Not connected</div>
                  </div>
                </div>
                <button
                  onClick={() => handleLinkAccount(provider)}
                  disabled={linkingProvider !== null}
                  className="rounded-lg bg-gradient-to-r from-accent-primary to-[#7c3aed] px-5 py-1.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {linkingProvider === provider ? 'Linking...' : 'Link'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-accent-error/40 bg-accent-error/10 text-sm text-accent-error">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded-lg border border-accent-success/40 bg-accent-success/10 text-sm text-accent-success">
          {success}
        </div>
      )}

      {isAnonymous && !hasLinkedProvider && (
        <div className="mt-4 hidden rounded-lg border border-accent-primary/40 bg-accent-primary/10 p-3 text-sm text-accent-primary sm:block">
          💡 Link your account to Google or Discord to access it from any device and never lose your progress!
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictData && (
        <AccountConflictModal
          isOpen={showConflictModal}
          providerName={conflictData.providerName}
          existingAccount={conflictData.existingAccount}
          onSwitchToExisting={handleSwitchToExisting}
          onStayWithCurrent={handleStayWithCurrent}
          isProcessing={linkingProvider !== null}
        />
      )}
    </section>
  );
}
