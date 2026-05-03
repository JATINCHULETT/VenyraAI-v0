"use client";

import {
  faArrowRight,
  faArrowRightFromBracket,
  faBoxArchive,
  faChartPie,
  faChevronRight,
  faCircleUser,
  faDownload,
  faEnvelope,
  faHouse,
  faLayerGroup,
  faMagnifyingGlass,
  faShieldHalved,
  faStethoscope,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppAuth } from "@/components/providers/app-auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { OauthProviderFlags } from "@/lib/auth-provider-flags";
import { api, type OutputLogFile, type StorageAuthHeaders } from "@/lib/api";
import type { ComplianceFramework } from "@/lib/compliance-framework";
import {
  COMPLIANCE_FRAMEWORK_LABEL,
  COMPLIANCE_FRAMEWORK_SUB,
} from "@/lib/compliance-framework";
import { OverviewCharts } from "./OverviewCharts";
import { WorkspaceTab } from "./WorkspaceTab";

type Section = "overview" | "workspace" | "output";

const STAGE_LINES_SOC2: Record<string, string> = {
  queued: "Queued for secure processing…",
  scanning: "Scanning the document for evidence…",
  ocr: "OCR agents extracting dense tables…",
  llm: "LLM agents mapping controls…",
  report: "Generating the audit report…",
  upload: "Saving the report securely…",
  email: "Delivering the report by email…",
  complete: "Audit package delivered.",
  error: "Pipeline error detected. Retrying…",
};

const STAGE_LINES_DPDP: Record<string, string> = {
  ...STAGE_LINES_SOC2,
  llm: "LLM agents mapping DPDP obligations…",
  report: "Generating the DPDP gap analysis report…",
  complete: "DPDP analysis package delivered.",
};

const AI_LINES_SOC2 = [
  "Scanning the document for evidence…",
  "OCR agents extracting dense tables…",
  "LLM agents mapping controls…",
  "Generating the audit report…",
  "Packaging auditor-ready output…",
];

const AI_LINES_DPDP = [
  "Scanning the document for evidence…",
  "OCR agents extracting dense tables…",
  "LLM agents mapping DPDP themes…",
  "Generating the DPDP gap report…",
  "Packaging India DPDP-ready output…",
];

const STAGE_TO_STEP: Record<string, number> = {
  queued: 0,
  scanning: 0,
  ocr: 1,
  llm: 2,
  report: 3,
  upload: 3,
  email: 3,
  complete: 3,
  error: 3,
};

const STATUS_STALE_MS = 10 * 60 * 1000;

const FRAMEWORK_STORAGE_KEY = "venyra-compliance-framework";

function ComplianceFrameworkControl({
  value,
  onChange,
  className = "",
}: {
  value: ComplianceFramework;
  onChange: (v: ComplianceFramework) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex rounded-full border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] p-0.5 ${className}`}
      role="group"
      aria-label="Compliance program"
    >
      {(["soc2", "dpdp"] as const).map((fw) => {
        const active = value === fw;
        return (
          <button
            key={fw}
            type="button"
            onClick={() => onChange(fw)}
            className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-3 ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_0_16px_-6px_var(--glow)]"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            {fw === "soc2" ? "SOC 2" : "India DPDP"}
          </button>
        );
      })}
    </div>
  );
}

const formatBytes = (bytes?: number | null) => {
  if (!bytes || Number.isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatWhen = (iso?: string | null) => {
  if (!iso) return "Unknown time";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
};

const NAV: { id: Section; label: string; icon: typeof faChartPie }[] = [
  { id: "overview", label: "Overview", icon: faChartPie },
  { id: "workspace", label: "Workspace", icon: faLayerGroup },
  { id: "output", label: "Output", icon: faBoxArchive },
];

function OutputVault({
  dense = false,
  onViewAll,
  files = [],
  isGuestSession = false,
  framework = "soc2",
}: {
  dense?: boolean;
  onViewAll?: () => void;
  files?: OutputLogFile[];
  isGuestSession?: boolean;
  framework?: ComplianceFramework;
}) {
  const fwShort = COMPLIANCE_FRAMEWORK_LABEL[framework];
  const visibleFiles = files.length ? files.slice(0, dense ? 3 : files.length) : [];
  const latestUrl = files[0]?.url ?? null;
  const handleDownload = () => {
    if (!latestUrl) return;
    window.open(latestUrl, "_blank", "noopener,noreferrer");
  };

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
            <h3 className="text-base font-semibold tracking-tight">
              {framework === "dpdp" ? "DPDP analysis outputs" : "Audited outputs"}
            </h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {framework === "dpdp"
                ? `${fwShort} gap reports from this workspace — dated and exportable.`
                : "Previously audited reports, dated and exportable."}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Active
        </span>
      </div>

      <ul className={`space-y-2 ${dense ? "mt-4" : "mt-6 space-y-3"}`}>
        {visibleFiles.length ? (
          visibleFiles.map((f, i) => (
            <motion.li
              key={f.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl border border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[var(--bg)]/50 px-3.5 py-3 glow-border-hover"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-[var(--fg-muted)]">
                  {formatBytes(f.size)} · {formatWhen(f.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => f.url && window.open(f.url, "_blank", "noopener,noreferrer")}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--fg-muted)] transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] hover:text-[var(--accent)]"
                aria-label={`Download ${f.name}`}
              >
                <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
              </button>
            </motion.li>
          ))
        ) : (
          <li className="rounded-xl border border-[color-mix(in_oklch,var(--border)_38%,transparent)] bg-[var(--bg)]/40 px-4 py-4 text-sm text-[var(--fg-muted)]">
            {isGuestSession
              ? "No reports in this guest session yet. After a full refresh, this list resets. Sign in to keep your outputs across visits."
              : framework === "dpdp"
                ? "No DPDP reports yet for this program. Upload a privacy policy, RoPA, or notice PDF to generate your first analysis."
                : "No audited outputs yet. Upload a document to generate your first report."}
          </li>
        )}
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
          onClick={handleDownload}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_0_40px_-12px_var(--glow)] glow-border-hover"
          aria-disabled={!latestUrl}
        >
          <FontAwesomeIcon icon={faDownload} className="h-4 w-4 opacity-90" />
          {framework === "dpdp" ? "Download DPDP gap package" : "Download auditor-ready package"}
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
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistBusy, setWaitlistBusy] = useState(false);
  const [waitlistSent, setWaitlistSent] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setWaitlistEmail("");
    setWaitlistBusy(false);
    setWaitlistSent(false);
    setWaitlistError(null);
  }, [open]);

  const handleWaitlist = async () => {
    const email = waitlistEmail.trim();
    if (!email) {
      setWaitlistError("Enter a work email to continue.");
      return;
    }

    setWaitlistBusy(true);
    setWaitlistError(null);
    const { data, error } = await api.joinWaitlist(email);
    if (error || !data?.ok) {
      setWaitlistError(error ?? data?.error ?? "Failed to submit waitlist.");
      setWaitlistBusy(false);
      return;
    }

    setWaitlistSent(true);
    setWaitlistBusy(false);
  };

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
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
              We&apos;ll reach out manually. Your email is saved to our database for follow-up.
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
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  disabled={waitlistBusy || waitlistSent}
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              {waitlistError && (
                <p className="mt-2 text-xs text-rose-400">{waitlistError}</p>
              )}
              {waitlistSent && (
                <p className="mt-2 text-xs text-emerald-400">
                  Thanks! We will reach out with early access details.
                </p>
              )}
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
                onClick={handleWaitlist}
                disabled={waitlistBusy}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_0_24px_-8px_var(--glow)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {waitlistBusy ? "Sending…" : "Request early access"}
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
  userLabel,
  userSub,
  complianceFramework,
  onComplianceFrameworkChange,
}: {
  active: Section;
  onSelect: (s: Section) => void;
  userLabel: string;
  userSub: string;
  complianceFramework: ComplianceFramework;
  onComplianceFrameworkChange: (v: ComplianceFramework) => void;
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

      {/* Program + tenant */}
      <div className="mx-3 mb-3 space-y-2 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--bg)_60%,transparent)] px-3 py-2.5 text-left text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent)] to-[oklch(0.55_0.18_290)] text-[10px] font-bold text-white">
            A
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--fg)]">Acme Corp</span>
            <span className="block text-[10px] text-[var(--fg-muted)]">
              {COMPLIANCE_FRAMEWORK_SUB[complianceFramework]}
            </span>
          </span>
        </div>
        <ComplianceFrameworkControl
          value={complianceFramework}
          onChange={onComplianceFrameworkChange}
          className="w-full justify-stretch [&>button]:flex-1"
        />
      </div>

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
            {userLabel.slice(0, 1).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{userLabel}</p>
            <p className="truncate text-[10px] text-[var(--fg-muted)]">{userSub}</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[color-mix(in_oklch,var(--card)_80%,transparent)] hover:text-[var(--fg)]"
        >
          <FontAwesomeIcon icon={faHouse} className="h-3 w-3 opacity-80" />
          Home · marketing site
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

export function HomeDashboard({ oauthProviders }: { oauthProviders: OauthProviderFlags }) {
  const router = useRouter();
  const { user, signOutAll, getSupabaseAccessToken, loading: authLoading } = useAppAuth();
  const [guestSessionId, setGuestSessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}`,
  );
  const prevHadUser = useRef(false);

  useEffect(() => {
    if (prevHadUser.current && !user) {
      setGuestSessionId(
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `guest-${Date.now()}`,
      );
    }
    prevHadUser.current = Boolean(user);
  }, [user]);

  const buildStorageAuthHeaders = useCallback(async (): Promise<StorageAuthHeaders> => {
    if (authLoading) return {};
    const h: StorageAuthHeaders = {};
    if (user?.source === "supabase") {
      const token = await getSupabaseAccessToken();
      if (token) h.Authorization = `Bearer ${token}`;
    } else if (!user) {
      h["x-venyra-guest"] = guestSessionId;
    }
    return h;
  }, [authLoading, user, guestSessionId, getSupabaseAccessToken]);

  const [section, setSection] = useState<Section>("overview");
  const [email, setEmail] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState("queued");
  const [pipelineActive, setPipelineActive] = useState(false);
  const [outputFiles, setOutputFiles] = useState<OutputLogFile[]>([]);
  const [aiLineIdx, setAiLineIdx] = useState(0);
  const [loadingSection, setLoadingSection] = useState(false);

  const [complianceFramework, setComplianceFramework] =
    useState<ComplianceFramework>("soc2");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FRAMEWORK_STORAGE_KEY);
      if (raw === "dpdp" || raw === "soc2") setComplianceFramework(raw);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(FRAMEWORK_STORAGE_KEY, complianceFramework);
    } catch {
      /* ignore */
    }
  }, [complianceFramework]);

  useEffect(() => {
    setJobId(null);
    setPipelineActive(false);
    setPipelineStage("queued");
    setProgress(0);
    setActiveStep(0);
    setUploadError(null);
  }, [complianceFramework]);

  const stageLines = useMemo(
    () => (complianceFramework === "dpdp" ? STAGE_LINES_DPDP : STAGE_LINES_SOC2),
    [complianceFramework],
  );
  const aiLinePool = useMemo(
    () => (complianceFramework === "dpdp" ? AI_LINES_DPDP : AI_LINES_SOC2),
    [complianceFramework],
  );

  const aiLine = stageLines[pipelineStage] ?? aiLinePool[aiLineIdx % aiLinePool.length];

  useEffect(() => {
    const t = setInterval(() => setAiLineIdx((i) => i + 1), 4200);
    return () => clearInterval(t);
  }, []);

  const fetchOutputLogs = useCallback(async () => {
    const storageAuth = await buildStorageAuthHeaders();
    const { data, error } = await api.getOutputLogs(storageAuth, complianceFramework);
    if (error || !data) return;
    setOutputFiles(data.files);
  }, [buildStorageAuthHeaders, complianceFramework]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      const storageAuth = await buildStorageAuthHeaders();
      const { data, error } = await api.getComplianceStatus(
        undefined,
        storageAuth,
        complianceFramework,
      );
      if (cancelled || error || !data) return;
      const updatedAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
      const isStale = !updatedAt || Date.now() - updatedAt > STATUS_STALE_MS;

      if (isStale) {
        setPipelineActive(false);
        setPipelineStage("queued");
        setProgress(0);
        setActiveStep(0);
        setJobId(null);
        return;
      }

      if (typeof data.progress === "number") setProgress(data.progress);
      if (data.stage) {
        setPipelineStage(data.stage);
        setActiveStep(STAGE_TO_STEP[data.stage] ?? 0);
        setPipelineActive(!["complete", "error"].includes(data.stage));
      }
      if (data.jobId) setJobId(data.jobId);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, buildStorageAuthHeaders, complianceFramework]);

  useEffect(() => {
    if (authLoading) return;
    void fetchOutputLogs();
  }, [authLoading, fetchOutputLogs]);

  useEffect(() => {
    if (section === "output") void fetchOutputLogs();
  }, [fetchOutputLogs, section]);

  useEffect(() => {
    if (authLoading || !jobId) return;
    let cancelled = false;

    const poll = async () => {
      const storageAuth = await buildStorageAuthHeaders();
      const { data, error } = await api.getComplianceStatus(
        jobId,
        storageAuth,
        complianceFramework,
      );
      if (cancelled || error || !data) return;
      const updatedAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
      const isStale = !updatedAt || Date.now() - updatedAt > STATUS_STALE_MS;
      if (isStale) {
        setPipelineActive(false);
        setPipelineStage("queued");
        setProgress(0);
        setActiveStep(0);
        setJobId(null);
        return;
      }
      if (typeof data.progress === "number") setProgress(data.progress);
      if (data.stage) {
        setPipelineStage(data.stage);
        setActiveStep(STAGE_TO_STEP[data.stage] ?? 0);
        const done = ["complete", "error"].includes(data.stage);
        setPipelineActive(!done);
        if (done) void fetchOutputLogs();
      }
      if (data.error) setUploadError(data.error);
    };

    void poll();
    const timer = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authLoading, buildStorageAuthHeaders, complianceFramework, fetchOutputLogs, jobId]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      if (authLoading) {
        setUploadError("Checking sign-in… try again in a moment.");
        return;
      }
      if (!email.trim()) {
        setUploadError("Add your work email so we can route the upload.");
        return;
      }

      // pdf-parse only handles PDFs — reject other file types up front
      // with a clear message instead of letting the pipeline silently fail.
      const invalid = Array.from(files).find(
        (f) => !/\.pdf$/i.test(f.name) && f.type !== "application/pdf",
      );
      if (invalid) {
        setUploadError(
          `"${invalid.name}" isn't a PDF. The processing pipeline currently supports PDFs only.`,
        );
        return;
      }

      setUploadError(null);
      setUploadBusy(true);
      try {
        const storageAuth = await buildStorageAuthHeaders();
        let started = false;
        for (const file of Array.from(files)) {
          const fd = new FormData();
          fd.set("file", file);
          fd.set("email", email.trim());
          fd.set("framework", complianceFramework);
          const { data, error } = await api.uploadFiles(fd, storageAuth);
          if (error || !data?.ok) {
            const message = error ?? data?.error ?? "Upload failed.";
            setUploadError(message);
            console.warn("Upload failed:", message);
            continue;
          }
          if (data.jobId) setJobId(data.jobId);
          started = true;
        }
        if (started) {
          setPipelineActive(true);
          setPipelineStage("queued");
          setActiveStep(0);
          setProgress(5);
        }
      } finally {
        setUploadBusy(false);
      }
    },
    [authLoading, buildStorageAuthHeaders, complianceFramework, email, user],
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
              busy={uploadBusy || (pipelineActive && Boolean(jobId))}
              onFiles={handleFiles}
              activeStep={activeStep}
              progress={progress}
              aiLine={aiLine}
              uploadError={uploadError}
              dismissError={() => setUploadError(null)}
              pipelineStage={pipelineStage}
              oauthProviders={oauthProviders}
              awsAccountId={process.env.NEXT_PUBLIC_AWS_ACCOUNT_ID}
              isGuestSession={!user && !authLoading}
              framework={complianceFramework}
            />
        );
        break;
      case "output":
        mainContent = (
          <div className="space-y-6">
            <OutputVault
              files={outputFiles}
              isGuestSession={!user && !authLoading}
              framework={complianceFramework}
            />
            <HipaaBanner onOpen={() => setWaitlistOpen(true)} />
          </div>
        );
        break;
      default:
        mainContent = (
          <div className="space-y-6">
            <OverviewCharts readiness={progress} framework={complianceFramework} />
            <OutputVault
              dense
              files={outputFiles}
              onViewAll={() => onSelectSection("output")}
              isGuestSession={!user && !authLoading}
              framework={complianceFramework}
            />
            <HipaaBanner onOpen={() => setWaitlistOpen(true)} />
          </div>
        );
    }
  }

  const displayName = user?.name || user?.email || "Browser session";
  const displaySub = user
    ? user.source === "nextauth"
      ? "Signed in · OAuth"
      : "Signed in · email"
    : "Guest · outputs are only for this page load (refresh clears the list)";

  const showSignedInChrome = Boolean(user) && !authLoading;

  const onLogout = async () => {
    await signOutAll();
    router.push("/auth/signin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--fg)] md:flex-row">
      <Sidebar
        active={section}
        onSelect={onSelectSection}
        userLabel={displayName}
        userSub={displaySub}
        complianceFramework={complianceFramework}
        onComplianceFrameworkChange={setComplianceFramework}
      />

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
            <ComplianceFrameworkControl
              value={complianceFramework}
              onChange={setComplianceFramework}
              className="shrink-0 md:hidden"
            />
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] sm:inline-flex"
            >
              <FontAwesomeIcon icon={faHouse} className="h-3 w-3" />
              Home
            </Link>
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
            {showSignedInChrome ? (
              <>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                  aria-label="Sign out"
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
                <span
                  className="hidden h-10 max-w-[10rem] items-center gap-2 truncate rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--fg)] sm:inline-flex"
                  title={user?.email ?? undefined}
                >
                  <FontAwesomeIcon icon={faCircleUser} className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" />
                  <span className="truncate">{displayName}</span>
                </span>
              </>
            ) : null}
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
                  <span className="text-[var(--fg-muted)]/80">
                    {" · "}
                    {COMPLIANCE_FRAMEWORK_LABEL[complianceFramework]}
                  </span>
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-[1.7rem]">
                  {section === "overview" &&
                    (complianceFramework === "dpdp"
                      ? "India DPDP readiness at a glance"
                      : "SOC 2 readiness at a glance")}
                  {section === "workspace" &&
                    (complianceFramework === "dpdp"
                      ? "DPDP analysis workspace"
                      : "Your compliance workspace")}
                  {section === "output" &&
                    (complianceFramework === "dpdp"
                      ? "DPDP output room"
                      : "Output room")}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
                  {section === "overview" &&
                    (complianceFramework === "dpdp"
                      ? "Privacy program readiness, DPDP themes, and evidence — same live execution model as SOC 2."
                      : "Live readiness, control coverage, and what to do next.")}
                  {section === "workspace" &&
                    (complianceFramework === "dpdp"
                      ? "Upload privacy notices, RoPA, or policies — OCR + Gemini produce a DPDP gap report in the segregated output folder."
                      : "Upload documents, connect sources, watch the pipeline run.")}
                  {section === "output" &&
                    (complianceFramework === "dpdp"
                      ? `${COMPLIANCE_FRAMEWORK_LABEL.dpdp} gap reports only — separate from SOC 2 exports.`
                      : "Auditor-ready artifacts, dated and exportable.")}
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
