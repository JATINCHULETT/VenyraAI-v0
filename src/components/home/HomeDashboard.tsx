"use client";

import {
  faArrowRight,
  faBoxArchive,
  faChartPie,
  faChevronDown,
  faChevronRight,
  faCircleUser,
  faDownload,
  faEnvelope,
  faLayerGroup,
  faMagnifyingGlass,
  faShieldHalved,
  faStethoscope,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api } from "@/lib/api";
import { OverviewCharts } from "./OverviewCharts";
import { WorkspaceTab } from "./WorkspaceTab";

type Section = "overview" | "workspace" | "output";

const STEPS = [
  { id: "scan", label: "Scanning infrastructure" },
  { id: "map", label: "Mapping controls" },
  { id: "draft", label: "Drafting policies" },
  { id: "audit", label: "Ready for auditor" },
] as const;

const AI_LINES = [
  "Reviewing your infrastructure…",
  "Drafting security policies…",
  "Correlating evidence to CC families…",
  "Almost ready for audit…",
  "Packaging auditor deliverables…",
];

const OUTPUT_FILES = [
  { name: "Evidence.zip", size: "24 MB", when: "Generated today" },
  { name: "Policies.pdf", size: "1.2 MB", when: "Generated today" },
  { name: "Audit checklist", size: "312 KB", when: "Generated yesterday" },
  { name: "SOC 2 report (draft)", size: "5.6 MB", when: "Generated yesterday" },
];

const NAV: { id: Section; label: string; icon: typeof faChartPie }[] = [
  { id: "overview", label: "Overview", icon: faChartPie },
  { id: "workspace", label: "Workspace", icon: faLayerGroup },
  { id: "output", label: "Output", icon: faBoxArchive },
];

function OutputVault({ dense = false, onViewAll }: { dense?: boolean; onViewAll?: () => void }) {
  return (
    <div
      className={`rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_90%,transparent)] glow-border ${dense ? "p-5" : "p-6 md:p-8"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <FontAwesomeIcon icon={faBoxArchive} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Auditor-ready package</h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Dated, attributed, exportable.
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Active
        </span>
      </div>

      <ul className={`space-y-2 ${dense ? "mt-4" : "mt-6 space-y-3"}`}>
        {OUTPUT_FILES.slice(0, dense ? 3 : OUTPUT_FILES.length).map((f, i) => (
          <motion.li
            key={f.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between rounded-xl border border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[var(--bg)]/50 px-3.5 py-3 glow-border-hover"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="text-xs text-[var(--fg-muted)]">
                {f.size} · {f.when}
              </p>
            </div>
            <button
              type="button"
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--fg-muted)] transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] hover:text-[var(--accent)]"
              aria-label={`Download ${f.name}`}
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
            </button>
          </motion.li>
        ))}
      </ul>

      {dense && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:underline"
        >
          Open output room
          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </button>
      )}

      {!dense && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_0_40px_-12px_var(--glow)] glow-border-hover"
        >
          <FontAwesomeIcon icon={faDownload} className="h-4 w-4 opacity-90" />
          Download auditor-ready package
        </motion.button>
      )}
    </div>
  );
}

function HipaaBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_92%,transparent)] px-5 py-4 sm:flex-row sm:items-center sm:px-6 glow-border">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] text-[var(--accent)]">
          <FontAwesomeIcon icon={faStethoscope} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">HIPAA compliance</p>
          <p className="text-xs text-[var(--fg-muted)]">Coming soon · same execution model</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-xl border border-[color-mix(in_oklch,var(--border)_55%,transparent)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[color-mix(in_oklch,var(--accent)_35%,transparent)] hover:text-[var(--accent)]"
      >
        Join waitlist
      </button>
    </div>
  );
}

function WaitlistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="waitlist-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-[oklch(0_0_0/0.55)] backdrop-blur-sm"
            aria-label="Close modal"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="waitlist-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--bg-elevated)] p-8 shadow-[0_0_80px_-20px_var(--glow)] glow-border"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg)]/80 hover:text-[var(--fg)]"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
            <h2 id="waitlist-title" className="pr-10 text-xl font-semibold">
              We&apos;re expanding beyond SOC 2
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
              Get early access to our HIPAA compliance engine—the same execution quality, tuned for regulated health data.
            </p>
            <div className="mt-6">
              <label className="sr-only" htmlFor="waitlist-email">
                Work email
              </label>
              <div className="flex gap-2 rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/55 px-3 py-2">
                <FontAwesomeIcon icon={faEnvelope} className="mt-2.5 h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="Work email"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_0_24px_-8px_var(--glow)]"
              >
                Request early access
                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="h-7 w-1/3 max-w-[200px] animate-pulse rounded-lg bg-[color-mix(in_oklch,var(--border)_48%,transparent)]" />
      <div className="h-40 animate-pulse rounded-2xl bg-[color-mix(in_oklch,var(--border)_38%,transparent)]" />
      <div className="h-40 animate-pulse rounded-2xl bg-[color-mix(in_oklch,var(--border)_38%,transparent)]" />
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
}: {
  active: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[15.5rem] shrink-0 flex-col border-r border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--card)_55%,var(--bg)_45%)] backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_0_28px_-8px_var(--glow)]">
          <FontAwesomeIcon icon={faShieldHalved} className="h-[1.15rem] w-[1.15rem]" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Venyra AI</p>
          <p className="text-[11px] text-[var(--fg-muted)]">Client portal</p>
        </div>
      </div>

      {/* Workspace switcher */}
      <button
        type="button"
        className="mx-3 mb-3 flex items-center justify-between rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_60%,transparent)] px-3 py-2 text-left text-xs transition-colors hover:border-[color-mix(in_oklch,var(--accent)_35%,transparent)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent)] to-[oklch(0.55_0.18_290)] text-[10px] font-bold text-white">
            A
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--fg)]">Acme Corp</span>
            <span className="block text-[10px] text-[var(--fg-muted)]">SOC 2 Type II</span>
          </span>
        </span>
        <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5 text-[var(--fg-muted)]" />
      </button>

      <nav className="flex flex-col gap-0.5 px-3 py-2" aria-label="Workspace">
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                isActive
                  ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] font-medium text-[var(--fg)]"
                  : "text-[var(--fg-muted)] hover:bg-[color-mix(in_oklch,var(--card)_85%,transparent)] hover:text-[var(--fg)]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--glow)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <FontAwesomeIcon
                icon={item.icon}
                className={`h-[1.05rem] w-[1.05rem] ${isActive ? "text-[var(--accent)]" : ""}`}
              />
              <span className="pl-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[color-mix(in_oklch,var(--border)_40%,transparent)] p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[oklch(0.55_0.18_290)] text-xs font-semibold text-white">
            J
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">Jordan Lee</p>
            <p className="truncate text-[10px] text-[var(--fg-muted)]">Security · Acme</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[color-mix(in_oklch,var(--card)_80%,transparent)] hover:text-[var(--fg)]"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5 rotate-180" />
          Back to marketing site
        </Link>
      </div>
    </aside>
  );
}

function MobileNav({ active, onSelect }: { active: Section; onSelect: (s: Section) => void }) {
  return (
    <nav
      className="grid grid-cols-3 border-b border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[color-mix(in_oklch,var(--bg)_92%,transparent)] px-1 py-2 backdrop-blur-md md:hidden"
      aria-label="Workspace sections"
    >
      {NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
            }`}
          >
            <FontAwesomeIcon icon={item.icon} className="h-[1.1rem] w-[1.1rem]" />
            <span className="max-w-[4.2rem] truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function HomeDashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [email, setEmail] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(2);
  const [progress, setProgress] = useState(82);
  const [aiLineIdx, setAiLineIdx] = useState(0);
  const [loadingSection, setLoadingSection] = useState(false);

  const aiLine = AI_LINES[aiLineIdx % AI_LINES.length];

  useEffect(() => {
    const t = setInterval(() => setAiLineIdx((i) => i + 1), 4200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await api.getComplianceStatus();
      if (cancelled || error || !data) return;
      if (typeof data.progress === "number") setProgress(data.progress);
      const idx = STEPS.findIndex((s) => s.id === data.stage || s.label === data.stage);
      if (idx >= 0) setActiveStep(idx);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const simulateProgress = useCallback(() => {
    setProgress((p) => Math.min(99, p + 4));
    setActiveStep((s) => Math.min(STEPS.length - 1, s + (Math.random() > 0.7 ? 1 : 0)));
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      if (!email.trim()) {
        alert("Please enter your work email so we can route your upload.");
        return;
      }
      setUploadBusy(true);
      try {
        for (const file of Array.from(files)) {
          const fd = new FormData();
          fd.set("file", file);
          fd.set("email", email.trim());
          const { data, error } = await api.uploadFiles(fd);
          if (error || !data?.ok) {
            console.warn(error ?? data);
          }
        }
        await new Promise((r) => setTimeout(r, 1800));
        simulateProgress();
      } finally {
        setUploadBusy(false);
      }
    },
    [email, simulateProgress],
  );

  const onSelectSection = (s: Section) => {
    setLoadingSection(true);
    setSection(s);
    setTimeout(() => setLoadingSection(false), 280);
  };

  let mainContent: ReactNode;
  if (loadingSection) {
    mainContent = <SectionSkeleton />;
  } else {
    switch (section) {
      case "workspace":
        mainContent = (
          <WorkspaceTab
            email={email}
            setEmail={setEmail}
            busy={uploadBusy}
            onFiles={handleFiles}
            activeStep={activeStep}
            progress={progress}
            aiLine={aiLine}
          />
        );
        break;
      case "output":
        mainContent = (
          <div className="space-y-6">
            <OutputVault />
            <HipaaBanner onOpen={() => setWaitlistOpen(true)} />
          </div>
        );
        break;
      default:
        mainContent = (
          <div className="space-y-6">
            <OverviewCharts readiness={progress} />
            <OutputVault dense onViewAll={() => onSelectSection("output")} />
            <HipaaBanner onOpen={() => setWaitlistOpen(true)} />
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--fg)] md:flex-row">
      <Sidebar active={section} onSelect={onSelectSection} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[color-mix(in_oklch,var(--bg)_82%,transparent)] px-4 backdrop-blur-xl md:h-[3.75rem] md:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-[var(--fg-muted)] sm:inline">Workspace</span>
            <FontAwesomeIcon icon={faChevronRight} className="hidden h-2.5 w-2.5 text-[var(--fg-muted)] sm:inline" />
            <span className="font-medium text-[var(--fg)]">Acme Corp</span>
            <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5 text-[var(--fg-muted)]" />
            <span className="truncate font-semibold text-[var(--fg)]">
              {NAV.find((n) => n.id === section)?.label ?? "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_70%,transparent)] px-2.5 py-1.5 text-xs text-[var(--fg-muted)] md:flex">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
              <input
                className="w-44 bg-transparent outline-none placeholder:text-[var(--fg-muted)]"
                placeholder="Search controls, evidence…"
              />
              <kbd className="hidden rounded-md border border-[color-mix(in_oklch,var(--border)_55%,transparent)] bg-[var(--bg)]/55 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[var(--fg-muted)] md:inline">
                ⌘ K
              </kbd>
            </div>
            <ThemeToggle />
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--card)] text-[var(--fg-muted)] sm:flex"
              aria-label="Profile"
            >
              <FontAwesomeIcon icon={faCircleUser} className="h-4 w-4 opacity-80" />
            </button>
          </div>
        </header>

        <MobileNav active={section} onSelect={onSelectSection} />

        <motion.main
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 overflow-auto"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
            <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
                  {NAV.find((n) => n.id === section)?.label}
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-[1.7rem]">
                  {section === "overview" && "SOC 2 readiness at a glance"}
                  {section === "workspace" && "Your compliance workspace"}
                  {section === "output" && "Output room"}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
                  {section === "overview" && "Live readiness, control coverage, and what to do next."}
                  {section === "workspace" && "Upload documents, connect sources, watch the pipeline run."}
                  {section === "output" && "Auditor-ready artifacts, dated and exportable."}
                </p>
              </div>
              {section === "overview" && (
                <button
                  type="button"
                  onClick={() => onSelectSection("workspace")}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-foreground)] shadow-[0_0_28px_-10px_var(--glow)]"
                >
                  Open workspace
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </button>
              )}
            </div>

            {mainContent}
          </div>
        </motion.main>
      </div>

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}
