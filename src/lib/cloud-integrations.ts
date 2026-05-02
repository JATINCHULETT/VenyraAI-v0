export const AWS_ROLE_ARN_PATTERN =
  /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+(?:\/[\w+=,.@-]+)*$/;

export function isValidAwsRoleArn(arn: string): boolean {
  return AWS_ROLE_ARN_PATTERN.test(arn.trim());
}

export type CloudProviderKey = "aws" | "gcp" | "azure" | "github" | "okta";

export type IntegrationSnapshot = {
  status: "available" | "connecting" | "live";
  detail?: string;
  meta?: { services: number; resources: number; logStreams: number };
};

const STORAGE_KEY = "venyra-cloud-integrations-v1";

export function loadIntegrationSnapshots(): Partial<Record<CloudProviderKey, IntegrationSnapshot>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<CloudProviderKey, IntegrationSnapshot>>;
  } catch {
    return {};
  }
}

export function persistIntegrationSnapshots(
  data: Partial<Record<CloudProviderKey, IntegrationSnapshot>>,
) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function awsIamCreateRoleUrl(accountId?: string | null): string {
  const base = "https://console.aws.amazon.com/iam/home#/roles/create";
  if (!accountId?.trim()) return base;
  return `${base}?accountId=${encodeURIComponent(accountId.trim())}`;
}

/** Simulated metadata fetch after a provider connects (replace with real API calls). */
export async function fetchIntegrationMetadata(provider: CloudProviderKey): Promise<{
  services: number;
  resources: number;
  logStreams: number;
}> {
  const jitter = 400 + Math.floor(Math.random() * 900);
  await new Promise((r) => setTimeout(r, jitter));
  const seeds: Record<CloudProviderKey, [number, number, number]> = {
    aws: [18, 64, 9],
    gcp: [14, 52, 12],
    azure: [16, 48, 11],
    github: [8, 24, 4],
    okta: [6, 18, 3],
  };
  const [s, res, logs] = seeds[provider];
  return {
    services: s + Math.floor(Math.random() * 5),
    resources: res + Math.floor(Math.random() * 12),
    logStreams: logs + Math.floor(Math.random() * 4),
  };
}

export function isValidOktaDomainInput(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  if (v.includes("..")) return false;
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      return Boolean(u.hostname?.includes("okta"));
    } catch {
      return false;
    }
  }
  return /^[a-z0-9][a-z0-9.-]*\.okta\.com$/i.test(v) || /^[a-z0-9][a-z0-9-]*$/i.test(v);
}
