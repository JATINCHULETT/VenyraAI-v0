import { NextResponse } from "next/server";

import {
  listLatestPipelineStatusForOwner,
  readPipelineStatus,
} from "@/lib/pipeline-status";
import { resolveStorageOwner } from "@/lib/storage-owner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const owner = await resolveStorageOwner(request);
  if (owner.kind === "none") {
    return NextResponse.json(
      { progress: 0, stage: "queued", updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }

  const ownerKey = owner.key;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const status = await readPipelineStatus(ownerKey, jobId);
    if (!status) {
      return NextResponse.json(
        { progress: 0, stage: "queued", updatedAt: new Date().toISOString() },
        { status: 200 }
      );
    }
    return NextResponse.json(status, { status: 200 });
  }

  const [latest] = await listLatestPipelineStatusForOwner(ownerKey, 1);
  if (!latest) {
    return NextResponse.json(
      { progress: 0, stage: "queued", updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }

  return NextResponse.json(latest, { status: 200 });
}
