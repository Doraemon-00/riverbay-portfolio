import "server-only";
import { redirect } from "next/navigation";
import { database, isConfigured } from "./supabase/server";
export type Profile = {
  id: string;
  display_name: string;
  role: "teacher" | "admin";
};
export async function requireViewer(adminOnly = false) {
  if (!isConfigured()) redirect("/setup");
  const db = await database();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?error=profile");
  if (adminOnly && profile.role !== "admin") redirect("/?notice=admin-only");
  return { db, profile: profile as Profile };
}
