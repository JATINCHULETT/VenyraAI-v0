/**
 * Frontend API layer — call existing backend routes without modifying server logic.
 */

const base = () =>
  typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "";

/** Headers for per-user / guest-scoped Supabase storage (see `resolveStorageOwner`). */
export type StorageAuthHeaders = Record<string, string>;

async function request<T>(
  path: string,
  init?: RequestInit & { storageAuth?: StorageAuthHeaders },
): Promise<{ data?: T; error?: string }> {
  try {
    const { storageAuth, ...rest } = init ?? {};
    const isForm = rest.body instanceof FormData;
    const headers = new Headers(rest.headers);
    if (storageAuth) {
      for (const [k, v] of Object.entries(storageAuth)) {
        if (v) headers.set(k, v);
      }
    }
    if (!isForm && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${base()}${path}`, {
      ...rest,
      headers,
    });
    if (!res.ok) {
      let err = res.statusText || `HTTP ${res.status}`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) err = j.error;
      } catch {
        /* ignore */
      }
      return { error: err };
    }
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return { data: (await res.json()) as T };
    }
    return { data: undefined as T };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return { error: message };
  }
}

export type UploadResponse = {
  ok: boolean;
  filePath?: string;
  jobId?: string;
  error?: string;
};

export type ComplianceStatusResponse = {
  progress: number;
  stage: string;
  updatedAt?: string;
  reportFilePath?: string;
  reportUrl?: string;
  error?: string;
  jobId?: string;
};

export type OutputLogFile = {
  name: string;
  path: string;
  size: number | null;
  updatedAt: string | null;
  url: string | null;
};

export type OutputLogsResponse = {
  files: OutputLogFile[];
};

export type WaitlistResponse = {
  ok: boolean;
  error?: string;
};

export const api = {
  uploadFiles: (formData: FormData, storageAuth?: StorageAuthHeaders) =>
    request<UploadResponse>("/api/upload", {
      method: "POST",
      body: formData,
      storageAuth,
    }),

  getComplianceStatus: (jobId?: string, storageAuth?: StorageAuthHeaders) =>
    request<ComplianceStatusResponse>(
      jobId ? `/api/compliance/status?jobId=${encodeURIComponent(jobId)}` : "/api/compliance/status",
      { storageAuth },
    ),

  getOutputLogs: (storageAuth?: StorageAuthHeaders) =>
    request<OutputLogsResponse>("/api/output/logs", { storageAuth }),

  joinWaitlist: (email: string) =>
    request<WaitlistResponse>("/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
