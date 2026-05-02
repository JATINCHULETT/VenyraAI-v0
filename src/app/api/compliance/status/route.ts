import { NextResponse } from "next/server";

import {
  listLatestPipelineStatus,
  readPipelineStatus,
} from "@/lib/pipeline-status";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const status = await readPipelineStatus(jobId);
    if (!status) {
      return NextResponse.json(
        { progress: 0, stage: "queued", updatedAt: new Date().toISOString() },
        { status: 200 }
      );
    }
    return NextResponse.json(status, { status: 200 });
  }

  const [latest] = await listLatestPipelineStatus(1);
  if (!latest) {
    return NextResponse.json(
      { progress: 0, stage: "queued", updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }

  return NextResponse.json(latest, { status: 200 });
}
