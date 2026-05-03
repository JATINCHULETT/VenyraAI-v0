import { getSupabaseServerClient } from "@/lib/supabase";

type BucketOptions = {
  public?: boolean;
  fileSizeLimit?: number | string | null;
  allowedMimeTypes?: string[] | null;
};

const BUCKET_READ_ATTEMPTS = 3;
const BUCKET_CREATE_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isNotFoundError = (error: unknown) => {
  const err = error as { statusCode?: number; message?: string } | null;
  const status = err?.statusCode;
  const message = err?.message ?? "";
  return status === 404 || /not found/i.test(message);
};

/** Low-level network / TLS failures from undici/fetch — common on flaky Wi‑Fi, VPN, or IPv6 quirks. */
const isTransientStorageError = (error: unknown) => {
  const message = (error as { message?: string } | null)?.message ?? "";
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|socket|network|UND_ERR_/i.test(
    message,
  );
};

function bucketTroubleshootHint(): string {
  return [
    "Confirm SUPABASE_URL is your project URL (Settings → API, e.g. https://xxxx.supabase.co) with no trailing slash,",
    "SUPABASE_SERVICE_ROLE_KEY is the service_role secret (not anon),",
    "and the project is not paused. On Windows, if errors persist try: set NODE_OPTIONS=--dns-result-order=ipv4first",
  ].join(" ");
}

export async function ensureBucketExists(bucketId: string, options?: BucketOptions) {
  const supabase = getSupabaseServerClient();
  let getBucketError: { message: string } | null = null;

  for (let attempt = 0; attempt < BUCKET_READ_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.storage.getBucket(bucketId);
    if (data && !error) return;
    if (error && isNotFoundError(error)) {
      getBucketError = null;
      break;
    }
    if (error && isTransientStorageError(error) && attempt < BUCKET_READ_ATTEMPTS - 1) {
      await sleep(350 * (attempt + 1));
      continue;
    }
    if (error) {
      getBucketError = error;
      break;
    }
  }

  if (getBucketError) {
    throw new Error(
      `Failed to read bucket ${bucketId}: ${getBucketError.message}. ${bucketTroubleshootHint()}`,
    );
  }

  for (let attempt = 0; attempt < BUCKET_CREATE_ATTEMPTS; attempt++) {
    const { error: createError } = await supabase.storage.createBucket(bucketId, {
      public: options?.public ?? false,
      fileSizeLimit: options?.fileSizeLimit ?? null,
      allowedMimeTypes: options?.allowedMimeTypes ?? null,
    });

    if (!createError) return;

    if (isNotFoundError(createError) || /already exists|duplicate/i.test(createError.message ?? "")) {
      return;
    }

    if (isTransientStorageError(createError) && attempt < BUCKET_CREATE_ATTEMPTS - 1) {
      await sleep(350 * (attempt + 1));
      continue;
    }

    throw new Error(
      `Failed to create bucket ${bucketId}: ${createError.message}. ${bucketTroubleshootHint()}`,
    );
  }
}
