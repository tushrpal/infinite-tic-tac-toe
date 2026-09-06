import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PlayerProvider } from "@/components/providers/PlayerProvider";
import { FriendsProvider } from "@/components/providers/FriendsProvider";
import { ChallengesProvider } from "@/components/providers/ChallengesProvider";
import { Navigation } from "@/components/layout/Navigation";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { OnboardingProvider } from "@/components/onboarding/OnboardingModal";
import { ChallengeNotificationWrapper } from "@/components/challenges/ChallengeNotificationWrapper";
import { RoomInviteNotificationWrapper } from "@/components/rooms/RoomInviteNotificationWrapper";
import { AccountLinkingBannerWrapper } from "@/components/auth/AccountLinkingBannerWrapper";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infinite Tic-Tac-Toe",
  description:
    "A modern, competitive Tic-Tac-Toe game with online multiplayer, rankings, and more.",
  keywords: ["tic-tac-toe", "game", "multiplayer", "online", "ranked"],
  authors: [{ name: "Infinite TTT Team" }],
  openGraph: {
    title: "Infinite Tic-Tac-Toe",
    description: "Challenge players worldwide in competitive Tic-Tac-Toe",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Infinite TTT",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface-base text-text-primary antialiased">
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider defaultThemeId="dark">
              <ToastProvider>
                <PlayerProvider>
                  <FriendsProvider>
                    <ChallengesProvider>
                      <div className="flex flex-col min-h-screen">
                        <Navigation />
                        <AccountLinkingBannerWrapper />
                        {children}
                      </div>
                      {/* Challenge Notifications */}
                      <ChallengeNotificationWrapper />
                      {/* Room Invite Notifications */}
                      <RoomInviteNotificationWrapper />
                      {/* Onboarding loads after main content */}
                      <OnboardingProvider>
                        {null}
                      </OnboardingProvider>
                    </ChallengesProvider>
                  </FriendsProvider>
                </PlayerProvider>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
