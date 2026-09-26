import type { Viewport } from "next";
import Script from "next/script";
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
import { Footer } from "@/components/layout/Footer";
import { FooterSlot } from "@/components/layout/FooterSlot";
import { WebVitals } from "@/components/analytics/WebVitals";
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
      <head>
        {/*
          Warm up the ad and analytics origins early. The scripts themselves
          now load late (see below), but the DNS + TLS handshake can happen
          during idle time rather than on the critical path.
        */}
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body className="min-h-screen bg-surface-base text-text-primary antialiased">
        {/*
          AdSense was a bare <script> in <head>, which gives ad code
          document-blocking priority ahead of the LCP image. Measured on
          2026-09-26 it was 219 KB of JS (149 KB of it never executed)
          competing with a 39 KB hero image, on pages whose LCP was 5.7-8.5s.

          `lazyOnload` defers it to after the window load event, so ads no
          longer contend for bandwidth or main thread during the paint that
          Core Web Vitals actually measures. Ads render slightly later as a
          result — an accepted trade for LCP on pages this slow.
        */}
        <Script
          id="adsbygoogle"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7401169722110446"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SEV1SDLYRN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SEV1SDLYRN');
          `}
        </Script>
        <JsonLd data={globalSchemas()} />
        <WebVitals />
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider defaultThemeId="dark">
              <ToastProvider>
                <PlayerProvider>
                  <FriendsProvider>
                    <ChallengesProvider>
                      <div className="flex flex-col min-h-screen pb-14 md:pb-0">
                        <Navigation />
                        <AccountLinkingBannerWrapper />
                        {children}
                        <FooterSlot>
                          <Footer />
                        </FooterSlot>
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
