"use client";

import {
  faArrowRight,
  faCheck,
  faCircleUser,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { VenyraLogoMark } from "@/components/brand/VenyraLogoMark";
import { useAppAuth } from "@/components/providers/app-auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeroScene } from "./HeroScene";
import { LandingContactForm } from "./LandingContactForm";
import { ProductPreview } from "./ProductPreview";
import { StorySections } from "./StorySections";

const navLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#dpdp", label: "India DPDP" },
  { href: "#different", label: "Why Venyra" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.07 * i,
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

/** High-contrast DPDP accent: readable on light bg + “neon” pop in dark mode */
const DPDP_TEXT = "text-[#047857] dark:text-[#6af3e0] dark:[text-shadow:0_0_18px_rgba(106,243,224,0.55),0_0_36px_rgba(20,184,166,0.28)]";

const COMPARE_ROWS = [
  { label: "Time to audit-ready", manual: "3–6 months", venyra: "Days" },
  { label: "Pricing model", manual: "Hourly retainer", venyra: "Fixed outcome" },
  { label: "Evidence collection", manual: "Email + screenshots", venyra: "Read-only API streams" },
  { label: "Control mapping", manual: "Spreadsheets", venyra: "AI, continuous" },
  { label: "Policy drafting", manual: "Templates + edits", venyra: "Generated, branded, versioned" },
  { label: "Audit readiness signal", manual: "Best guess", venyra: "Live % complete" },
  {
    label: "India DPDP (2023 Act)",
    manual: "Ad-hoc legal reviews",
    venyra: "Dedicated DPDP workspace · segregated outputs",
  },
  {
    label: "Cross-border & consent posture",
    manual: "Static policies",
    venyra: "LLM gap reports mapped to DPDP themes",
  },
];

export function LandingPage() {
  const { user, loading: authLoading } = useAppAuth();
  const portalHref = user ? "/home" : "/auth/signin?callbackUrl=/home";
  const displayName =
    user?.name?.trim() || user?.email?.trim() || "Account";
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.45]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      {/* ========== HERO ========== */}
      <section ref={heroRef} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
        <HeroScene />

        {/* Floating glass nav */}
        <div className="relative z-30 px-4 pt-5 sm:px-6 sm:pt-7">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full glass-pill px-3.5 py-2.5 sm:px-5">
            <Link href="/" className="group flex items-center gap-2.5 pl-1">
              <VenyraLogoMark
                size={32}
                priority
                className="shadow-[0_0_22px_-4px_var(--glow-soft)] ring-1 ring-[color-mix(in_oklch,var(--border)_30%,transparent)]"
              />
              <span className="text-sm font-semibold tracking-tight">Venyra</span>
            </Link>

            <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-[13px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <ThemeToggle className="h-9 w-9" />
              {authLoading ? (
                <span
                  className="h-9 w-24 shrink-0 rounded-full bg-[color-mix(in_oklch,var(--fg-muted)_12%,transparent)] motion-safe:animate-pulse"
                  aria-hidden
                />
              ) : user ? (
                <Link
                  href="/home"
                  className="inline-flex h-9 max-w-[min(14rem,calc(100vw-12rem))] items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_70%,transparent)] pl-2.5 pr-3 text-xs font-medium text-[var(--fg)] transition-colors hover:border-[color-mix(in_oklch,var(--accent)_35%,transparent)]"
                  title={user.email ?? user.name ?? undefined}
                >
                  <FontAwesomeIcon
                    icon={faCircleUser}
                    className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]"
                  />
                  <span className="truncate">{displayName}</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="rounded-full px-3 py-2 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-full border border-[color-mix(in_oklch,var(--border)_55%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--fg)] transition-colors hover:border-[color-mix(in_oklch,var(--accent)_40%,transparent)]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-20 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-20"
        >
          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-7 inline-flex flex-wrap items-center justify-center gap-0 rounded-full glass-pill px-1 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
          >
            <motion.span
              className="relative flex items-center gap-2 rounded-full py-1 pl-3 pr-2"
              animate={
                reduce
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 0 0 rgba(124, 58, 237, 0.55)",
                        "0 0 0 12px rgba(124, 58, 237, 0)",
                        "0 0 0 0 rgba(124, 58, 237, 0)",
                      ],
                    }
              }
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
            >
              <span
                className="absolute inset-0 rounded-full bg-[color-mix(in_oklch,var(--accent)_16%,transparent)]"
                aria-hidden
              />
              <motion.span
                className="relative flex h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_14px_var(--glow)]"
                animate={
                  reduce
                    ? undefined
                    : { scale: [1, 1.4, 1], opacity: [0.85, 1, 0.85] }
                }
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative text-[var(--fg-muted)]">SOC 2 Type II</span>
            </motion.span>
            <span className="hidden text-[var(--fg-muted)] opacity-40 sm:inline" aria-hidden>
              ·
            </span>
            <motion.span
              className="relative rounded-full px-3 py-1"
              animate={
                reduce
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 0 0 rgba(0, 232, 198, 0.55)",
                        "0 0 0 12px rgba(0, 232, 198, 0)",
                        "0 0 0 0 rgba(0, 232, 198, 0)",
                      ],
                    }
              }
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
            >
              <span
                className="absolute inset-0 rounded-full bg-[#14b8a6]/22 dark:bg-[#0f766e]/45"
                aria-hidden
              />
              <span className={`relative font-bold tracking-[0.22em] ${DPDP_TEXT}`}>India DPDP</span>
            </motion.span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-balance text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5rem]"
          >
            <motion.span
              className="inline-block"
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              Compliance that scales,
            </motion.span>
            <br />
            <span className="italic font-normal text-[var(--fg)]">from SOC 2 to </span>
            <span className={`italic font-normal ${DPDP_TEXT}`}>DPDP</span>
            <span className="italic font-normal text-[var(--fg)]">.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-[var(--fg-muted)] md:text-lg"
          >
            Upload your docs. Our AI maps TSC controls for SOC 2 and DPDP obligations for India—separate
            workspaces, same OCR pipeline, auditor- and counsel-ready packages in days.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-3"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={portalHref}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_8px_32px_-8px_var(--glow)] transition-shadow hover:shadow-[0_12px_48px_-6px_var(--glow)]"
              >
                Start compliance
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>
            <motion.a
              href="#platform"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full glass-pill px-7 py-3.5 text-sm font-medium text-[var(--fg)]"
            >
              See the platform
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Product preview peek */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="relative z-20 mx-auto -mb-24 w-full max-w-4xl px-5 sm:-mb-32 sm:px-8"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <ProductPreview />
          </motion.div>
        </motion.div>
      </section>

      {/* Spacer for the peeking preview */}
      <div className="h-28 sm:h-36" />

      {/* ========== STORYTELLING ========== */}
      <div id="platform">
        <StorySections />
      </div>

      {/* ========== WHY WE'RE DIFFERENT — minimal comparison ========== */}
      <section
        id="different"
        className="relative border-t border-[color-mix(in_oklch,var(--border)_35%,transparent)] bg-[var(--bg)] px-5 py-24 md:px-8 md:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Why we&apos;re different
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-[2.5rem]">
              Built for outcomes, not activity.
            </h2>
            <p className="mt-5 text-[var(--fg-muted)] md:text-lg">
              Most compliance tools manage your work. Venyra does the work — and proves it.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--card)_88%,transparent)] glow-border"
          >
            {/* Header row */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-[color-mix(in_oklch,var(--border)_45%,transparent)] px-5 py-4 sm:px-8 sm:py-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                &nbsp;
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                Manual / consultants
              </span>
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                <VenyraLogoMark size={18} className="rounded-md ring-1 ring-[color-mix(in_oklch,var(--border)_35%,transparent)]" />
                Venyra
              </span>
            </div>

            {COMPARE_ROWS.map((row, i) => {
              const dpdpHighlight =
                row.label.includes("DPDP") || row.label.includes("Cross-border");
              return (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.05, duration: 0.55 }}
                className={`grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-5 py-4 sm:px-8 sm:py-5 ${
                  dpdpHighlight
                    ? "border-l-[3px] border-l-[#14b8a6] bg-teal-500/[0.09] dark:border-l-[#5dffdf] dark:bg-[#5dffdf]/[0.12]"
                    : ""
                } ${
                  i !== COMPARE_ROWS.length - 1
                    ? "border-b border-[color-mix(in_oklch,var(--border)_28%,transparent)]"
                    : ""
                }`}
              >
                <span className="text-sm font-medium text-[var(--fg)] md:text-[0.95rem]">
                  {row.label}
                </span>
                <span className="flex items-center gap-2 text-sm text-[var(--fg-muted)] md:text-[0.95rem]">
                  <FontAwesomeIcon
                    icon={faMinus}
                    className="h-2.5 w-2.5 text-[color-mix(in_oklch,var(--fg-muted)_60%,transparent)]"
                  />
                  {row.manual}
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--fg)] md:text-[0.95rem]">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={`h-3 w-3 ${dpdpHighlight ? "text-[#0d9488] dark:text-[#6af3e0]" : "text-[var(--accent)]"}`}
                  />
                  {row.venyra}
                </span>
              </motion.div>
            );
            })}
          </motion.div>
        </div>
      </section>

      {/* ========== PRICING CTA ========== */}
      <section id="pricing" className="bg-[var(--bg)] px-5 py-28 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[color-mix(in_oklch,var(--accent)_30%,transparent)] bg-[color-mix(in_oklch,var(--card)_82%,var(--accent)_8%)] p-10 text-center md:p-14 glow-border"
        >
          <div className="absolute -top-20 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-25 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--fg-muted)]">
              Outcome pricing
            </p>
            <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-[2.25rem]">
              One transparent price.
              <br />
              Auditor-ready outputs.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--fg-muted)]">
              Every artifact dated, attributed, and exportable. Cancel anytime.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={portalHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_8px_32px_-8px_var(--glow)]"
                >
                  Open client portal
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </Link>
              </motion.div>
              <a
                href="#platform"
                className="text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                or revisit the platform →
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== CONTACT ========== */}
      <section
        id="contact"
        className="scroll-mt-24 border-t border-[color-mix(in_oklch,var(--border)_35%,transparent)] bg-[var(--bg)] px-5 py-24 md:px-8 md:py-28"
      >
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${DPDP_TEXT}`}>
              Contact us
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight md:text-[2.35rem]">
              Talk to the team about SOC 2, DPDP, or a guided demo.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--fg-muted)] md:text-lg">
              Share your work email and a short note. We read every message and respond from a human inbox—no
              automated ticket spam.
            </p>
          </motion.div>
          <LandingContactForm />
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-[color-mix(in_oklch,var(--border)_35%,transparent)] bg-[var(--bg)] px-5 py-12 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-[var(--fg-muted)] md:flex-row">
          <div className="flex items-center gap-2.5">
            <VenyraLogoMark size={28} className="rounded-lg ring-1 ring-[color-mix(in_oklch,var(--border)_30%,transparent)]" />
            <p>© {new Date().getFullYear()} Venyra AI. Inevitable execution.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-2" aria-label="Footer">
            <a
              href="#contact"
              className="transition-colors hover:text-[#0d9488] dark:hover:text-[#6af3e0]"
            >
              Contact
            </a>
            {["Privacy", "Security", "Terms", "Trust"].map((t) => (
              <a key={t} href="#" className="transition-colors hover:text-[var(--fg)]">
                {t}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
