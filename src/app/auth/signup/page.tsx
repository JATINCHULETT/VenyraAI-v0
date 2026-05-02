import Link from "next/link";
import { getOauthProviderFlags } from "@/lib/auth-provider-flags";
import { AuthSignUpForm } from "./signup-form";

/** Same as sign-in: env-driven OAuth flags must not be frozen at static build. */
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const oauth = getOauthProviderFlags();
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--fg)]">
      <div className="w-full max-w-md rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-8 shadow-[0_0_60px_-24px_var(--glow)]">
        <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Sign up with Supabase email/password or use the same OAuth providers as sign-in.
        </p>
        <AuthSignUpForm oauth={oauth} supabaseReady={supabaseReady} />
        <p className="mt-6 text-center text-xs text-[var(--fg-muted)]">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
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
