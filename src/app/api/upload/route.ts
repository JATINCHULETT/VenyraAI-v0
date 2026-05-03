import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  frameworkStorageSegment,
  parseComplianceFramework,
} from "@/lib/compliance-framework";
import { runAuditPipeline } from "@/lib/audit-pipeline";
import { logContactLead } from "@/lib/contact-leads";
import { resolveStorageOwner } from "@/lib/storage-owner";
import { ensureBucketExists } from "@/lib/supabase-buckets";
import { getSupabaseServerClient } from "@/lib/supabase";
import { writePipelineStatus } from "@/lib/pipeline-status";

const RAW_BUCKET = "compliance-raw-docs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const owner = await resolveStorageOwner(request);
    if (owner.kind === "none") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sign in or continue as a guest (refresh starts a new guest session). Missing auth scope.",
        },
        { status: 401 },
      );
    }

    const ownerKey = owner.key;
    const formData = await request.formData();
    const file = formData.get("file");
    const userEmail = formData.get("email");
    const framework = parseComplianceFramework(
      typeof formData.get("framework") === "string"
        ? (formData.get("framework") as string)
        : null,
    );
    const fwSeg = frameworkStorageSegment(framework);

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
    try {
      await ensureBucketExists(RAW_BUCKET);
    } catch (e) {
      console.warn(
        "Upload: ensureBucketExists(raw) failed — continuing in case bucket already exists",
        e,
      );
    }
    const jobId = randomUUID();
    const filePath = `uploads/${ownerKey}/${fwSeg}/${Date.now()}-${file.name}`;

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

    void logContactLead({
      email: userEmail,
      source: "document_upload",
      framework,
    });

    try {
      await writePipelineStatus({
        jobId,
        ownerKey,
        filePath,
        framework,
        stage: "queued",
        progress: 5,
        updatedAt: new Date().toISOString(),
        email: userEmail,
      });
    } catch (statusError) {
      console.warn("Failed to write initial pipeline status", statusError);
    }

    const result = await runAuditPipeline({
      filePath,
      userEmail,
      jobId,
      ownerKey,
      framework,
    });
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
