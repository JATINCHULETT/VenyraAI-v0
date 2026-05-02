"use client";

import {
  faArrowsRotate,
  faCircleCheck,
  faCloudArrowUp,
  faKey,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { faAws, faGithub, faGoogle, faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import { useState } from "react";

const STEPS = [
  { id: "scanning", label: "Scanning document", note: "Indexing evidence" },
  { id: "ocr", label: "OCR pipeline", note: "Extracting text" },
  { id: "llm", label: "LLM pipeline", note: "Control mapping" },
  { id: "report", label: "Audit report", note: "Generate + deliver" },
] as const;

const INTEGRATIONS = [
  { name: "AWS", icon: faAws, status: "connected" as const, scope: "Read-only · 14 services" },
  { name: "GitHub", icon: faGithub, status: "connected" as const, scope: "Read-only · 8 repos" },
  { name: "Okta", icon: faKey, status: "connected" as const, scope: "Read-only · SSO + MFA" },
  { name: "GCP", icon: faGoogle, status: "available" as const, scope: "Connect read-only" },
  { name: "Azure", icon: faMicrosoft, status: "available" as const, scope: "Connect read-only" },
];

const RECENT_FILES = [
  { name: "infosec_policy_v3.pdf", size: "812 KB", when: "2m ago", state: "Analyzed" },
  { name: "vendor_questionnaire.docx", size: "246 KB", when: "8m ago", state: "Mapped to CC9" },
  { name: "MSA_2026.pdf", size: "1.4 MB", when: "1h ago", state: "Indexed" },
];

export function WorkspaceTab({
  email,
  setEmail,
  busy,
  onFiles,
  activeStep,
  progress,
  aiLine,
}: {
  email: string;
  setEmail: (v: string) => void;
  busy: boolean;
  onFiles: (files: FileList | null) => void;
  activeStep: number;
  progress: number;
  aiLine: string;
}) {
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── Upload zone ── */}
      <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 md:p-8 glow-border">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-[var(--accent)]">
              <FontAwesomeIcon icon={faCloudArrowUp} className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight">Drop documents</h3>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                Policies, contracts, questionnaires — TLS in transit.
              </p>
            </div>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full max-w-xs rounded-xl border border-[color-mix(in_oklch,var(--border)_55%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 text-xs outline-none ring-[var(--accent)] transition-shadow focus:ring-2"
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onDragEnter={() => setDrag(true)}
          onDragLeave={() => setDrag(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onFiles(e.dataTransfer.files);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById("venyra-file")?.click();
            }
          }}
          onClick={() => document.getElementById("venyra-file")?.click()}
          className={`mt-5 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 transition-all glow-border-hover ${
            drag
              ? "border-[color-mix(in_oklch,var(--accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)]"
              : "border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/40"
          }`}
        >
          <input
            id="venyra-file"
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => onFiles(e.target.files)}
          />
          {busy ? (
            <div className="w-full max-w-sm space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--border)_42%,transparent)]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[oklch(0.72_0.16_285)] shimmer"
                  initial={false}
                  animate={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>
              <p className="text-center text-sm text-[var(--fg-muted)]">{aiLine}</p>
            </div>
          ) : (
            <>
              <FontAwesomeIcon icon={faCloudArrowUp} className="h-8 w-8 text-[var(--fg-muted)] opacity-70" />
              <p className="mt-3 text-center text-sm font-medium">Drag &amp; drop or click to browse</p>
              <p className="mt-1.5 text-center text-xs text-[var(--fg-muted)]">PDF · Word · plain text</p>
            </>
          )}
        </div>

        {/* Recent uploads inline */}
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            Recently processed
          </p>
          <ul className="mt-2 space-y-1.5">
            {RECENT_FILES.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_32%,transparent)] bg-[var(--bg)]/40 px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                  <span className="truncate text-[12.5px] font-medium">{f.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-[var(--fg-muted)]">
                  <span className="hidden sm:inline">{f.state}</span>
                  <span className="tabular-nums">{f.size}</span>
                  <span className="tabular-nums">{f.when}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Pipeline progress directly under upload ── */}
      <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 md:p-7 glow-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Processing pipeline
            </p>
            <p className="mt-1.5 text-sm text-[var(--fg-muted)]">{aiLine}</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-[var(--accent)]">
            {Math.round(progress)}%
          </p>
        </div>

        <div className="relative mt-7">
          <div className="absolute left-0 right-0 top-[15px] h-px bg-[color-mix(in_oklch,var(--border)_60%,transparent)] md:top-[19px]" />
          <motion.div
            className="absolute left-0 top-[15px] h-px bg-gradient-to-r from-[var(--accent)] to-[oklch(0.7_0.16_290)] md:top-[19px]"
            initial={false}
            animate={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
            transition={{ type: "spring", stiffness: 130, damping: 22 }}
          />

          <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-3">
            {STEPS.map((step, i) => {
              const done = i < activeStep;
              const current = i === activeStep;
              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <motion.div
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border md:h-10 md:w-10 ${
                      current
                        ? "border-[color-mix(in_oklch,var(--accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-[var(--accent)]"
                        : done
                          ? "border-[color-mix(in_oklch,var(--accent)_38%,transparent)] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] text-[var(--accent)]"
                          : "border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/45 text-[var(--fg-muted)]"
                    }`}
                    animate={
                      current
                        ? {
                            boxShadow: [
                              "0 0 0 0 var(--glow-soft)",
                              "0 0 36px 0 var(--glow-soft)",
                              "0 0 0 0 var(--glow-soft)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2.4, repeat: current ? Infinity : 0, ease: "easeInOut" }}
                  >
                    {done && !current && <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />}
                    {current && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                      >
                        <FontAwesomeIcon icon={faArrowsRotate} className="h-4 w-4" />
                      </motion.span>
                    )}
                    {!done && !current && (
                      <span className="text-[11px] font-semibold tabular-nums">{i + 1}</span>
                    )}
                  </motion.div>
                  <p
                    className={`mt-3 text-[12px] font-semibold leading-snug ${
                      current ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--fg-muted)]">{step.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Integrations ── */}
      <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 md:p-7 glow-border">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Connected sources
            </p>
            <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
              Read-only API streams — least-privilege scopes.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            3 live
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {INTEGRATIONS.map((i) => {
            const isConnected = i.status === "connected";
            return (
              <motion.button
                key={i.name}
                type="button"
                whileHover={{ y: -2 }}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[var(--bg)]/45 p-3.5 text-left glow-border-hover"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--card)_90%,transparent)] text-[var(--fg-muted)]">
                    <FontAwesomeIcon icon={i.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{i.name}</p>
                    <p className="truncate text-[11px] text-[var(--fg-muted)]">{i.scope}</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color-mix(in_oklch,var(--border)_55%,transparent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fg-muted)] transition-colors group-hover:border-[color-mix(in_oklch,var(--accent)_45%,transparent)] group-hover:text-[var(--accent)]">
                    <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                    Connect
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
