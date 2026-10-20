import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { provisionTeacher } from "../src/lib/provision-teacher.ts";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!url || !["127.0.0.1","localhost"].includes(new URL(url).hostname))throw Error("Local fictional fixtures only.");
const status=JSON.parse(execFileSync(process.execPath,["node_modules/supabase/dist/supabase.js","status","-o","json"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}));
if(status.API_URL!==url || status.SERVICE_ROLE_KEY!==process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error("Local server configuration mismatch.");
const make=key=>createClient(url,key??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const admin=make(),teacher=make(),createdTeacher=make(),service=make(status.SERVICE_ROLE_KEY),anon=make();
const ok=r=>{assert.equal(r.error,null,r.error?.message);return r.data;};
const userIds=[],classIds=[],stamp=randomUUID().slice(0,8),year=2195;
const before=ok(await service.from("reporting_periods").select("id").eq("year",year)).map(p=>p.id);
const email=`setup-${stamp}@riverbay.com`,failedEmail=`setup-fail-${stamp}@riverbay.com`;
try {
 const {password}=JSON.parse(await readFile(".demo-access.txt","utf8"));
 ok(await admin.auth.signInWithPassword({email:"admin@riverbay.com",password}));
 ok(await teacher.auth.signInWithPassword({email:"teacher@riverbay.com",password}));
 const input={name:"Provisioning Verification Teacher",email,year,class_ids:[]};
 assert.equal((await provisionTeacher(anon,input)).ok,false);
 assert.equal((await provisionTeacher(teacher,input)).ok,false);
 assert.equal((await provisionTeacher(admin,{...input,email:"invalid"})).ok,false);
 assert.equal((await provisionTeacher(admin,{...input,class_ids:[randomUUID()]})).ok,false);
 for(let i=0;i<2;i++)classIds.push(ok(await admin.rpc("manage_class",{command:"create_class",payload:{year,level:"K1",name:`Setup ${stamp} ${i}`}})).id);
 const result=await provisionTeacher(admin,{...input,email:`  ${email.toUpperCase()}  `,class_ids:classIds});
 assert.equal(result.ok,true,result.message);userIds.push(result.id);
 assert.equal(result.email,email);assert.equal(result.initialPassword,"teach2LEARN");
 const profile=ok(await admin.from("profiles").select("id,display_name,role,is_active,email,staff_code").eq("id",result.id).single());
 assert.match(profile.staff_code,/^RB-T[0-9]{6,}$/);
 assert.equal(profile.role,"teacher");assert.equal(profile.is_active,true);assert.equal(profile.email,email);
 assert.equal(ok(await admin.from("class_teachers").select("class_id").eq("teacher_id",result.id)).length,2);
 ok(await createdTeacher.auth.signInWithPassword({email,password:result.initialPassword}));
 assert.equal(ok(await createdTeacher.from("classes").select("id").in("id",classIds)).length,2,"Initial sign-in and optional class access work");
 const duplicate=await provisionTeacher(admin,{...input,class_ids:classIds});
 assert.equal(duplicate.ok,false);assert.match(duplicate.message,/already/);
 assert.ok((await teacher.rpc("finish_teacher_setup",{teacher_id:result.id,teacher_name:"Forged",teacher_email:email,yr:year,class_ids:[]})).error);
 assert.ok((await admin.rpc("finish_teacher_setup",{teacher_id:result.id,teacher_name:"Overwrite",teacher_email:email,yr:year,class_ids:[]})).error);
 const brokenDb={auth:admin.auth,from:(...args)=>admin.from(...args),rpc:async()=>({error:{message:"Injected profile transaction failure"}})};
 assert.equal((await provisionTeacher(brokenDb,{...input,email:failedEmail})).ok,false);
 const users=ok(await service.auth.admin.listUsers({perPage:1000})).users;
 assert.ok(!users.some(u=>u.email===failedEmail),"Failed profile setup removes only its new auth account");
 const noClass=await provisionTeacher(admin,{...input,email:`setup-empty-${stamp}@riverbay.com`});
 assert.equal(noClass.ok,true,noClass.message);userIds.push(noClass.id);
 assert.equal(ok(await admin.from("class_teachers").select("class_id").eq("teacher_id",noClass.id)).length,0);
 const secondProfile=ok(await admin.from("profiles").select("staff_code").eq("id",noClass.id).single());
 assert.notEqual(secondProfile.staff_code,profile.staff_code,"New staff IDs are unique and automatic");
 console.log("PASS: admin-only provisioning, validation, email normalisation, real initial sign-in, optional multi-class access, duplicate email handling, protected profile RPC and failed-setup compensation. Passwords were not logged.");
} finally {
 for(const id of userIds){ok(await service.from("class_teachers").delete().eq("teacher_id",id));ok(await service.from("profiles").delete().eq("id",id));ok(await service.auth.admin.deleteUser(id));}
 if(classIds.length)ok(await service.from("classes").delete().in("id",classIds));
 const added=ok(await service.from("reporting_periods").select("id").eq("year",year)).filter(p=>!before.includes(p.id));
 if(added.length)ok(await service.from("reporting_periods").delete().in("id",added.map(p=>p.id)));
 for(const db of [admin,teacher,createdTeacher])await db.auth.signOut({scope:"local"});
}
