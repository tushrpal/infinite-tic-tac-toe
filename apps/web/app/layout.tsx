import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PlayerProvider } from "@/components/providers/PlayerProvider";
import { Navigation } from "@/components/layout/Navigation";

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
        <AuthProvider>
          <ThemeProvider defaultThemeId="dark">
            <ToastProvider>
              <PlayerProvider>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  {children}
                </div>
              </PlayerProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
