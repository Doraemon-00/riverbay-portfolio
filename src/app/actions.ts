"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { database, isConfigured } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth";
export async function login(form: FormData) {
  if (!isConfigured()) redirect("/setup");
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/login?error=invalid");
  const db = await database();
  const { data: session, error } = await db.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=invalid");
  const { data: profile } = await db.from("profiles").select("is_active").eq("id", session.user!.id).single();
  if (profile && !profile.is_active) {
    await db.auth.signOut({ scope: "local" });
    redirect("/login?error=inactive");
  }
  redirect("/");
}
export async function logout() {
  const db = await database();
  await db.auth.signOut();
  redirect("/login");
}
export type SaveResult = { ok: boolean; revision?: number; message: string };
export async function saveEntry(form: FormData): Promise<SaveResult> {
  const { db } = await requireViewer();
  const rawRating = form.get("rating");
  let observations: unknown;
  try { observations = JSON.parse(String(form.get("observations"))); }
  catch { return { ok:false, message:"Check your observations, then try saving again." }; }
  const parsed = z
    .object({
      entry_id: z.uuid(),
      expected_revision: z.coerce.number().int().min(0),
      new_rating: z.number().int().min(1).max(3).nullable(),
      new_observations: z.array(z.object({ id:z.uuid(), date:z.iso.date().nullable(), text:z.string().max(6000).refine(text => text.trim().length > 0) })).max(100).refine(items => new Set(items.map(o => o.id)).size === items.length).refine(items => JSON.stringify(items).length <= 120000),
      new_narrative: z.string().max(10000),
    })
    .safeParse({
      entry_id: form.get("entry_id"),
      expected_revision: form.get("revision"),
      new_rating: rawRating ? Number(rawRating) : null,
      new_observations: observations,
      new_narrative: form.get("narrative"),
    });
  if (!parsed.success)
    return {
      ok: false,
      message: "Check the rating, observation dates and text lengths, then try saving again.",
    };
  const { data, error } = await db.rpc("save_domain_observations", parsed.data);
  if (error)
    return {
      ok: false,
      message:
        error.code === "40001"
          ? "Someone saved a newer version. Keep your text, then reload to compare before saving."
          : "Could not save. Your text is still here; please retry.",
    };
  revalidatePath("/");
  revalidatePath("/portfolio/[id]", "page");
  return { ok: true, revision: data.revision, message: "Saved" };
}
