import { NextResponse } from "next/server";

import { logContactLead } from "@/lib/contact-leads";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      company?: string;
      message?: string;
    };
    const email = body.email?.trim();
    const name = body.name?.trim();
    const company = body.company?.trim();
    const message = body.message?.trim();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Please add a short message (at least 10 characters)." },
        { status: 400 },
      );
    }

    await logContactLead({
      email,
      source: "landing_contact",
      name,
      company: company || null,
      message,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
