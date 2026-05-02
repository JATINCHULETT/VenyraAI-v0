import { getSupabaseServerClient } from "@/lib/supabase";

type BucketOptions = {
  public?: boolean;
  fileSizeLimit?: number | string | null;
  allowedMimeTypes?: string[] | null;
};

const isNotFoundError = (error: unknown) => {
  const err = error as { statusCode?: number; message?: string } | null;
  const status = err?.statusCode;
  const message = err?.message ?? "";
  return status === 404 || /not found/i.test(message);
};

export async function ensureBucketExists(bucketId: string, options?: BucketOptions) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.getBucket(bucketId);

  if (data && !error) return;
  if (error && !isNotFoundError(error)) {
    throw new Error(`Failed to read bucket ${bucketId}: ${error.message}`);
  }

  const { error: createError } = await supabase.storage.createBucket(bucketId, {
    public: options?.public ?? false,
    fileSizeLimit: options?.fileSizeLimit ?? null,
    allowedMimeTypes: options?.allowedMimeTypes ?? null,
  });

  if (createError) {
    throw new Error(`Failed to create bucket ${bucketId}: ${createError.message}`);
  }
}
