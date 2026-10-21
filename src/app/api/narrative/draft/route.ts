import { database } from "@/lib/supabase/server";
import { draftRequestSchema } from "@/lib/drafting";
import { domains } from "@/lib/portfolio";
import { DraftProviderError, generateNarrative } from "@/lib/ai/narrative-provider";

const requests = new Map<string,{ since:number; count:number; busy:boolean }>();
function reply(body:unknown,status=200) { return Response.json(body,{status,headers:{"Cache-Control":"no-store"}}); }
export async function POST(request:Request) {
  const origin = request.headers.get("origin");
  // Next may normalize request.url to its listening host behind the proxy.
  // Compare the browser's origin to the actual HTTP Host instead.
  if (origin) {
    try {
      if (new URL(origin).host !== (request.headers.get("host") ?? new URL(request.url).host)) return reply({error:"This request must come from the portfolio tool."},403);
    } catch { return reply({error:"This request must come from the portfolio tool."},403); }
  }
  const db = await database();
  const {data:{user}} = await db.auth.getUser();
  if (!user) return reply({error:"Please sign in again before drafting."},401);
  const {data:profile} = await db.from("profiles").select("is_active").eq("id",user.id).single();
  if (!profile?.is_active) return reply({error:"This account cannot draft portfolios."},403);
  let raw:unknown;
  try {
    if (Number(request.headers.get("content-length")) > 180000) return reply({error:"The observations are too long for one draft."},413);
    const text = await request.text();
    if (text.length > 180000) return reply({error:"The observations are too long for one draft."},413);
    raw = JSON.parse(text);
  } catch { return reply({error:"Could not read the observations. Please try again."},400); }
  const parsed = draftRequestSchema.safeParse(raw);
  if (!parsed.success) return reply({error:"Add at least one observation and check the dates and text lengths before drafting."},400);
  const {data:entry,error} = await db.from("domain_entries").select("domain,revision").eq("id",parsed.data.entryId).maybeSingle();
  if (error) return reply({error:"Could not check portfolio access. Please retry."},503);
  if (!entry || !domains.some(d => d.id === entry.domain)) return reply({error:"This portfolio is unavailable."},403);
  if (entry.revision !== parsed.data.revision) return reply({error:"Someone saved a newer version. Keep your notes and reload to compare before drafting."},409);
  const now = Date.now();
  for (const [id,value] of requests) if (!value.busy && now-value.since > 60000) requests.delete(id);
  const window = requests.get(user.id) ?? {since:now,count:0,busy:false};
  if (window.busy || window.count >= 6) return reply({error:"Please wait a moment before requesting another draft."},429);
  window.count++; window.busy=true; requests.set(user.id,window);
  try { return reply(await generateNarrative(entry.domain,parsed.data)); }
  catch (error) {
    const code = error instanceof DraftProviderError ? error.code : "unavailable";
    const messages = {
      configuration:"AI drafting is not configured yet. An administrator needs to check the API key and model settings.",
      rate_limit:"The AI service is busy or has reached its usage limit. Please try again later.",
      timeout:"Drafting took too long. Your notes and narrative are unchanged; please try again.",
      invalid_output:"The AI could not return a usable draft. Your text is unchanged; please try again.",
      unavailable:"Could not generate a draft. Your notes and narrative are unchanged; please try again.",
    };
    return reply({error:messages[code]},code === "rate_limit" ? 429 : 503);
  } finally { window.busy=false; }
}
