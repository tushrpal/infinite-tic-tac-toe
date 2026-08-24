import type { Metadata } from "next";
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
import { ChallengeNotificationContainer } from "@/components/challenges/ChallengeNotification";

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
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider defaultThemeId="dark">
              <ToastProvider>
                <PlayerProvider>
                  <FriendsProvider>
                    <ChallengesProvider>
                      <div className="flex flex-col min-h-screen">
                        <Navigation />
                        {children}
                      </div>
                      {/* Challenge Notifications */}
                      <ChallengeNotificationContainer
                        onNavigateToMatch={(matchId) => {
                          if (typeof window !== 'undefined') {
                            window.location.href = `/match/${matchId}`;
                          }
                        }}
                      />
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
