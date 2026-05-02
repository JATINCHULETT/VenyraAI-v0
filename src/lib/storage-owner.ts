import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { auth } from "@/auth";

const GUEST_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hashOwnerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

/**
 * Resolves isolated storage key: signed-in user (NextAuth or Supabase JWT), or guest browser scope.
 * Guest scope must be a UUID sent via `x-venyra-guest` (new id each page load = empty list after refresh).
 */
export async function resolveStorageOwner(request: Request): Promise<
  { kind: "user"; key: string } | { kind: "guest"; key: string } | { kind: "none" }
> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (email) return { kind: "user", key: `u-${hashOwnerSeed(email)}` };
  if (userId) return { kind: "user", key: `u-${hashOwnerSeed(userId)}` };

  const authz = request.headers.get("authorization");
  const bearer = authz?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (bearer && url && anon) {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.auth.getUser(bearer);
    const user = data?.user;
    if (!error && user?.email) return { kind: "user", key: `u-${hashOwnerSeed(user.email)}` };
    if (!error && user?.id) return { kind: "user", key: `u-${hashOwnerSeed(user.id)}` };
  }

  const guest = request.headers.get("x-venyra-guest")?.trim();
  if (guest && GUEST_UUID.test(guest)) {
    return { kind: "guest", key: `g-${guest}` };
  }

  return { kind: "none" };
}
