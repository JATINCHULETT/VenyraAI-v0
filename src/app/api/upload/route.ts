import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { runAuditPipeline } from "@/lib/audit-pipeline";
import { ensureBucketExists } from "@/lib/supabase-buckets";
import { getSupabaseServerClient } from "@/lib/supabase";
import { writePipelineStatus } from "@/lib/pipeline-status";

const RAW_BUCKET = "compliance-raw-docs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userEmail = formData.get("email");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file upload." },
        { status: 400 }
      );
    }

    if (typeof userEmail !== "string" || userEmail.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing user email." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseServerClient();
    await ensureBucketExists(RAW_BUCKET);
    const jobId = randomUUID();
    const filePath = `uploads/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(RAW_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload failed", uploadError);
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    try {
      await writePipelineStatus({
        jobId,
        filePath,
        stage: "queued",
        progress: 5,
        updatedAt: new Date().toISOString(),
        email: userEmail,
      });
    } catch (statusError) {
      console.warn("Failed to write initial pipeline status", statusError);
    }

    const result = await runAuditPipeline({ filePath, userEmail, jobId });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Pipeline failed." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        filePath,
        jobId,
        reportFilePath: result.reportFilePath,
        reportUrl: result.reportUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload route failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
