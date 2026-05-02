"use client";

import {
  faArrowsRotate,
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faKey,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faAws, faGithub, faGoogle, faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OauthProviderFlags } from "@/lib/auth-provider-flags";
import {
  awsIamCreateRoleUrl,
  fetchIntegrationMetadata,
  isValidAwsRoleArn,
  isValidOktaDomainInput,
  loadIntegrationSnapshots,
  persistIntegrationSnapshots,
  type CloudProviderKey,
  type IntegrationSnapshot,
} from "@/lib/cloud-integrations";

const STEPS = [
  { id: "scanning", label: "Scanning document", note: "Indexing evidence" },
  { id: "ocr", label: "OCR pipeline", note: "Extracting text" },
  { id: "llm", label: "LLM pipeline", note: "Control mapping" },
  { id: "report", label: "Audit report", note: "Generate + deliver" },
] as const;

const PENDING_PROVIDER_KEY = "venyra-pending-provider";

type IntegrationRow = {
  id: CloudProviderKey;
  name: string;
  icon: typeof faAws;
  defaultScope: string;
  defaultStatus: IntegrationSnapshot["status"];
};

const INTEGRATION_ROWS: IntegrationRow[] = [
  {
    id: "aws",
    name: "AWS",
    icon: faAws,
    defaultScope: "Read-only · IAM role",
    defaultStatus: "available",
  },
  {
    id: "github",
    name: "GitHub",
    icon: faGithub,
    defaultScope: "repo + read:org",
    defaultStatus: "available",
  },
  {
    id: "okta",
    name: "Okta",
    icon: faKey,
    defaultScope: "Domain + API token",
    defaultStatus: "available",
  },
  {
    id: "gcp",
    name: "GCP",
    icon: faGoogle,
    defaultScope: "cloud-platform.read-only",
    defaultStatus: "available",
  },
  {
    id: "azure",
    name: "Azure",
    icon: faMicrosoft,
    defaultScope: "ARM + monitoring read",
    defaultStatus: "available",
  },
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
  uploadError,
  dismissError,
  pipelineStage,
  oauthProviders,
  awsAccountId,
  isGuestSession = false,
}: {
  email: string;
  setEmail: (v: string) => void;
  busy: boolean;
  onFiles: (files: FileList | null) => void;
  activeStep: number;
  progress: number;
  aiLine: string;
  uploadError?: string | null;
  dismissError?: () => void;
  pipelineStage?: string;
  oauthProviders: OauthProviderFlags;
  awsAccountId?: string;
  /** When true, outputs are scoped to this page load only (refresh clears the list). */
  isGuestSession?: boolean;
}) {
  const { status } = useSession();
  const [drag, setDrag] = useState(false);
  const [snapshots, setSnapshots] = useState<Partial<Record<CloudProviderKey, IntegrationSnapshot>>>(
    {},
  );
  const [awsOpen, setAwsOpen] = useState(false);
  const [awsArn, setAwsArn] = useState("");
  const [awsError, setAwsError] = useState<string | null>(null);
  const [oktaOpen, setOktaOpen] = useState(false);
  const [oktaDomain, setOktaDomain] = useState("");
  const [oktaToken, setOktaToken] = useState("");
  const [oktaError, setOktaError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    setSnapshots(loadIntegrationSnapshots());
  }, []);

  const persist = useCallback((next: Partial<Record<CloudProviderKey, IntegrationSnapshot>>) => {
    setSnapshots((prev) => {
      const merged = { ...prev, ...next };
      persistIntegrationSnapshots(merged);
      return merged;
    });
  }, []);

  const runConnectPipeline = useCallback(
    async (id: CloudProviderKey, detail?: string) => {
      persist({ [id]: { status: "connecting", detail } });
      try {
        const meta = await fetchIntegrationMetadata(id);
        persist({
          [id]: { status: "live", detail, meta },
        });
      } catch {
        persist({ [id]: { status: "available", detail } });
        setConnectError(`Could not finish ${id.toUpperCase()} connection. Try again.`);
      }
    },
    [persist],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "authenticated") return;
    const raw = sessionStorage.getItem(PENDING_PROVIDER_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_PROVIDER_KEY);
    const id = raw as CloudProviderKey;
    if (!INTEGRATION_ROWS.some((r) => r.id === id)) return;
    void runConnectPipeline(id);
  }, [status, runConnectPipeline]);

  const liveCount = useMemo(
    () => INTEGRATION_ROWS.filter((r) => snapshots[r.id]?.status === "live").length,
    [snapshots],
  );

  const startGcpConnect = () => {
    if (!oauthProviders.google) {
      setConnectError("Configure Google OAuth (AUTH_GOOGLE_*) to connect GCP.");
      return;
    }
    setConnectError(null);
    sessionStorage.setItem(PENDING_PROVIDER_KEY, "gcp");
    void signIn("google", {
      callbackUrl: window.location.href,
      authorizationParams: {
        scope:
          "openid email profile https://www.googleapis.com/auth/cloud-platform.read-only",
        access_type: "offline",
        prompt: "consent",
      },
    });
  };

  const startAzureConnect = () => {
    if (!oauthProviders.microsoftEntra) {
      setConnectError("Configure Microsoft Entra OAuth to connect Azure.");
      return;
    }
    setConnectError(null);
    sessionStorage.setItem(PENDING_PROVIDER_KEY, "azure");
    void signIn("microsoft-entra-id", { callbackUrl: window.location.href });
  };

  const startGithubConnect = () => {
    if (!oauthProviders.github) {
      setConnectError("Configure GitHub OAuth to connect GitHub.");
      return;
    }
    setConnectError(null);
    sessionStorage.setItem(PENDING_PROVIDER_KEY, "github");
    void signIn("github", {
      callbackUrl: window.location.href,
      authorizationParams: {
        scope: "read:user user:email repo read:org",
      },
    });
  };

  const openAwsConsole = () => {
    window.open(awsIamCreateRoleUrl(awsAccountId), "_blank", "noopener,noreferrer");
  };

  const submitAwsArn = () => {
    const arn = awsArn.trim();
    if (!isValidAwsRoleArn(arn)) {
      setAwsError("Enter a valid IAM role ARN (arn:aws:iam::123456789012:role/…).");
      return;
    }
    setAwsError(null);
    setAwsOpen(false);
    setAwsArn("");
    void runConnectPipeline("aws", arn);
  };

  const submitOkta = () => {
    if (!isValidOktaDomainInput(oktaDomain)) {
      setOktaError("Enter your Okta domain (e.g. dev-123.okta.com or full URL).");
      return;
    }
    if (!oktaToken.trim()) {
      setOktaError("Paste a read-only API token.");
      return;
    }
    setOktaError(null);
    setOktaOpen(false);
    const detail = oktaDomain.trim();
    setOktaDomain("");
    setOktaToken("");
    void runConnectPipeline("okta", detail);
  };

  const onConnectClick = (id: CloudProviderKey) => {
    setConnectError(null);
    if (id === "aws") {
      setAwsOpen(true);
      return;
    }
    if (id === "okta") {
      setOktaOpen(true);
      return;
    }
    if (id === "gcp") {
      startGcpConnect();
      return;
    }
    if (id === "azure") {
      startAzureConnect();
      return;
    }
    if (id === "github") {
      startGithubConnect();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload error banner */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500">
              <FontAwesomeIcon icon={faCircleExclamation} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Upload couldn&apos;t complete
              </p>
              <p className="mt-0.5 break-words text-xs text-rose-600/90 dark:text-rose-300/85">
                {uploadError}
              </p>
            </div>
          </div>
          {dismissError && (
            <button
              type="button"
              onClick={dismissError}
              aria-label="Dismiss"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-500/10"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}

      {isGuestSession && (
        <p className="rounded-xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[color-mix(in_oklch,var(--card)_88%,transparent)] px-4 py-3 text-xs leading-relaxed text-[var(--fg-muted)]">
          You&apos;re browsing as a guest. Reports and pipeline status are tied to this page load only — a full refresh
          starts a new temporary scope and won&apos;t show previous outputs. Sign in to keep a persistent workspace.
        </p>
      )}

      {connectError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3.5 text-sm text-amber-900 dark:text-amber-100"
        >
          <span>{connectError}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setConnectError(null)}
            className="shrink-0 rounded-md p-1 hover:bg-amber-500/15"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
                PDFs only — TLS in transit, processed by Gemini.
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
            accept="application/pdf,.pdf"
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
              {pipelineStage && (
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                  Stage · {pipelineStage}
                </p>
              )}
            </div>
          ) : (
            <>
              <FontAwesomeIcon icon={faCloudArrowUp} className="h-8 w-8 text-[var(--fg-muted)] opacity-70" />
              <p className="mt-3 text-center text-sm font-medium">Drag &amp; drop a PDF or click to browse</p>
              <p className="mt-1.5 text-center text-xs text-[var(--fg-muted)]">PDF only · OCR + Gemini 2.5 Flash</p>
            </>
          )}
        </div>

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

      {/* ── Pipeline progress ── */}
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
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Connected sources
            </p>
            <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
              Read-only API streams — least-privilege scopes.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            {liveCount} live
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {INTEGRATION_ROWS.map((row) => {
            const snap = snapshots[row.id];
            const status = snap?.status ?? row.defaultStatus;
            const isLive = status === "live";
            const isConnecting = status === "connecting";
            const scopeLabel =
              snap?.meta != null
                ? `${snap.meta.services} services · ${snap.meta.resources} resources · ${snap.meta.logStreams} log streams`
                : row.defaultScope;

            return (
              <motion.button
                key={row.id}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => {
                  if (isLive || isConnecting) return;
                  onConnectClick(row.id);
                }}
                disabled={isLive || isConnecting}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--border)_42%,transparent)] bg-[var(--bg)]/45 p-3.5 text-left glow-border-hover disabled:cursor-default disabled:opacity-95"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--card)_90%,transparent)] text-[var(--fg-muted)]">
                    <FontAwesomeIcon icon={row.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{row.name}</p>
                    <p className="truncate text-[11px] text-[var(--fg-muted)]">{scopeLabel}</p>
                    {snap?.detail && isLive && row.id === "aws" && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--fg-muted)]">
                        {snap.detail}
                      </p>
                    )}
                  </div>
                </div>
                {isConnecting ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      <FontAwesomeIcon icon={faArrowsRotate} className="h-3.5 w-3.5" />
                    </motion.span>
                    Connecting…
                  </span>
                ) : isLive ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color-mix(in_oklch,var(--border)_55%,transparent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fg-muted)] transition-colors group-hover:border-[color-mix(in_oklch,var(--accent)_45%,transparent)] group-hover:text-[var(--accent)]">
                    <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                    Connect {row.name}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {awsOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-[oklch(0_0_0/0.55)] backdrop-blur-sm"
              onClick={() => setAwsOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.99 }}
              className="relative w-full max-w-lg rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--bg-elevated)] p-6 shadow-[0_0_80px_-20px_var(--glow)]"
            >
              <button
                type="button"
                onClick={() => setAwsOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-[var(--fg-muted)] hover:bg-[var(--bg)]/80"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
              <h2 className="pr-8 text-lg font-semibold">Connect AWS</h2>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">
                Open IAM to create a read-only trust role
                {awsAccountId ? ` for account ${awsAccountId}` : ""}, then paste the role ARN.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openAwsConsole}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)]"
                >
                  Open IAM role wizard
                </button>
              </div>
              <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                Role ARN
              </label>
              <input
                value={awsArn}
                onChange={(e) => setAwsArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/VenyraReadOnly"
                className="mt-2 w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 font-mono text-sm outline-none ring-[var(--accent)] focus:ring-2"
              />
              {awsError && <p className="mt-2 text-xs text-rose-500">{awsError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAwsOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-[var(--fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAwsArn}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)]"
                >
                  Validate &amp; connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {oktaOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-[oklch(0_0_0/0.55)] backdrop-blur-sm"
              onClick={() => setOktaOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.99 }}
              className="relative w-full max-w-lg rounded-2xl border border-[color-mix(in_oklch,var(--border)_45%,transparent)] bg-[var(--bg-elevated)] p-6 shadow-[0_0_80px_-20px_var(--glow)]"
            >
              <button
                type="button"
                onClick={() => setOktaOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-[var(--fg-muted)] hover:bg-[var(--bg)]/80"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
              <h2 className="pr-8 text-lg font-semibold">Connect Okta</h2>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">
                Enter your Okta org domain and a read-only API token. Tokens are kept in this browser
                session only for this prototype UI.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                Okta domain
              </label>
              <input
                value={oktaDomain}
                onChange={(e) => setOktaDomain(e.target.value)}
                placeholder="dev-12345.okta.com"
                className="mt-2 w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
              />
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                API token
              </label>
              <input
                type="password"
                value={oktaToken}
                onChange={(e) => setOktaToken(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-[color-mix(in_oklch,var(--border)_50%,transparent)] bg-[var(--bg)]/55 px-3 py-2.5 text-sm outline-none ring-[var(--accent)] focus:ring-2"
              />
              {oktaError && <p className="mt-2 text-xs text-rose-500">{oktaError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOktaOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-[var(--fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitOkta}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)]"
                >
                  Save &amp; connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
