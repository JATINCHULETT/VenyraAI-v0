/**
 * NextAuth (Auth.js) — Google & GitHub OAuth
 *
 * Register these redirect URIs in Google Cloud Console and GitHub OAuth App settings:
 *
 * Local dev:
 *   http://localhost:3000/api/auth/callback/google
 *   http://localhost:3000/api/auth/callback/github
 *
 * Vercel (this deployment):
 *   https://venyra-ai-v0.vercel.app/api/auth/callback/google
 *   https://venyra-ai-v0.vercel.app/api/auth/callback/github
 *
 * If you use a custom domain, add the same path on that host (e.g. https://app.venyra.ai/api/auth/callback/google).
 *
 * Vercel env: AUTH_URL=https://venyra-ai-v0.vercel.app (no trailing slash). trustHost allows host inference too.
 *
 * @see https://github.com/nextauthjs/next-auth/blob/v4/packages/next-auth/src/providers/google.ts (v4 reference)
 * @see https://github.com/nextauthjs/next-auth/blob/v4/packages/next-auth/src/providers/github.ts (v4 reference)
 */
import type { AuthConfig } from "@auth/core";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const providers: AuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      issuer: "https://accounts.google.com",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      issuer: "https://github.com/login/oauth",
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          scope: "read:user user:email",
        },
      },
      token: "https://github.com/login/oauth/access_token",
    }),
  );
}

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          scope:
            "openid profile email offline_access User.Read https://management.azure.com/user_impersonation",
        },
      },
    }),
  );
}

export const authConfig = {
  providers,
  /** Required in production; set AUTH_SECRET on Vercel and locally. */
  secret: process.env.AUTH_SECRET,
  /**
   * Required on Vercel so OAuth callbacks and cookies use https://YOUR_DEPLOYMENT.vercel.app
   * (incoming Host + proto). Still set AUTH_URL in Vercel for stable absolute URLs.
   */
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.oauthAccessToken = account.access_token;
        token.oauthProvider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.oauthAccessToken) {
        return {
          ...session,
          accessToken: token.oauthAccessToken as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies AuthConfig;

// Callable at runtime; `moduleResolution: "bundler"` can lose the call signature on the default export.
// @ts-expect-error — NextAuth default export
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
