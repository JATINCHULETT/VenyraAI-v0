import { Buffer } from "node:buffer";

import { getSupabaseServerClient } from "@/lib/supabase";
import { ensureBucketExists } from "@/lib/supabase-buckets";

export type PipelineStage =
  | "queued"
  | "scanning"
  | "ocr"
  | "llm"
  | "report"
  | "upload"
  | "email"
  | "complete"
  | "error";

export type PipelineStatus = {
  jobId: string;
  /** Storage isolation key (u-… or g-…). */
  ownerKey: string;
  filePath: string;
  stage: PipelineStage;
  progress: number;
  updatedAt: string;
  email?: string;
  reportFilePath?: string;
  reportUrl?: string;
  error?: string;
};

const STATUS_BUCKET = "compliance-final-reports";

export function getStatusPath(ownerKey: string, jobId: string) {
  return `status/${ownerKey}/${jobId}.json`;
}

export async function writePipelineStatus(status: PipelineStatus) {
  const supabase = getSupabaseServerClient();
  await ensureBucketExists(STATUS_BUCKET);
  const path = getStatusPath(status.ownerKey, status.jobId);
  const body = Buffer.from(JSON.stringify(status));

  const { error } = await supabase.storage.from(STATUS_BUCKET).upload(path, body, {
    contentType: "application/json",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to write pipeline status: ${error.message}`);
  }

  return path;
}

export async function readPipelineStatus(ownerKey: string, jobId: string) {
  const supabase = getSupabaseServerClient();
  try {
    await ensureBucketExists(STATUS_BUCKET);
  } catch (error) {
    console.error("Failed to ensure status bucket", error);
    return null;
  }
  const { data, error } = await supabase.storage
    .from(STATUS_BUCKET)
    .download(getStatusPath(ownerKey, jobId));

  if (error || !data) {
    return null;
  }

  const text = await data.text();
  try {
    return JSON.parse(text) as PipelineStatus;
  } catch {
    return null;
  }
}

export async function listLatestPipelineStatusForOwner(ownerKey: string, limit = 1) {
  const supabase = getSupabaseServerClient();
  try {
    await ensureBucketExists(STATUS_BUCKET);
  } catch (error) {
    console.error("Failed to ensure status bucket", error);
    return [] as PipelineStatus[];
  }

  const prefix = `status/${ownerKey}`;
  const { data, error } = await supabase.storage.from(STATUS_BUCKET).list(prefix, {
    limit: 40,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error || !data) {
    return [] as PipelineStatus[];
  }

  const statuses: PipelineStatus[] = [];
  for (const item of data) {
    if (!item.name.endsWith(".json")) continue;
    const jobId = item.name.replace(/\.json$/, "");
    const status = await readPipelineStatus(ownerKey, jobId);
    if (status) statuses.push(status);
    if (statuses.length >= limit) break;
  }

  return statuses;
}
