import { getSupabaseServerClient } from "@/lib/supabase";

export type ContactLeadSource =
  | "hipaa_waitlist"
  | "document_upload"
  | "auth_signin"
  | "auth_signup"
  | "oauth_nextauth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Persist an email for manual follow-up (Table: `contact_leads`).
 * Best-effort: failures are logged and never throw to callers.
 */
export async function logContactLead(params: {
  email: string;
  source: ContactLeadSource;
  /** e.g. soc2 | dpdp when source is document_upload */
  framework?: string | null;
  /** e.g. OAuth provider id when source is oauth_nextauth */
  detail?: string | null;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return;

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("contact_leads").insert({
      email,
      source: params.source,
      framework: params.framework?.trim() || null,
      detail: params.detail?.trim() || null,
    });
    if (error) {
      console.warn("[contact_leads] insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[contact_leads] insert error:", e);
  }
}
