"use client";

import { faArrowRight, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

/** Brighter teal so rings / labels read on dark hero cards (matches landing DPDP neon) */
const DPDP_TEAL = "#00d4be";
const DPDP_SLATE = "#2c3e50";

/* -- SCENE: India DPDP obligation map (teal accent) -- */
function DpdpScene() {
  return (
    <div className="relative h-full w-full scene-orbit">
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${28 + i * 20}%`,
              height: `${28 + i * 20}%`,
              borderColor: `${DPDP_TEAL}${i === 0 ? "66" : "33"}`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 48 + i * 24, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute h-2 w-2 rounded-full shadow-[0_0_14px_rgba(26,188,156,0.55)]"
              style={{
                background: DPDP_TEAL,
                top: i === 0 ? "6%" : i === 1 ? "14%" : i === 2 ? "22%" : "34%",
                left: i === 0 ? "88%" : i === 1 ? "10%" : i === 2 ? "78%" : "16%",
              }}
            />
          </motion.div>
        ))}

        <motion.div
          className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full text-center shadow-[0_0_48px_rgba(26,188,156,0.35)]"
          style={{ background: `linear-gradient(145deg, ${DPDP_SLATE} 0%, ${DPDP_TEAL} 100%)` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[10px] font-bold uppercase leading-tight tracking-widest text-white">
            India
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/95">DPDP</span>
        </motion.div>
      </div>

      <div
        className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: DPDP_TEAL }}
      >
        Notice & consent
      </div>
      <div className="absolute right-5 top-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        Data principal rights
      </div>
      <div className="absolute bottom-5 left-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        Cross-border transfers
      </div>
      <div
        className="absolute bottom-5 right-5 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: DPDP_TEAL }}
      >
        Security safeguards
      </div>
    </div>
  );
}

/* -- SCENE: orbital control map (used by AI engine story) -- */
function OrbitScene() {
  return (
    <div className="relative h-full w-full scene-orbit">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* concentric rings */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[color-mix(in_oklch,var(--accent)_40%,transparent)]"
            style={{
              width: `${30 + i * 22}%`,
              height: `${30 + i * 22}%`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 60 + i * 30, repeat: Infinity, ease: "linear" }}
          >
            {/* node on ring */}
            <span
              className="absolute h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_16px_var(--glow)]"
              style={{
                top: i === 0 ? "8%" : i === 1 ? "12%" : i === 2 ? "20%" : "38%",
                left: i === 0 ? "92%" : i === 1 ? "8%" : i === 2 ? "82%" : "12%",
              }}
            />
          </motion.div>
        ))}

        {/* core */}
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_0_60px_var(--glow)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs font-semibold tracking-widest">SOC 2</span>
        </motion.div>
      </div>

      {/* corner labels */}
      <div className="absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        CC1 — Control environment
      </div>
      <div className="absolute right-5 top-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        CC6 — Logical access
      </div>
      <div className="absolute bottom-5 left-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        CC7 — System operations
      </div>
      <div className="absolute bottom-5 right-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        CC9 — Risk mitigation
      </div>
    </div>
  );
}

/* -- SCENE: live evidence stream (continuous evidence) -- */
function EvidenceScene() {
  const rows = [
    { source: "AWS · CloudTrail", control: "CC6.1", time: "now" },
    { source: "GitHub · branch protection", control: "CC8.1", time: "12s" },
    { source: "Okta · MFA enforcement", control: "CC6.6", time: "1m" },
    { source: "AWS · KMS rotation", control: "CC6.7", time: "3m" },
    { source: "Datadog · alerting", control: "CC7.3", time: "5m" },
  ];

  return (
    <div className="relative h-full w-full scene-grid p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)]/55" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
          <span className="font-semibold uppercase tracking-[0.18em]">Live evidence stream</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            Streaming
          </span>
        </div>

        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <motion.li
              key={r.source}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg-elevated)_60%,transparent)] px-3.5 py-2.5 backdrop-blur-md"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="truncate text-[12.5px] font-medium">{r.source}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] text-[var(--fg-muted)]">
                <span className="rounded-md border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--bg)]/45 px-1.5 py-0.5 font-mono text-[10px]">
                  {r.control}
                </span>
                <span className="tabular-nums">{r.time}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StorySection({
  eyebrow,
  headline,
  body,
  bullets,
  scene,
  reverse = false,
  sectionId,
  ctaHref = "#pricing",
}: {
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
  bullets?: string[];
  scene: React.ReactNode;
  reverse?: boolean;
  sectionId?: string;
  ctaHref?: string;
}) {
  return (
    <section id={sectionId} className="relative scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className={reverse ? "lg:order-2" : ""}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-[2.5rem]">
            {headline}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--fg-muted)] md:text-lg">
            {body}
          </p>
          {bullets && (
            <ul className="mt-7 space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--fg-muted)] md:text-[0.95rem]">
                  <FontAwesomeIcon icon={faCircleCheck} className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <a
            href={ctaHref}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            See how it works
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className={`story-card aspect-[5/4] w-full ${reverse ? "lg:order-1" : ""}`}
        >
          {scene}
        </motion.div>
      </div>
    </section>
  );
}

export function StorySections() {
  return (
    <>
      <StorySection
        eyebrow="AI analysis engine"
        headline={
          <>
            Every control, mapped.
            <br />
            <span className="bg-gradient-to-r from-[var(--accent)] via-[oklch(0.74_0.2_290)] to-[var(--accent)] bg-clip-text text-transparent">
              Continuously.
            </span>
          </>
        }
        body="Venyra reads your stack, your policies, and your contracts—then produces a living map of every Trust Services Criteria control and where the evidence lives."
        bullets={[
          "Auto-drafted policies in your brand voice",
          "Plain-English narratives per control",
          "Gaps surfaced before your auditor sees them",
        ]}
        scene={<OrbitScene />}
      />

      <StorySection
        reverse
        eyebrow="Continuous evidence"
        headline={
          <>
            A live audit room.
            <br />
            Not a last-minute scramble.
          </>
        }
        body="Read-only integrations stream proof from AWS, GitHub, Okta and more—timestamped, attributed, and ready to ship to your auditor anytime."
        bullets={[
          "Read-only, least-privilege scopes",
          "Versioned, exportable artifacts",
          "Always-on readiness with clear % complete",
        ]}
        scene={<EvidenceScene />}
      />

      <StorySection
        sectionId="dpdp"
        eyebrow="India DPDP · Digital Personal Data Protection Act, 2023"
        headline={
          <>
            Privacy law with teeth.
            <br />
            <span
              className="bg-gradient-to-r from-[#1abc9c] via-[#2c3e50] to-[#1abc9c] bg-clip-text text-transparent dark:from-[#1abc9c] dark:via-[#5eead4] dark:to-[#1abc9c]"
            >
              Mapped like a control framework.
            </span>
          </>
        }
        body="The DPDP Act applies to digital personal data processed in India—and to overseas processors serving Indian users. Venyra keeps DPDP analysis in a dedicated workspace: upload privacy notices, records of processing, or policies and receive gap narratives aligned to lawful basis, notice, consent, purpose limitation, retention, security, data principal rights, children’s data, cross-border transfers, and Significant Data Fiduciary duties where relevant."
        bullets={[
          "Segregated DPDP vault—never mixed with SOC 2 exports",
          "Theme-level gap reports your counsel can trace to the Act",
          "Same OCR → LLM pipeline you trust for audit evidence",
        ]}
        scene={<DpdpScene />}
        ctaHref="#contact"
      />
    </>
  );
}
