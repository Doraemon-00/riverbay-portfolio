/* eslint-disable @typescript-eslint/no-require-imports */
// Read-only capture of fictional local demo data. Never changes portfolio records.
const fs=require('node:fs');
const ts=require('typescript');
const {createClient}=require('@supabase/supabase-js');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {buildModelInput}=require('../../src/lib/ai/narrative-provider.ts');
const root=__dirname;
(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Local fictional data only');
  if(fs.existsSync(root+'/cases.json'))throw Error('Frozen snapshot already exists');
  const db=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  const {password}=JSON.parse(fs.readFileSync('.demo-access.txt','utf8'));
  const check=r=>{if(r.error)throw Error(r.error.message);return r.data;};
  check(await db.auth.signInWithPassword({email:'teacher@riverbay.com',password}));
  try {
    const rows=check(await db.from('domain_entries').select('id,domain,rating,narrative,revision,observations').eq('portfolio_id','e42f47e9-cdb8-48ef-b86d-ad40a1fb1951').order('domain'));
    if(rows.length!==4)throw Error('Expected four domains');
    const cases=rows.map(row=>{
      const eligible=row.observations.filter(o=>!o.date||(o.date>='2026-07-01'&&o.date<='2026-12-31'));
      return {id:row.domain,input:{...buildModelInput(row.domain,{...row,observations:eligible}),evidence_scope:{semester:2,start:'2026-07-01',end:'2026-12-31',previous_semester_included:false}},excluded_notes:row.observations.length-eligible.length};
    });
    fs.writeFileSync(root+'/cases.json',JSON.stringify(cases,null,2));
    fs.writeFileSync(root+'/historical-reference.json',JSON.stringify({capturedAt:new Date().toISOString(),source:'Avery fictional Semester 2 persisted records; original generation inputs/model/prompt and subsequent edits are not established',rows},null,2));
    console.log(cases.map(c=>`${c.id}: ${c.input.observations.length} observations, ${c.excluded_notes} excluded`).join('\n'));
  } finally {await db.auth.signOut({scope:'local'});}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
