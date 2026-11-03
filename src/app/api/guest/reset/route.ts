import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guestAccount, serviceClient, staffSchool } from "@/lib/guest";

// Vercel Cron calls this once a day (vercel.json: 19:00 UTC, 3am SGT) with CRON_SECRET as a bearer
// token. The first run creates the guest school as a copy of the staff school and saves it as the
// snapshot; every later run puts the guest school back to that snapshot. Staff records are never changed.
export const maxDuration = 120;

const PHOTOS = "portfolio-photos", EXPORTS = "portfolio-exports", SNAPSHOT = "guest-snapshot";
type Plan = { ready: boolean; remove_photos: string[]; remove_exports: string[]; restore_photos: string[] };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const db = serviceClient(), guest = guestAccount();
  if (!db || !guest) return Response.json({ error: "The guest school is not configured on this server." }, { status: 503 });
  try {
    // The server's settings are the source of truth for the guest sign-in.
    const adminId = await ensureUser(db, guest.email, guest.password);
    const plan = await call<Plan>(db, "guest_reset_plan");
    const result = plan.ready ? await reset(db, plan) : await create(db, adminId);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The guest school could not be reset." }, { status: 500 });
  }
}

async function call<T>(db: SupabaseClient, name: string, args?: object): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as T;
}

async function ensureUser(db: SupabaseClient, email: string, password: string) {
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`List sign-ins: ${error.message}`);
  const existing = data.users.find(u => u.email?.toLowerCase() === email);
  if (existing) {
    const { error: update } = await db.auth.admin.updateUserById(existing.id, { password });
    if (update) throw new Error(`Update ${email}: ${update.message}`);
    return existing.id;
  }
  const { data: created, error: create } = await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { riverbay_guest: true } });
  if (create || !created.user) throw new Error(`Create ${email}: ${create?.message}`);
  return created.user.id;
}

async function copyFile(db: SupabaseClient, fromBucket: string, from: string, targets: [string, string][]) {
  const file = await db.storage.from(fromBucket).download(from);
  if (file.error) throw new Error(`Download ${from}: ${file.error.message}`);
  for (const [bucket, path] of targets) {
    const up = await db.storage.from(bucket).upload(path, file.data, { contentType: file.data.type || "image/jpeg", upsert: true });
    if (up.error) throw new Error(`Upload ${path}: ${up.error.message}`);
  }
}

async function remove(db: SupabaseClient, bucket: string, paths: string[]) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`Remove files from ${bucket}: ${error.message}`);
  }
}

/** First run: copy the staff school, with a sign-in nobody knows for each teacher's guest copy. */
async function create(db: SupabaseClient, adminId: string) {
  const { data: teachers, error } = await db.from("profiles").select("id,email").eq("school_id", staffSchool).eq("role", "teacher");
  if (error) throw new Error(`Read staff teachers: ${error.message}`);
  const teacherMap: Record<string, string> = {};
  for (const t of teachers) {
    const local = (t.email ?? t.id).split("@")[0];
    teacherMap[t.id] = await ensureUser(db, `${local}@guest.riverbay.com`, randomBytes(24).toString("base64url"));
  }
  const files = await call<{ from: string; to: string }[]>(db, "copy_school_to_guest", { guest_admin: adminId, teacher_map: teacherMap });
  for (const f of files) await copyFile(db, PHOTOS, f.from, [[PHOTOS, f.to], [SNAPSHOT, f.to]]);
  const snapshot = await call<{ children: number; photos: number }>(db, "capture_guest_snapshot");
  return { action: "created", ...snapshot };
}

/** Nightly: remove what guests added, bring back deleted snapshot photos, then restore the records. */
async function reset(db: SupabaseClient, plan: Plan) {
  await remove(db, PHOTOS, plan.remove_photos);
  await remove(db, EXPORTS, plan.remove_exports);
  for (const path of plan.restore_photos) await copyFile(db, SNAPSHOT, path, [[PHOTOS, path]]);
  const { removed_users } = await call<{ removed_users: string[] }>(db, "reset_guest_school");
  for (const id of removed_users) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) throw new Error(`Delete guest-made sign-in: ${error.message}`);
  }
  return { action: "reset", removedPhotos: plan.remove_photos.length, removedPdfs: plan.remove_exports.length, restoredPhotos: plan.restore_photos.length, removedAccounts: removed_users.length };
}
