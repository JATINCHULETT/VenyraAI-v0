import { NextResponse } from "next/server";

import { logContactLead } from "@/lib/contact-leads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing waitlist email." },
        { status: 400 },
      );
    }

    await logContactLead({ email, source: "hipaa_waitlist" });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
