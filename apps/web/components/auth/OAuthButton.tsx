"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import type { OAuthProvider } from "@/lib/player";

type OAuthButtonProps = {
  provider: OAuthProvider;
  onAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void; // Now optional, unused with redirect flow
  disabled?: boolean;
  className?: string;
};

export type OAuthUserData = {
  oauthId: string;
  email: string;
  name?: string;
};

const PROVIDER_CONFIG = {
  google: {
    name: "Google",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#8c9eff" d="M40,12c0,0-4.585-3.588-10-4l-0.488,0.976C34.408,10.174,36.654,11.891,39,14c-4.045-2.065-8.039-4-15-4s-10.955,1.935-15,4c2.346-2.109,5.018-4.015,9.488-5.024L18,8c-5.681,0.537-10,4-10,4s-5.121,7.425-6,22c5.162,5.953,13,6,13,6l1.639-2.185C13.857,36.848,10.715,35.121,8,32c3.238,2.45,8.125,5,16,5s12.762-2.55,16-5c-2.715,3.121-5.857,4.848-8.639,5.815L33,40c0,0,7.838-0.047,13-6C45.121,19.425,40,12,40,12z M17.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C21,28.209,19.433,30,17.5,30z M30.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C34,28.209,32.433,30,30.5,30z"></path>
      </svg>
    ),
    color: "bg-[#5865F2] text-white hover:bg-[#4752C4]",
  },
};

export function OAuthButton({ provider, onAuth, disabled = false, className = "" }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = PROVIDER_CONFIG[provider];

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Trigger NextAuth OAuth flow with redirect
      // After successful OAuth, the page will reload and PlayerProvider will handle the rest
      await signIn(provider, {
        redirect: true,
        callbackUrl: window.location.origin,
      });
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`flex items-center justify-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full ${config.color} ${className}`}
      >
        <span className="text-xl">{config.icon}</span>
        <span>{isLoading ? "Connecting..." : `Continue with ${config.name}`}</span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-accent-error">{error}</p>
      )}
    </div>
  );
}

type OAuthButtonGroupProps = {
  onAuth?: (provider: OAuthProvider, userData: OAuthUserData) => void; // Now optional
  disabled?: boolean;
};

export function OAuthButtonGroup({ onAuth, disabled = false }: OAuthButtonGroupProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-board-grid" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface-elevated px-2 text-text-muted">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        <OAuthButton provider="google" onAuth={onAuth} disabled={disabled} className="w-full" />
        <OAuthButton provider="discord" onAuth={onAuth} disabled={disabled} className="w-full" />
      </div>
    </div>
  );
}
