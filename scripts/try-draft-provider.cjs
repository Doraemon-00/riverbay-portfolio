/* eslint-disable @typescript-eslint/no-require-imports -- Small CommonJS harness loads the actual TypeScript adapter. */
// Two fictional smoke cases, not a benchmark. Explicit provider; no fallback.
const fs=require("node:fs");
const ts=require("typescript");
const {randomUUID}=require("node:crypto");
const path=require("node:path");
require.extensions[".ts"]=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {generateNarrative}=require("../src/lib/ai/narrative-provider.ts");
const provider=process.argv[2];
if(!["gemini","groq"].includes(provider))throw Error("Choose gemini or groq explicitly.");
process.env.AI_PROVIDER=provider;
if(!process.env[provider==="gemini"?"GEMINI_API_KEY":"GROQ_API_KEY"]){console.log(`Cannot run live ${provider}: its API key is not configured. No requests made.`);process.exit(0);}
const examples=[
  {domain:"english",notes:[["2026-07-14","Named familiar characters in a picture book."],["2026-08-25","Shared a short picnic story with picture prompts."],["2026-10-13","Retold the beginning and middle of a familiar story to a small group. Needed a teacher question to explain the ending."]]},
  {domain:"chinese",notes:[["2026-07-21","能说出自己的名字，回答其他问题时需要教师提示。"],["2026-09-03","能说出熟悉动物的名称，并在提示下用短句描述图片。"],["2026-10-15","用两三个短句介绍自己的画，遇到不熟悉的词语时会向教师求助。"]]},
];
(async()=>{
  const results=[];
  for(const example of examples){
    const start=Date.now();
    try{
      const result=await generateNarrative(example.domain,{entryId:randomUUID(),revision:0,rating:2,observations:example.notes.map(([date,text])=>({id:randomUUID(),date,text}))});
      results.push({domain:example.domain,notes:example.notes,...result,milliseconds:Date.now()-start});
      console.log(`${example.domain}: ${result.model}, ${Date.now()-start}ms, ${result.narrative ? "draft returned" : "clarification returned"}`);
    }catch(error){results.push({domain:example.domain,error:error.code||"unavailable",milliseconds:Date.now()-start});console.log(`${example.domain}: ${error.code||"unavailable"}`);break;}
  }
  const filename=path.join("docs","verification",`live-${provider}-smoke.json`);
  fs.writeFileSync(filename,JSON.stringify({provider,createdAt:new Date().toISOString(),scope:"Two fictional smoke cases, not benchmark or teacher acceptance",results},null,2));
  console.log(`Results saved to ${filename}`);
})().catch(()=>{console.error("Smoke test could not complete.");process.exitCode=1;});
