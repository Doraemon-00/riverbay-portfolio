import { NextResponse } from "next/server";
import { z } from "zod";
import { database, isConfigured } from "@/lib/supabase/server";
import { ExportBlocked, exportPortfolioPdf } from "@/lib/pdf/export";

// Node.js runtime is the default for route handlers (child_process is used by the export).
export const maxDuration = 120;

const body = z.object({
  orientation: z.enum(["landscape", "portrait"]),
  mode: z.enum(["preview", "final"]),
});

/** Render the portfolio PDF, store it privately and return a short-lived download link. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return NextResponse.json({ error: "The app is not configured." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host"))
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Unknown portfolio." }, { status: 404 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an orientation and mode." }, { status: 400 });

  const db = await database();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ error: "Your account is not active." }, { status: 403 });

  try {
    const result = await exportPortfolioPdf(db, id, { orientation: parsed.data.orientation, mode: parsed.data.mode });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ExportBlocked) return NextResponse.json({ error: "The PDF cannot be created yet.", reasons: error.reasons }, { status: 409 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "The PDF could not be created." }, { status: 500 });
  }
}
