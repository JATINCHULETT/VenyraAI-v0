import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing waitlist email." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendApiKey || !resendFromEmail) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM_EMAIL." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: "HIPAA early access waitlist",
      html: `
        <p>Thanks for joining the HIPAA compliance waitlist.</p>
        <p>We will reach out with early access updates soon.</p>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
