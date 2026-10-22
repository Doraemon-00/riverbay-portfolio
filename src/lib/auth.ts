import "server-only";
import { redirect } from "next/navigation";
import { database, isConfigured } from "./supabase/server";
export type Profile = {
  id: string;
  display_name: string;
  role: "teacher" | "admin";
};
type Database = Awaited<ReturnType<typeof database>>;

/**
 * Signed-in session without a round trip: getClaims verifies the access token locally with the
 * project's asymmetric signing keys (the proxy refreshes it). A revoked session stays valid until the
 * token expires; archived staff are still refused by requireProfile and the database policies.
 */
export async function viewerSession() {
  if (!isConfigured()) redirect("/setup");
  const db = await database();
  const { data, error } = await db.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { db, userId };
}

export async function requireViewer(adminOnly = false) {
  const { db, userId } = await viewerSession();
  return { db, profile: await requireProfile(db, userId, adminOnly) };
}

/** Active staff profile for the session; can run alongside other queries for the same request. */
export async function requireProfile(db: Database, userId: string, adminOnly = false) {
  const { data: profile } = await db
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("id", userId)
    .single();
  if (!profile) redirect("/login?error=profile");
  if (!profile.is_active) {
    await db.auth.signOut({ scope: "local" });
    redirect("/login?error=inactive");
  }
  if (adminOnly && profile.role !== "admin") redirect("/?notice=admin-only");
  return profile as Profile;
}
