const DEFAULT_PATH = "/home";

/**
 * OAuth providers are most reliable with an absolute post-login URL.
 * `pathOrUrl` may be `/home` from query params or already absolute.
 */
export function absoluteAuthCallbackUrl(pathOrUrl: string | null | undefined): string {
  const raw = pathOrUrl?.trim() || DEFAULT_PATH;
  if (typeof window === "undefined") {
    return raw.startsWith("http") ? raw : raw;
  }
  if (raw.startsWith("http")) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${window.location.origin}${path}`;
}
