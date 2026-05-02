"use client";

import { faGithub, faGoogle, faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OauthProviderFlags } from "@/lib/auth-provider-flags";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthSignUpForm({
  oauth,
  supabaseReady,
}: {
  oauth: OauthProviderFlags;
  supabaseReady: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const oauthHint =
    !oauth.google || !oauth.github
      ? "Add AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET and AUTH_GITHUB_ID / AUTH_GITHUB_SECRET (e.g. .env.local or Vercel), then redeploy or restart dev."
      : null;

  const onSignUp = async () => {
    if (!supabaseReady) {
      setError("Supabase browser keys are not configured.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/home` : undefined,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Check your email to confirm, or sign in if confirmation is disabled.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  };

  const oauthBtnClass =
    "flex items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/50 py-2.5 text-sm font-medium transition-colors hover:border-[color-mix(in_oklch,var(--accent)_40%,transparent)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[color-mix(in_oklch,var(--border)_50%,transparent)]";

  return (
    <div className="mt-6 space-y-4">
      {oauthHint && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          {oauthHint}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!oauth.google}
          title={
            oauth.google
              ? undefined
              : "Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET for localhost (.env.local) or Vercel."
          }
          onClick={() => void signIn("google", { callbackUrl: "/home" })}
          className={oauthBtnClass}
        >
          <FontAwesomeIcon icon={faGoogle} className="h-4 w-4" />
          Sign up with Google
        </button>
        <button
          type="button"
          disabled={!oauth.github}
          title={
            oauth.github
              ? undefined
              : "Set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET for localhost (.env.local) or Vercel."
          }
          onClick={() => void signIn("github", { callbackUrl: "/home" })}
          className={oauthBtnClass}
        >
          <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
          Sign up with GitHub
        </button>
        {oauth.microsoftEntra && (
          <button
            type="button"
            onClick={() => void signIn("microsoft-entra-id", { callbackUrl: "/home" })}
            className="flex items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/50 py-2.5 text-sm font-medium transition-colors hover:border-[color-mix(in_oklch,var(--accent)_40%,transparent)]"
          >
            <FontAwesomeIcon icon={faMicrosoft} className="h-4 w-4" />
            Sign up with Microsoft
          </button>
        )}
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[color-mix(in_oklch,var(--border)_40%,transparent)]" />
        </div>
        <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          <span className="bg-[color-mix(in_oklch,var(--card)_90%,transparent)] px-2">or email</span>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_55%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_55%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
        {message && <p className="text-xs text-emerald-600 dark:text-emerald-400">{message}</p>}
        <button
          type="button"
          disabled={busy || !supabaseReady}
          onClick={() => void onSignUp()}
          className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_0_28px_-10px_var(--glow)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        {!supabaseReady && (
          <p className="text-xs text-[var(--fg-muted)]">
            Set <code className="text-[11px]">NEXT_PUBLIC_SUPABASE_*</code> for email sign-up.
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[var(--fg-muted)]">
        <Link href="/home" className="hover:text-[var(--fg)]">
          Continue without signing in →
        </Link>
      </p>
    </div>
  );
}
