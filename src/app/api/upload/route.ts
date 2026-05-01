import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";
import { getSupabaseServerClient } from "@/lib/supabase";

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
    const filePath = `uploads/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(RAW_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    await inngest.send({
      name: "audit.process",
      data: { filePath, userEmail },
    });

    return NextResponse.json({ ok: true, filePath }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
