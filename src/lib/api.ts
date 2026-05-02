/**
 * Frontend API layer — call existing backend routes without modifying server logic.
 */

const base = () =>
  typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data?: T; error?: string }> {
  try {
    const isForm = init?.body instanceof FormData;
    const headers = new Headers(init?.headers);
    if (!isForm && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${base()}${path}`, {
      ...init,
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
  uploadFiles: (formData: FormData) =>
    request<UploadResponse>("/api/upload", {
      method: "POST",
      body: formData,
    }),

  getComplianceStatus: (jobId?: string) =>
    request<ComplianceStatusResponse>(
      jobId ? `/api/compliance/status?jobId=${encodeURIComponent(jobId)}` : "/api/compliance/status"
    ),

  getOutputLogs: () => request<OutputLogsResponse>("/api/output/logs"),

  joinWaitlist: (email: string) =>
    request<WaitlistResponse>("/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
