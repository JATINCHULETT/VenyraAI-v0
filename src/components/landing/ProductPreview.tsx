"use client";

import {
  faArrowsRotate,
  faBoxArchive,
  faChartPie,
  faCircleCheck,
  faCloudArrowUp,
  faDiagramProject,
  faDownload,
  faMagnifyingGlass,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

const NAV = [
  { icon: faChartPie, label: "Overview", active: true },
  { icon: faCloudArrowUp, label: "Documents" },
  { icon: faDiagramProject, label: "Progress" },
  { icon: faBoxArchive, label: "Output" },
];

const FILES = [
  { name: "SOC2_Evidence.zip", size: "24.8 MB", when: "Today, 14:02" },
  { name: "Policies.pdf", size: "1.2 MB", when: "Today, 13:48" },
  { name: "Audit_Checklist.csv", size: "312 KB", when: "Yesterday" },
];

const STAGES = ["Scan infra", "Map controls", "Draft policies", "Auditor ready"];

export function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full"
    >
      <div className="surface relative overflow-hidden rounded-[1.25rem]">
        {/* macOS-style top chrome */}
        <div className="flex items-center gap-2 border-b border-[color-mix(in_oklch,var(--border)_55%,transparent)] bg-[color-mix(in_oklch,var(--card)_92%,transparent)] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex h-6 flex-1 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--bg)_75%,transparent)] px-3 text-[10.5px] tracking-wide text-[var(--fg-muted)]">
            app.venyra.ai / overview
          </div>
        </div>

        <div className="grid grid-cols-[180px_minmax(0,1fr)] sm:grid-cols-[200px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-r border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--card)_70%,var(--bg)_30%)] p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-2 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3" />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold">Acme Corp</p>
                <p className="text-[9px] text-[var(--fg-muted)]">SOC 2 Type II</p>
              </div>
            </div>
            <nav className="space-y-0.5">
              {NAV.map((n) => (
                <div
                  key={n.label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[11px] ${
                    n.active
                      ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] font-medium text-[var(--fg)]"
                      : "text-[var(--fg-muted)]"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={n.icon}
                    className={`h-3 w-3 ${n.active ? "text-[var(--accent)]" : ""}`}
                  />
                  {n.label}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <div className="p-4 sm:p-5">
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_70%,transparent)] px-2.5 py-1.5">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3 text-[var(--fg-muted)]" />
                <input
                  className="w-32 bg-transparent text-[11px] outline-none placeholder:text-[var(--fg-muted)] sm:w-44"
                  placeholder="Search controls, evidence…"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  Active
                </span>
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[oklch(0.55_0.18_290)]" />
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Readiness", value: "82%", trend: "+6.4%" },
                { label: "Controls met", value: "47/58", trend: "+3" },
                { label: "Evidence", value: "212", trend: "fresh" },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] p-2.5"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    {k.label}
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums sm:text-lg">{k.value}</p>
                  <p className="text-[9.5px] text-emerald-500 dark:text-emerald-400">{k.trend}</p>
                </div>
              ))}
            </div>

            {/* Pipeline */}
            <div className="mt-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] p-3">
              <div className="mb-3 flex items-center justify-between text-[10px]">
                <span className="font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  Pipeline
                </span>
                <span className="font-semibold text-[var(--accent)]">Drafting policies…</span>
              </div>
              <div className="relative">
                <div className="absolute left-0 right-0 top-[11px] h-px bg-[color-mix(in_oklch,var(--border)_60%,transparent)]" />
                <motion.div
                  className="absolute left-0 top-[11px] h-px bg-gradient-to-r from-[var(--accent)] to-[oklch(0.7_0.16_290)]"
                  initial={{ width: "20%" }}
                  whileInView={{ width: "66%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                />
                <div className="relative flex justify-between">
                  {STAGES.map((s, i) => {
                    const done = i < 2;
                    const current = i === 2;
                    return (
                      <div key={s} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[8px] ${
                            current
                              ? "border-[color-mix(in_oklch,var(--accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-[var(--accent)] shadow-[0_0_18px_-4px_var(--glow-soft)]"
                              : done
                                ? "border-[color-mix(in_oklch,var(--accent)_30%,transparent)] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] text-[var(--accent)]"
                                : "border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_60%,transparent)] text-[var(--fg-muted)]"
                          }`}
                        >
                          {done && <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5" />}
                          {current && (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                            >
                              <FontAwesomeIcon icon={faArrowsRotate} className="h-2.5 w-2.5" />
                            </motion.span>
                          )}
                          {!done && !current && <span>{i + 1}</span>}
                        </div>
                        <p className="text-[9px] text-[var(--fg-muted)]">{s}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* File row */}
            <div className="mt-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Output room
              </p>
              <ul className="mt-2 space-y-1.5">
                {FILES.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border border-[color-mix(in_oklch,var(--border)_30%,transparent)] bg-[color-mix(in_oklch,var(--card)_60%,transparent)] px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium">{f.name}</p>
                      <p className="text-[9.5px] text-[var(--fg-muted)]">
                        {f.size} · {f.when}
                      </p>
                    </div>
                    <FontAwesomeIcon icon={faDownload} className="h-3 w-3 text-[var(--fg-muted)]" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Floor reflection / pedestal */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-[80%] -translate-x-1/2 rounded-[100%] bg-[color-mix(in_oklch,var(--accent)_28%,transparent)] opacity-50 blur-3xl"
        aria-hidden
      />
    </motion.div>
  );
}
