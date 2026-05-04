import { getSupabaseServerClient } from "@/lib/supabase";

export type ContactLeadSource =
  | "hipaa_waitlist"
  | "document_upload"
  | "auth_signin"
  | "auth_signup"
  | "oauth_nextauth"
  | "landing_contact";

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
  /** Landing / contact form */
  name?: string | null;
  company?: string | null;
  message?: string | null;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return;

  try {
    const supabase = getSupabaseServerClient();
    const base = {
      email,
      source: params.source,
      framework: params.framework?.trim() || null,
      detail: params.detail?.trim() || null,
    };
    const row =
      params.source === "landing_contact"
        ? {
            ...base,
            name: params.name?.trim() || null,
            company: params.company?.trim() || null,
            message: params.message?.trim() || null,
          }
        : base;
    const { error } = await supabase.from("contact_leads").insert(row);
    if (error) {
      console.warn("[contact_leads] insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[contact_leads] insert error:", e);
  }
}
