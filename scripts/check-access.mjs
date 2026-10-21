import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Local fictional fixture only.");
const status = JSON.parse(execFileSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore","pipe","pipe"] }));
if (status.API_URL !== url) throw new Error("Local API mismatch.");
const { password } = JSON.parse(await readFile(".demo-access.txt", "utf8"));
const client = key => createClient(url, key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const teacher=client(), other=client(), admin=client(), anon=client(), service=client(status.SERVICE_ROLE_KEY);
const ok = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
const change = async (command,payload) => ok(await admin.rpc("manage_class",{command,payload}));
const classIds=[], childIds=[];
const years=[2198,2199];
const periodsBefore=ok(await service.from("reporting_periods").select("id").in("year",years)).map(p=>p.id);
let storagePath;
let photoId;
try {
  for (const [db,email] of [[teacher,"teacher@riverbay.com"],[other,"teacher2@riverbay.com"],[admin,"admin@riverbay.com"]]) ok(await db.auth.signInWithPassword({email,password}));
  const teacherId=(await teacher.auth.getUser()).data.user.id, otherId=(await other.auth.getUser()).data.user.id;
  assert.equal((await anon.from("children").select("id")).error?.code,"42501");
  assert.ok((await teacher.rpc("manage_class",{command:"create_class",payload:{year:2198,level:"K1",name:"forbidden"}})).error);
  assert.ok((await teacher.from("class_memberships").insert({child_id:randomUUID(),academic_year:2198})).error);
  assert.ok((await admin.from("classes").insert({name:"bypass",level:"K1",academic_year:2198})).error);
  assert.ok((await teacher.from("profiles").update({role:"admin"}).eq("id",teacherId)).error);
  const stamp=randomUUID().slice(0,8);
  for (const [year,name] of [[2198,`Verify ${stamp}`],[2198,`Other ${stamp}`],[2199,`Verify ${stamp}`]]) classIds.push((await change("create_class",{year,level:"K1",name})).id);
  assert.equal((await admin.rpc("manage_class",{command:"create_class",payload:{year:2198,level:"K1",name:`Verify ${stamp}`}})).error?.code,"23505");
  const [a,b]=classIds;
  await change("assign_teachers",{year:2198,class_id:a,ids:[teacherId]});
  await change("assign_teachers",{year:2198,class_id:b,ids:[otherId]});
  for (const name of ["Verification Student A","Verification Student B"]) childIds.push((await change("create_student",{year:2198,class_id:null,name})).id);
  await change("assign_students",{year:2198,class_id:a,ids:childIds});
  const enrolments=ok(await admin.from("enrolments").select("id,period_id,child_id").in("child_id",childIds));
  assert.equal(enrolments.length,4,"Both semesters prepared for both students");
  const portfolios=ok(await admin.from("portfolios").select("id,enrolment_id").in("enrolment_id",enrolments.map(e=>e.id)));
  const entries=ok(await teacher.from("domain_entries").select("*").in("portfolio_id",portfolios.map(p=>p.id)));
  assert.equal(entries.length,16);
  const entryIds=entries.map(e=>e.id), portfolioIds=portfolios.map(p=>p.id);
  assert.equal(ok(await other.from("domain_entries").select("id").in("id",entryIds)).length,0);
  assert.ok((await other.rpc("save_domain_entry",{entry_id:entries[0].id,expected_revision:0,new_rating:1,new_comments:"forbidden",new_narrative:""})).error);
  assert.ok((await teacher.from("domain_entries").update({narrative:"bypass"}).eq("id",entries[0].id)).error);
  const entry=entries[0];
  let saved=ok(await teacher.rpc("save_domain_entry",{entry_id:entry.id,expected_revision:entry.revision,new_rating:2,new_comments:"Preserve through annual moves.",new_narrative:"Evidence-based fictional narrative."}));
  assert.equal(saved.revision,entry.revision+1);
  assert.equal((await teacher.rpc("save_domain_entry",{entry_id:entry.id,expected_revision:entry.revision,new_rating:1,new_comments:"stale",new_narrative:""})).error?.code,"40001");
  const observations=[
    {id:randomUUID(),date:"2198-01-14",text:"Introduced himself by name."},
    {id:randomUUID(),date:"2198-02-23",text:"Wrote his name and shared a picnic story."},
    {id:randomUUID(),date:null,text:"General context without an inferred date."},
  ];
  const timelineArgs={entry_id:entry.id,expected_revision:saved.revision,new_rating:2,new_narrative:saved.narrative,new_observations:observations};
  assert.equal((await other.rpc("save_domain_observations",timelineArgs)).error?.code,"42501");
  for(const invalid of [[{...observations[0],date:"2198-02-30"}],[observations[0],observations[0]],[{...observations[0],text:"   "}]]) {
    assert.ok((await teacher.rpc("save_domain_observations",{...timelineArgs,new_observations:invalid})).error);
  }
  assert.equal(ok(await teacher.from("domain_entries").select("revision").eq("id",entry.id).single()).revision,saved.revision,"Invalid timeline writes are atomic");
  saved=ok(await teacher.rpc("save_domain_observations",timelineArgs));
  assert.deepEqual(saved.observations,observations);
  assert.equal((await teacher.rpc("save_domain_observations",timelineArgs)).error?.code,"40001");
  const edited=[{...observations[1],text:"Updated fictional observation."},observations[2]];
  saved=ok(await teacher.rpc("save_domain_observations",{...timelineArgs,expected_revision:saved.revision,new_observations:edited}));
  assert.deepEqual(ok(await teacher.from("domain_entries").select("observations").eq("id",entry.id).single()).observations,edited,"Edit/remove persist on reload");
  await change("assign_students",{year:2198,class_id:b,ids:childIds});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  assert.equal(ok(await other.from("domain_entries").select("id").in("id",entryIds)).length,16);
  const moved=ok(await admin.from("domain_entries").select("*").eq("id",entry.id).single());
  assert.deepEqual(moved.observations,saved.observations); assert.equal(moved.comments,saved.comments); assert.equal(moved.narrative,saved.narrative); assert.equal(moved.revision,saved.revision);
  assert.deepEqual(ok(await admin.from("portfolios").select("id").in("id",portfolioIds)).map(p=>p.id).sort(),portfolioIds.sort());
  await change("assign_students",{year:2198,class_id:a,ids:childIds});
  assert.ok((await admin.rpc("manage_class",{command:"assign_students",payload:{year:2198,class_id:b,ids:[childIds[0],randomUUID()]}})).error);
  assert.ok(ok(await admin.from("class_memberships").select("class_id").in("child_id",childIds)).every(m=>m.class_id===a),"Failed bulk action is atomic");
  assert.ok((await admin.rpc("manage_class",{command:"assign_students",payload:{year:2199,class_id:a,ids:childIds}})).error);
  await change("archive_students",{year:2198,class_id:a,ids:childIds});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  assert.equal(ok(await admin.from("domain_entries").select("id").in("id",entryIds)).length,16);
  await change("restore_students",{year:2198,class_id:a,ids:childIds});
  await change("remove_students",{year:2198,class_id:a,ids:childIds});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  assert.ok(ok(await admin.from("class_memberships").select("class_id").in("child_id",childIds)).every(m=>m.class_id===null));
  await change("assign_students",{year:2198,class_id:a,ids:childIds});
  await change("archive_class",{year:2198,class_id:a});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  await change("restore_class",{year:2198,class_id:a});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,16);
  await change("remove_teachers",{year:2198,class_id:a,ids:[teacherId]});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  await change("assign_teachers",{year:2198,class_id:a,ids:[teacherId]});
  const periods=ok(await admin.from("reporting_periods").select("id,semester").eq("year",2198));
  const sem2Enrolment=enrolments.find(e=>e.child_id===childIds[0] && e.period_id===periods.find(p=>p.semester===2).id);
  const sem2=portfolios.find(p=>p.enrolment_id===sem2Enrolment.id);
  assert.equal(ok(await teacher.rpc("previous_semester_ratings",{current_portfolio:sem2.id})).length,4);
  assert.ok((await other.rpc("previous_semester_ratings",{current_portfolio:sem2.id})).error);
  const bytes=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=","base64");
  storagePath=`${entry.id}/${randomUUID()}.png`;
  ok(await teacher.storage.from("portfolio-photos").upload(storagePath,bytes,{contentType:"image/png"}));
  photoId=randomUUID();
  ok(await teacher.from("photos").insert({id:photoId,entry_id:entry.id,storage_key:storagePath,uploaded_by:teacherId}));
  assert.equal(ok(await other.from("photos").select("id").eq("id",photoId)).length,0);
  assert.equal(ok(await teacher.from("photos").select("id").eq("id",photoId)).length,1);
  const preview=ok(await teacher.storage.from("portfolio-photos").createSignedUrl(storagePath,60));
  assert.equal((await fetch(preview.signedUrl)).status,200);
  assert.ok((await other.storage.from("portfolio-photos").createSignedUrl(storagePath,60)).error);
  assert.ok((await anon.storage.from("portfolio-photos").download(storagePath)).error);
  assert.ok((await other.from("photos").insert({entry_id:entry.id,storage_key:`${entry.id}/${randomUUID()}.png`,uploaded_by:otherId})).error);
  assert.ok((await teacher.storage.from("portfolio-photos").upload(`${entry.id}/${randomUUID()}.svg`,Buffer.from('<svg/>'),{contentType:"image/svg+xml"})).error);
  assert.ok((await other.storage.from("portfolio-photos").download(storagePath)).error);
  ok(await teacher.from("photos").delete().eq("id",photoId)); photoId=undefined;
  ok(await teacher.storage.from("portfolio-photos").remove([storagePath])); storagePath=undefined;
  await change("clear_class",{year:2198,class_id:a});
  assert.equal(ok(await teacher.from("domain_entries").select("id").in("id",entryIds)).length,0);
  assert.equal(ok(await admin.from("portfolios").select("id").in("id",portfolioIds)).length,4);
  assert.equal(ok(await admin.from("children").select("id").in("id",childIds)).length,2);
  console.log("PASS: annual identity, both semesters, bulk assignment atomicity, cross-year checks, move/content preservation, removal, student/class archive and restore, teacher revocation, clear grouping, RLS, stale saves and private storage.");
} finally {
  // Remove only records created by this local test, never seeded/user-entered data.
  if(storagePath) await service.storage.from("portfolio-photos").remove([storagePath]);
  if(photoId) await service.from("photos").delete().eq("id",photoId);
  if(childIds.length) {
    const enrolments=ok(await service.from("enrolments").select("id").in("child_id",childIds));
    const portfolios=ok(await service.from("portfolios").select("id").in("enrolment_id",enrolments.map(e=>e.id)));
    if(portfolios.length) { ok(await service.from("domain_entries").delete().in("portfolio_id",portfolios.map(p=>p.id))); ok(await service.from("portfolios").delete().in("id",portfolios.map(p=>p.id))); }
    ok(await service.from("enrolments").delete().in("child_id",childIds));
    ok(await service.from("class_memberships").delete().in("child_id",childIds));
    ok(await service.from("children").delete().in("id",childIds));
  }
  if(classIds.length) { ok(await service.from("class_teachers").delete().in("class_id",classIds)); ok(await service.from("classes").delete().in("id",classIds)); }
  const periods=ok(await service.from("reporting_periods").select("id").in("year",years));
  const added=periods.filter(p=>!periodsBefore.includes(p.id));
  if(added.length) ok(await service.from("reporting_periods").delete().in("id",added.map(p=>p.id)));
  for(const db of [teacher,other,admin]) await db.auth.signOut({scope:"local"});
}
