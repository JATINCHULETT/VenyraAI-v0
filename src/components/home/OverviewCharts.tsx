"use client";

import {
  faArrowTrendUp,
  faBolt,
  faCircleCheck,
  faClock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, useReducedMotion } from "framer-motion";

const CONTROL_FAMILIES = [
  { id: "CC1", label: "Control environment", value: 92 },
  { id: "CC2", label: "Communication & info", value: 88 },
  { id: "CC3", label: "Risk assessment", value: 76 },
  { id: "CC4", label: "Monitoring", value: 81 },
  { id: "CC5", label: "Control activities", value: 90 },
  { id: "CC6", label: "Logical access", value: 68 },
  { id: "CC7", label: "System operations", value: 73 },
  { id: "CC8", label: "Change management", value: 84 },
  { id: "CC9", label: "Risk mitigation", value: 79 },
];

const ACTIVITY = [
  { control: "CC6.1", source: "AWS · CloudTrail enabled", when: "2m" },
  { control: "CC8.1", source: "GitHub · branch protection on main", when: "11m" },
  { control: "CC6.6", source: "Okta · MFA enforced org-wide", when: "32m" },
  { control: "CC7.3", source: "Datadog · alert routing verified", when: "1h" },
  { control: "CC6.7", source: "AWS · KMS rotation policy", when: "2h" },
];

const SPARK_POINTS = [62, 65, 64, 68, 71, 70, 73, 75, 74, 77, 80, 82];

/* ---------- Readiness ring (animated SVG) ---------- */
export function ReadinessRing({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="oklch(0.72 0.18 290)" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Outer ambient glow */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="14"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          filter="url(#ringGlow)"
          opacity="0.45"
          transform="rotate(-90 100 100)"
        />

        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="color-mix(in oklch, var(--border) 70%, transparent)"
          strokeWidth="10"
        />

        {/* Foreground arc */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 100 100)"
        />

        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
          const x1 = 100 + Math.cos(angle) * (radius + 14);
          const y1 = 100 + Math.sin(angle) * (radius + 14);
          const x2 = 100 + Math.cos(angle) * (radius + (i % 5 === 0 ? 22 : 18));
          const y2 = 100 + Math.sin(angle) * (radius + (i % 5 === 0 ? 22 : 18));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="color-mix(in oklch, var(--fg-muted) 35%, transparent)"
              strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
              opacity={i % 5 === 0 ? 0.7 : 0.35}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          Readiness
        </p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-1 text-[2.6rem] font-semibold tabular-nums leading-none"
        >
          {Math.round(value)}
          <span className="text-2xl text-[var(--fg-muted)]">%</span>
        </motion.p>
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
          <FontAwesomeIcon icon={faArrowTrendUp} className="h-2.5 w-2.5" />
          +6.4% this week
        </p>
      </div>
    </div>
  );
}

/* ---------- Sparkline (uptime / readiness trend) ---------- */
function Sparkline({ points = SPARK_POINTS }: { points?: number[] }) {
  const w = 200;
  const h = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#sparkArea)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1][0]}
          cy={coords[coords.length - 1][1]}
          r="3"
          fill="var(--accent)"
          className="drop-shadow-[0_0_10px_var(--glow)]"
        />
      )}
    </svg>
  );
}

/* ---------- Control coverage bars ---------- */
function ControlCoverage() {
  return (
    <div className="space-y-2.5">
      {CONTROL_FAMILIES.map((f, i) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04, duration: 0.45 }}
          className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3"
        >
          <span className="font-mono text-[11px] font-semibold text-[var(--fg-muted)]">{f.id}</span>
          <div className="relative h-2 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--border)_45%,transparent)]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-[oklch(0.7_0.16_290)]"
              initial={{ width: 0 }}
              whileInView={{ width: `${f.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.04 }}
            />
          </div>
          <span className="text-right text-[11px] font-semibold tabular-nums text-[var(--fg)]">
            {f.value}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- KPI tile ---------- */
function KPI({
  icon,
  label,
  value,
  hint,
  trend,
}: {
  icon: typeof faBolt;
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_88%,transparent)] p-5 glow-border">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          {label}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-[var(--accent)]">
          <FontAwesomeIcon icon={icon} className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
        {trend && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
            <FontAwesomeIcon icon={faArrowTrendUp} className="h-2.5 w-2.5" />
            {trend}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}

/* ---------- Activity feed ---------- */
function ActivityFeed() {
  return (
    <ul className="space-y-2">
      {ACTIVITY.map((a, i) => (
        <motion.li
          key={`${a.control}-${a.source}`}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[color-mix(in_oklch,var(--bg-elevated)_45%,transparent)] px-3.5 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <FontAwesomeIcon icon={faCircleCheck} className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
            <span className="truncate text-[12.5px]">{a.source}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-[var(--fg-muted)]">
            <span className="rounded-md border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--bg)]/45 px-1.5 py-0.5 font-mono text-[10px] text-[var(--fg)]">
              {a.control}
            </span>
            <span className="tabular-nums">{a.when}</span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/* ---------- Public composition ---------- */
export function OverviewCharts({
  readiness,
  daysRemaining = 11,
}: {
  readiness: number;
  daysRemaining?: number;
}) {
  return (
    <div className="space-y-6">
      {/* Top KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={faBolt}
          label="Readiness"
          value={`${Math.round(readiness)}%`}
          trend="+6.4%"
          hint="vs. last week"
        />
        <KPI
          icon={faShieldHalved}
          label="Controls met"
          value="47 / 58"
          trend="+3"
          hint="this week"
        />
        <KPI
          icon={faClock}
          label="Days to audit"
          value={`${daysRemaining}d`}
          hint="On track"
        />
        <KPI
          icon={faCircleCheck}
          label="Evidence uptime"
          value="99.97%"
          hint="last 30 days"
        />
      </div>

      {/* Hero panel — readiness ring + control coverage */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 glow-border">
          <div className="absolute -top-10 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-15 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                Audit readiness
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                Live
              </span>
            </div>
            <div className="h-[240px]">
              <ReadinessRing value={readiness} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 glow-border">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Control coverage by family
            </p>
            <p className="text-[11px] text-[var(--fg-muted)]">SOC 2 · TSC</p>
          </div>
          <ControlCoverage />
        </div>
      </div>

      {/* Bottom — uptime sparkline + activity */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 glow-border">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                Readiness trend
              </p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums">82%</p>
            </div>
            <p className="text-[11px] text-emerald-500">+12.4% / 12 wks</p>
          </div>
          <Sparkline />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { l: "30d", v: "+8.1%" },
              { l: "7d", v: "+2.4%" },
              { l: "24h", v: "+0.4%" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[var(--bg)]/40 px-2 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  {s.l}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-500">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] p-6 glow-border">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Recent evidence
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              Streaming
            </span>
          </div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
