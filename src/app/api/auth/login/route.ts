import { z } from "zod";
import { database, isConfigured } from "@/lib/supabase/server";

// Sign-in is a plain endpoint rather than a Server Action: its address never changes between
// deployments, so a sign-in page left open across a deploy still works.
export type LoginError = "invalid" | "credentials" | "busy" | "service" | "inactive" | "profile";
const credentials = z.object({ email: z.email(), password: z.string().min(1).max(200) });
export async function POST(request: Request) {
  // Before the page's script loads, the form posts here natively; answer with redirects then, never
  // echoing the password. With the script loaded the form sends JSON and gets JSON back.
  const native = !(request.headers.get("content-type") ?? "").includes("application/json");
  const reply = (body: { ok: true } | { ok: false; error: LoginError }, status = 200) => native
    ? new Response(null, { status: 303, headers: { Location: body.ok ? "/" : `/login?error=${body.error}`, "Cache-Control": "no-store" } })
    : Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!isConfigured()) return reply({ ok: false, error: "service" }, 503);
  const origin = request.headers.get("origin");
  try {
    if (origin && new URL(origin).host !== (request.headers.get("host") ?? new URL(request.url).host)) return reply({ ok: false, error: "invalid" }, 403);
  } catch { return reply({ ok: false, error: "invalid" }, 403); }
  const input = native
    ? await request.formData().then(form => Object.fromEntries(form), () => null)
    : await request.json().catch(() => null);
  const parsed = credentials.safeParse(input);
  if (!parsed.success) return reply({ ok: false, error: "invalid" }, 400);

  const db = await database();
  const { data, error } = await db.auth.signInWithPassword(parsed.data);
  if (error) {
    // Wrong details and a struggling service need different advice.
    if (error.code === "invalid_credentials" || error.status === 400) return reply({ ok: false, error: "credentials" }, 401);
    if (error.status === 429) return reply({ ok: false, error: "busy" }, 429);
    return reply({ ok: false, error: "service" }, 503);
  }
  const { data: profile } = await db.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile || !profile.is_active) {
    await db.auth.signOut({ scope: "local" });
    return reply({ ok: false, error: profile ? "inactive" : "profile" }, 403);
  }
  return reply({ ok: true });
}
