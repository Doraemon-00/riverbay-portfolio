// Run only against the isolated fixture-transport server on localhost:3001.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
const base="http://127.0.0.1:3001";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw Error("Local demo database only.");
const {password}=JSON.parse(await readFile(".demo-access.txt","utf8"));
const jar=new Map();
const db=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
const ok=r=>{assert.equal(r.error,null,r.error?.message);return r.data;};
ok(await db.auth.signInWithPassword({email:"teacher@riverbay.com",password}));
try {
  const entry=ok(await db.from("domain_entries").select("id,domain,revision,narrative,observations").limit(1).single());
  const payload={entryId:entry.id,revision:entry.revision,rating:null,observations:[{id:randomUUID(),date:null,text:"Named a familiar story character with picture prompts."}]};
  const call=(body,authenticated=true,origin=base)=>fetch(`${base}/api/narrative/draft`,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...(authenticated?{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; ")}:{})},body:JSON.stringify(body)});
  assert.equal((await call(payload,false)).status,401);
  assert.equal((await call(payload,true,"https://unrelated.example")).status,403);
  assert.equal((await call({...payload,entryId:randomUUID()})).status,403);
  assert.equal((await call({...payload,revision:entry.revision+1})).status,409);
  assert.equal((await call({...payload,observations:[]})).status,400);
  const response=await call(payload);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.model,"fixture-only-not-a-live-model");
  assert.ok(result.narrative);
  assert.equal(result.inputRevision,entry.revision);
  assert.ok(response.headers.get("cache-control").includes("no-store"));
  assert.equal((await call({...payload,observations:[{...payload.observations[0],text:"[TEST_FAIL]"}]})).status,503);
  const unchanged=ok(await db.from("domain_entries").select("revision,narrative,observations").eq("id",entry.id).single());
  assert.equal(unchanged.revision,entry.revision);assert.equal(unchanged.narrative,entry.narrative);assert.deepEqual(unchanged.observations,entry.observations);
  console.log("PASS: authenticated draft route, unauthenticated/cross-origin/inaccessible/stale/empty rejection, provider error, response provenance and no automatic database changes. Fixture transport only; not a live GPT test.");
} finally { await db.auth.signOut({scope:"local"}); }
