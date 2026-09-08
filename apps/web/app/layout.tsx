import type { Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { globalSchemas } from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
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

export const metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: "#0f0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <JsonLd data={globalSchemas()} />
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
