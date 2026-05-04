"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useState } from "react";

export function LandingContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/landing-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setDone(true);
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={(ev) => void onSubmit(ev)}
      className="mx-auto mt-10 max-w-lg space-y-4 text-left"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Name
          </span>
          <input
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--bg)_70%,transparent)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[color-mix(in_oklch,var(--accent)_45%,transparent)]"
            placeholder="Your name"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Work email
          </span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--bg)_70%,transparent)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[color-mix(in_oklch,var(--accent)_45%,transparent)]"
            placeholder="you@company.com"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          Company <span className="font-normal normal-case text-[var(--fg-muted)]">(optional)</span>
        </span>
        <input
          name="company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--bg)_70%,transparent)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[color-mix(in_oklch,var(--accent)_45%,transparent)]"
          placeholder="Organization"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          How can we help?
        </span>
        <textarea
          required
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--bg)_70%,transparent)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[color-mix(in_oklch,var(--accent)_45%,transparent)]"
          placeholder="SOC 2 timeline, DPDP scope, demo request…"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Thanks — we received your note and will reach out from the team inbox.
        </p>
      ) : null}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_8px_32px_-8px_var(--glow)] disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Sending…" : "Send message"}
          <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
        </button>
      </motion.div>
    </motion.form>
  );
}
