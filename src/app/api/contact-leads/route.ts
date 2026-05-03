import { NextResponse } from "next/server";

import type { ContactLeadSource } from "@/lib/contact-leads";
import { logContactLead } from "@/lib/contact-leads";

export const runtime = "nodejs";

const ALLOWED_SOURCES = new Set<ContactLeadSource>([
  "auth_signin",
  "auth_signup",
]);

/**
 * Browser-callable log for auth flows (sign-in / sign-up forms).
 * Waitlist and uploads log on the server inside their own routes.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      source?: string;
    };
    const email = body.email?.trim();
    const source = body.source as ContactLeadSource;

    if (!email || !ALLOWED_SOURCES.has(source)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or source." },
        { status: 400 },
      );
    }

    await logContactLead({ email, source });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
