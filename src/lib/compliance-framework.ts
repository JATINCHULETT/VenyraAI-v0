export type ComplianceFramework = "soc2" | "dpdp";

export const DEFAULT_COMPLIANCE_FRAMEWORK: ComplianceFramework = "soc2";

export const COMPLIANCE_FRAMEWORK_LABEL: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  dpdp: "India DPDP",
};

export const COMPLIANCE_FRAMEWORK_SUB: Record<ComplianceFramework, string> = {
  soc2: "TSC · Type I & II",
  dpdp: "Digital Personal Data Protection Act",
};

/** Supabase path segment under each owner (uploads/…/soc2, reports/…/dpdp). */
export function frameworkStorageSegment(fw: ComplianceFramework): string {
  return fw;
}

export function parseComplianceFramework(
  raw: string | null | undefined,
): ComplianceFramework {
  if (raw === "dpdp") return "dpdp";
  return "soc2";
}
