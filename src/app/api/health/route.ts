import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { isConfigured } from "@/lib/supabase/server";

/**
 * Keep-alive for the free hosted database, which pauses after a week without requests. One signed-out
 * read reaches Postgres; its policies refuse it, so no data is returned either way. Called daily by a
 * scheduled cloud routine.
 */
export async function GET() {
  await connection();
  const headers = { "Cache-Control": "no-store" };
  if (!isConfigured()) return Response.json({ ok: false, database: "not configured" }, { status: 503, headers });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { error } = await db.from("reporting_periods").select("id").limit(1);
  // A Postgres refusal (a code like 42501) still means the database answered.
  const answered = !error || Boolean(error.code);
  return Response.json({ ok: answered, database: answered ? "reached" : "unreachable" }, { status: answered ? 200 : 503, headers });
}
