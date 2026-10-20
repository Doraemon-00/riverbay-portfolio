import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Local fictional fixture only.");
const status=JSON.parse(execFileSync(process.execPath,["node_modules/supabase/dist/supabase.js","status","-o","json"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}));
if(status.API_URL!==url) throw new Error("Local API mismatch.");
const make=key=>createClient(url,key??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const service=make(status.SERVICE_ROLE_KEY),admin=make(),teacher=make();
const ok=r=>{assert.equal(r.error,null,r.error?.message);return r.data;};
const change=async(command,payload)=>ok(await admin.rpc("manage_class",{command,payload}));
const directory=async(command,payload)=>ok(await admin.rpc("manage_directory",{command,payload}));
const years=[2196,2197], classes=[], children=[];
const before=ok(await service.from("reporting_periods").select("id").in("year",years)).map(p=>p.id);
let userId,path;
try {
 const {password}=JSON.parse(await readFile(".demo-access.txt","utf8"));
 const login=ok(await admin.auth.signInWithPassword({email:"admin@riverbay.com",password}));
 const stamp=randomUUID(),email=`directory-${stamp}@riverbay.com`,testPassword=`A7!${randomUUID()}`;
 userId=ok(await service.auth.admin.createUser({email,password:testPassword,email_confirm:true})).user.id;
 ok(await service.from("profiles").insert({id:userId,display_name:"Directory Verification Teacher",role:"teacher"}));
 ok(await teacher.auth.signInWithPassword({email,password:testPassword}));
 const initialStaffCode=ok(await service.from("profiles").select("staff_code").eq("id",userId).single()).staff_code;
 for(const year of years) classes.push((await change("create_class",{year,level:"K1",name:`Directory ${stamp.slice(0,8)}`})).id);
 for(const [i,year] of years.entries()) await directory("set_teacher_classes",{year,ids:[userId],class_ids:[classes[i]]});
 for(let i=0;i<2;i++) children.push((await change("create_student",{year:2196,class_id:classes[0],name:"Same Fictional Name"})).id);
 const codes=ok(await admin.from("children").select("id,student_code").in("id",children));
 assert.equal(new Set(codes.map(c=>c.student_code)).size,2);
 assert.ok(codes.every(c=>/^RB-\d{6,}$/.test(c.student_code)));
 const enrolments=ok(await admin.from("enrolments").select("id").in("child_id",children));
 const portfolios=ok(await admin.from("portfolios").select("id").in("enrolment_id",enrolments.map(e=>e.id)));
 const entries=ok(await teacher.from("domain_entries").select("*").in("portfolio_id",portfolios.map(p=>p.id)));
 assert.equal(entries.length,16);
 const saved=ok(await teacher.rpc("save_domain_entry",{entry_id:entries[0].id,expected_revision:0,new_rating:2,new_comments:"Retain this dated observation.",new_narrative:"Fictional learning story."}));
 await change("archive_students",{year:2197,ids:children});
 assert.equal(ok(await admin.from("children").select("id").in("id",children).not("archived_at","is",null)).length,2,"Archive is discoverable without old class/year");
 await change("restore_students",{year:2197,class_id:null,ids:children});
 assert.equal(ok(await teacher.from("children").select("id").in("id",children)).length,0,"Restoring unassigned does not restore historical access");
 const history=ok(await admin.from("class_memberships").select("*").in("child_id",children));
 assert.ok(history.every(m=>m.class_id===classes[0]&&!m.access_enabled),"Historical grouping retained without access");
 await change("assign_students",{year:2197,class_id:classes[1],ids:children});
 assert.equal(ok(await teacher.from("domain_entries").select("id").in("portfolio_id",portfolios.map(p=>p.id))).length,0,"New assignment does not reopen unrelated historical portfolios");
 assert.equal(ok(await teacher.from("children").select("id").in("id",children)).length,2);
 assert.deepEqual(ok(await admin.from("children").select("id,student_code").in("id",children)).sort((a,b)=>a.id.localeCompare(b.id)),codes.sort((a,b)=>a.id.localeCompare(b.id)));
 const retained=ok(await admin.from("domain_entries").select("*").eq("id",saved.id).single());
 assert.equal(retained.comments,saved.comments);assert.equal(retained.revision,saved.revision);
 await change("archive_students",{year:2197,ids:[children[0]]});
 await change("restore_students",{year:2197,class_id:classes[1],ids:[children[0]]});
 const currentEnrol=ok(await teacher.from("enrolments").select("id").eq("child_id",children[0]).eq("class_id",classes[1]));
 const currentPort=ok(await teacher.from("portfolios").select("id").in("enrolment_id",currentEnrol.map(e=>e.id)));
 const current=ok(await teacher.from("domain_entries").select("*").in("portfolio_id",currentPort.map(p=>p.id)))[0];
 path=`${current.id}/${randomUUID()}.png`;
 ok(await teacher.storage.from("portfolio-photos").upload(path,Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=","base64"),{contentType:"image/png"}));
 assert.ok((await teacher.rpc("manage_directory",{command:"deactivate_teachers",payload:{ids:[userId]}})).error);
 assert.ok((await admin.rpc("manage_directory",{command:"deactivate_teachers",payload:{ids:[login.user.id]}})).error,"Admin cannot be targeted by teacher controls");
 await directory("deactivate_teachers",{ids:[userId]});
 assert.equal(ok(await teacher.from("children").select("id")).length,0);
 assert.equal(ok(await teacher.from("classes").select("id")).length,0);
 assert.equal(ok(await teacher.from("domain_entries").select("id")).length,0);
 assert.ok((await teacher.storage.from("portfolio-photos").download(path)).error);
 assert.ok((await teacher.rpc("save_domain_entry",{entry_id:current.id,expected_revision:current.revision,new_rating:1,new_comments:"Denied",new_narrative:""})).error);
 assert.ok((await teacher.from("profiles").update({is_active:true}).eq("id",userId)).error);
 await directory("reactivate_teachers",{ids:[userId]});
 assert.equal(ok(await teacher.from("children").select("id").in("id",children)).length,2);
 assert.ok((await admin.rpc("manage_directory",{command:"set_teacher_classes",payload:{year:2197,ids:[userId],class_ids:[randomUUID()]}})).error);
 assert.equal(ok(await teacher.from("children").select("id").in("id",children)).length,2,"Invalid assignment changes are atomic");
 // Bulk additions retain prior access, are idempotent and reject the entire invalid selection.
 const otherTeacher=ok(await service.from("profiles").select("id").eq("role","teacher").neq("id",userId).limit(1))[0].id;
 const priorAssignments=ok(await service.from("class_teachers").select("class_id").eq("teacher_id",otherTeacher)).map(a=>a.class_id).sort();
 const extraClass=(await change("create_class",{year:2197,level:"K1",name:`Bulk ${stamp.slice(0,8)}`})).id;classes.push(extraClass);
 const bulkPayload={year:2197,ids:[userId,otherTeacher],class_ids:[classes[1],extraClass]};
 const bulk=payload=>admin.rpc("add_teacher_classes",{payload});
 assert.equal(ok(await bulk(bulkPayload)).count,3);
 assert.equal(ok(await bulk(bulkPayload)).count,0,"Repeated bulk adds do not duplicate access");
 const added=ok(await service.from("class_teachers").select("teacher_id,class_id").in("teacher_id",bulkPayload.ids).in("class_id",bulkPayload.class_ids));
 assert.equal(added.length,4,"Every selected teacher receives every selected class");
 assert.deepEqual(ok(await service.from("class_teachers").select("class_id").eq("teacher_id",otherTeacher)).map(a=>a.class_id).filter(id=>!bulkPayload.class_ids.includes(id)).sort(),priorAssignments);
 assert.ok((await bulk({...bulkPayload,class_ids:[classes[0],extraClass]})).error,"Cross-year class rejected");
 assert.ok((await bulk({...bulkPayload,class_ids:[]})).error);
 assert.ok((await bulk({...bulkPayload,ids:[userId,login.user.id]})).error,"Administrator is not a teacher target");
 assert.ok((await teacher.rpc("add_teacher_classes",{payload:bulkPayload})).error,"Teachers cannot grant access");
 await directory("deactivate_teachers",{ids:[userId]});
 assert.ok((await bulk(bulkPayload)).error,"Archived teacher rejected");
 await directory("reactivate_teachers",{ids:[userId]});
 assert.equal(ok(await service.from("class_teachers").select("teacher_id,class_id").in("teacher_id",bulkPayload.ids).in("class_id",bulkPayload.class_ids)).length,4);
 await directory("set_teacher_classes",{year:2197,ids:[userId],class_ids:[]});
 assert.equal(ok(await teacher.from("children").select("id").in("id",children)).length,0);
 assert.equal(ok(await service.from("profiles").select("staff_code").eq("id",userId).single()).staff_code,initialStaffCode,"Staff ID survives archive/restore and class changes");
 console.log("PASS: permanent unique IDs, school-wide archive discovery, cross-year restore without stale access, explicit reassignment, history/content preservation, teacher activation, live-session read/write/storage denial, privilege checks, atomic class access changes and additive/idempotent bulk teacher assignments.");
} finally {
 if(path) ok(await service.storage.from("portfolio-photos").remove([path]));
 if(children.length){
  const enrolments=ok(await service.from("enrolments").select("id").in("child_id",children));
  const portfolios=ok(await service.from("portfolios").select("id").in("enrolment_id",enrolments.map(e=>e.id)));
  if(portfolios.length){ok(await service.from("domain_entries").delete().in("portfolio_id",portfolios.map(p=>p.id)));ok(await service.from("portfolios").delete().in("id",portfolios.map(p=>p.id)));}
  ok(await service.from("enrolments").delete().in("child_id",children));ok(await service.from("class_memberships").delete().in("child_id",children));ok(await service.from("children").delete().in("id",children));
 }
 if(classes.length){ok(await service.from("class_teachers").delete().in("class_id",classes));ok(await service.from("classes").delete().in("id",classes));}
 const added=ok(await service.from("reporting_periods").select("id").in("year",years)).filter(p=>!before.includes(p.id));
 if(added.length)ok(await service.from("reporting_periods").delete().in("id",added.map(p=>p.id)));
 if(userId){ok(await service.from("profiles").delete().eq("id",userId));ok(await service.auth.admin.deleteUser(userId));}
 await admin.auth.signOut({scope:"local"});await teacher.auth.signOut({scope:"local"});
}
