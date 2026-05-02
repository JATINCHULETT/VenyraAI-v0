import Link from "next/link";
import { Suspense } from "react";
import { getOauthProviderFlags } from "@/lib/auth-provider-flags";
import { AuthSignInForm } from "./signin-form";

/** Read AUTH_* at request time so Vercel production picks up dashboard env after deploy (not build-time static snapshot). */
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const oauth = getOauthProviderFlags();
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--fg)]">
      <div className="w-full max-w-md rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-8 shadow-[0_0_60px_-24px_var(--glow)]">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          OAuth via NextAuth or email with Supabase — same portal after login.
        </p>
        <Suspense
          fallback={<p className="mt-6 text-sm text-[var(--fg-muted)]">Loading sign-in…</p>}
        >
          <AuthSignInForm oauth={oauth} supabaseReady={supabaseReady} />
        </Suspense>
        <p className="mt-6 text-center text-xs text-[var(--fg-muted)]">
          No account?{" "}
          <Link href="/auth/signup" className="font-semibold text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]">
            ← Back to Venyra
          </Link>
        </p>
      </div>
    </div>
  );
}
