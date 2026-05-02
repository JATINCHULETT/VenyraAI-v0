declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oauthAccessToken?: string;
    oauthProvider?: string;
  }
}
