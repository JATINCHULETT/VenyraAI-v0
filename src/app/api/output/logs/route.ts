import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase";

const FINAL_BUCKET = "compliance-final-reports";
const REPORT_PREFIX = "reports";
const REPORT_LINK_EXPIRY_SECONDS = 60 * 60 * 24;

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage.from(FINAL_BUCKET).list(REPORT_PREFIX, {
    limit: 25,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error || !data) {
    return NextResponse.json({ files: [] }, { status: 200 });
  }

  const files = await Promise.all(
    data
      .filter((item) => item.name.endsWith(".pdf"))
      .map(async (item) => {
        const path = `${REPORT_PREFIX}/${item.name}`;
        const { data: signed } = await supabase.storage
          .from(FINAL_BUCKET)
          .createSignedUrl(path, REPORT_LINK_EXPIRY_SECONDS);

        return {
          name: item.name,
          path,
          size: item.metadata?.size ?? null,
          updatedAt: item.updated_at ?? item.created_at ?? null,
          url: signed?.signedUrl ?? null,
        };
      })
  );

  return NextResponse.json({ files }, { status: 200 });
}
