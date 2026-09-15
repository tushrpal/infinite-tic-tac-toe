import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email',
        },
      },
    }),
  ],
  pages: {
    signIn: "/", // Redirect to home page instead of default NextAuth sign-in page
    error: "/", // Redirect errors to home page (prevents error=Callback in URL)
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Called when user successfully authenticates with OAuth provider
      // Always allow sign in - we'll handle player creation on the client
      return true;
    },
    async jwt({ token, account, profile, trigger }) {
      // Add OAuth data to JWT token on initial sign in
      if (account && profile) {
        token.oauthProvider = account.provider;
        token.oauthId = account.providerAccountId;
        token.email = profile.email || (profile as any).email || null;
        token.name = profile.name || (profile as any).name || (profile as any).username || null;

        // Mark that this is a fresh OAuth sign-in
        token.freshOAuth = true;
      } else if (trigger === "update") {
        // Client has finished processing the fresh OAuth callback (linked,
        // logged in, or completed registration) - stop reporting it as fresh
        // so a later remount doesn't re-run OAuth auto-processing.
        token.freshOAuth = false;
      }
      return token;
    },
    async session({ session, token }) {
      // Add OAuth data to session object
      if (token) {
        session.user.oauthProvider = token.oauthProvider as string;
        session.user.oauthId = token.oauthId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.freshOAuth = token.freshOAuth as boolean;
      }
      return session;
    },
  },
};
