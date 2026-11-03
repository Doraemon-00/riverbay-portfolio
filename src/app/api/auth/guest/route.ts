import { database, isConfigured } from "@/lib/supabase/server";
import { guestAccount } from "@/lib/guest";
import type { LoginError } from "../login/route";

// Signs the visitor in to the shared guest school. The guest password stays on the server.
export async function POST(request: Request) {
  const native = !(request.headers.get("content-type") ?? "").includes("application/json");
  const reply = (body: { ok: true } | { ok: false; error: LoginError }, status = 200) => native
    ? new Response(null, { status: 303, headers: { Location: body.ok ? "/" : `/login?error=${body.error}`, "Cache-Control": "no-store" } })
    : Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const guest = guestAccount();
  if (!isConfigured() || !guest) return reply({ ok: false, error: "guest" }, 503);
  const origin = request.headers.get("origin");
  try {
    if (origin && new URL(origin).host !== (request.headers.get("host") ?? new URL(request.url).host)) return reply({ ok: false, error: "invalid" }, 403);
  } catch { return reply({ ok: false, error: "invalid" }, 403); }

  const db = await database();
  const { data, error } = await db.auth.signInWithPassword(guest);
  if (error) return reply({ ok: false, error: error.status === 429 ? "busy" : "guest" }, error.status === 429 ? 429 : 503);
  const { data: profile } = await db.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await db.auth.signOut({ scope: "local" });
    return reply({ ok: false, error: "guest" }, 503);
  }
  return reply({ ok: true });
}
