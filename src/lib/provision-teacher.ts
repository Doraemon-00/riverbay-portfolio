import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().toLowerCase().pipe(z.email()), year: z.number().int().min(2020).max(2200), class_ids: z.array(z.uuid()).max(200) }).strict();
export type TeacherSetup = { ok: boolean; message: string; id?: string; email?: string; initialPassword?: string };

export async function provisionTeacher(db: SupabaseClient, input: unknown): Promise<TeacherSetup> {
  const { data: session, error: authError } = await db.auth.getUser();
  if (authError || !session.user) return { ok: false, message: "Administrator access required." };
  const { data: actor } = await db.from("profiles").select("role,is_active").eq("id",session.user.id).single();
  if (actor?.role !== "admin" || !actor.is_active) return { ok: false, message: "Administrator access required." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the name, email and class selections." };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return { ok: false, message: "Teacher account setup is not configured on this server. Your administrator needs to configure the server account key." };
  const { name, email, year, class_ids } = parsed.data;
  // Validate before provisioning, then validate again inside the atomic RPC.
  if (class_ids.length) {
    const { data, error } = await db.from("classes").select("id").in("id",class_ids).eq("academic_year",year).is("archived_at",null);
    if (error || data.length !== new Set(class_ids).size || new Set(class_ids).size !== class_ids.length) return { ok: false, message: "Some classes are no longer available. Check your selections." };
  }
  const auth = createClient(url,key,{ auth: { persistSession: false, autoRefreshToken: false } });
  // Shared credentials are an explicit requirement of this fictional demo.
  const initialPassword = "teach2LEARN";
  const { data: created, error } = await auth.auth.admin.createUser({ email, password: initialPassword, email_confirm: true, app_metadata: { riverbay_setup_by: session.user.id } });
  if (error || !created.user) return { ok: false, message: error?.code === "email_exists" || error?.code === "email_address_exists" ? "This email already has an account. Use the existing teacher record or another email." : "Could not create the account. Check the email and try again." };
  const id = created.user.id;
  try {
    const { error: profileError } = await db.rpc("finish_teacher_setup",{ teacher_id: id, teacher_name: name, teacher_email: email, yr: year, class_ids });
    if (profileError) throw new Error("Profile setup failed");
  } catch {
    // Only this request's newly-created auth account is eligible for compensation.
    const { error: cleanupError } = await auth.auth.admin.deleteUser(id);
    return { ok: false, message: cleanupError ? "Account setup was interrupted. Ask your administrator to check provisioning before retrying." : "Could not finish account setup. No teacher was added; check the classes and retry." };
  }
  // The password is returned only to the authorised caller, never stored in
  // application tables, written to logs, or sent in an email.
  return { ok: true, message: "Teacher added.", id, email, initialPassword };
}
