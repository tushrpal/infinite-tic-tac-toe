import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      oauthProvider?: string;
      oauthId?: string;
      freshOAuth?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oauthProvider?: string;
    oauthId?: string;
    email?: string;
    name?: string;
    freshOAuth?: boolean;
  }
}
