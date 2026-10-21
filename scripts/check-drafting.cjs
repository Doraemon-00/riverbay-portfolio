/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness registers a TypeScript loader before importing source. */
// Contract checks use an injected transport, never an API key or network call.
const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
require.extensions[".ts"] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { buildModelInput, generateNarrative } = require("../src/lib/ai/narrative-provider.ts");
const { draftRequestSchema } = require("../src/lib/drafting.ts");
const { randomUUID } = require("node:crypto");
const input = {entryId:randomUUID(),revision:3,rating:2,observations:[
  {id:randomUUID(),date:null,text:"Uses picture prompts."},
  {id:randomUUID(),date:"2026-09-12",text:"Shared a story."},
  {id:randomUUID(),date:"2026-07-02",text:"Named a character."},
]};
const key = process.env.OPENAI_API_KEY;
const originalProvider = process.env.AI_PROVIDER;
const geminiKey = process.env.GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
(async () => {
  process.env.AI_PROVIDER="openai";
  process.env.OPENAI_API_KEY="local-contract-test";
  assert.equal(draftRequestSchema.safeParse({...input,observations:[]}).success,false);
  assert.equal(draftRequestSchema.safeParse({...input,observations:[{...input.observations[0],date:"2026-02-30"}]}).success,false);
  const modelInput=buildModelInput("chinese",input);
  assert.equal(modelInput.target_language,"Simplified Chinese");
  assert.deepEqual(modelInput.observations.map(o=>o.observed_on),["2026-07-02","2026-09-12",null]);
  const serialized=JSON.stringify(modelInput);
  assert.ok(!serialized.includes(input.entryId) && !serialized.includes(input.observations[0].id));
  const response=(value,status="completed")=>new Response(JSON.stringify({status,model:"fixture-model",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(value)}]}]}));
  const result=await generateNarrative("english",input,async (url,options)=>{
    assert.equal(url,"https://api.openai.com/v1/responses");
    const body=JSON.parse(options.body);
    assert.equal(body.store,false);
    assert.equal(body.text.format.type,"json_schema");
    assert.equal(body.text.format.strict,true);
    assert.ok(!JSON.stringify(body).includes(input.entryId));
    return response({narrative:"With picture prompts, the child shared a story.",clarification:""});
  });
  assert.equal(result.model,"fixture-model"); assert.equal(result.inputRevision,3);
  assert.ok((await generateNarrative("english",input,async()=>response({narrative:"",clarification:"Please describe an observed activity."}))).clarification);
  for(const mock of [
    async()=>response({narrative:"",clarification:""}),
    async()=>response({narrative:"A draft",clarification:"Also a question"}),
    async()=>response({narrative:"A draft",clarification:""},"incomplete"),
    async()=>new Response(JSON.stringify({status:"completed",output:[{type:"message",content:[{type:"refusal",refusal:"No"}]}]})),
  ]) await assert.rejects(()=>generateNarrative("english",input,mock),e=>e.code==="invalid_output");
  await assert.rejects(()=>generateNarrative("english",input,async()=>new Response("",{status:429})),e=>e.code==="rate_limit");
  await assert.rejects(()=>generateNarrative("english",input,async()=>{throw new DOMException("Timed out","TimeoutError");}),e=>e.code==="timeout");
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(()=>generateNarrative("english",input,async()=>{throw Error("Must not call");}),e=>e.code==="configuration");
  for (const provider of ["gemini","groq"]) {
    process.env.AI_PROVIDER=provider;
    process.env.GEMINI_API_KEY="local-contract-test";
    process.env.GROQ_API_KEY="local-contract-test";
    const result=await generateNarrative("chinese",input,async (url,options)=>{
      assert.ok(!url.includes("local-contract-test"),"Keys must not appear in URLs");
      const body=JSON.parse(options.body);
      const sent=provider === "gemini" ? body.contents[0].parts[0].text : body.messages[1].content;
      assert.equal(JSON.parse(sent).target_language,"Simplified Chinese");
      assert.ok(!sent.includes(input.entryId));
      if(provider === "gemini") {
        assert.equal(options.headers["x-goog-api-key"],"local-contract-test");
        assert.equal(body.generationConfig.responseFormat.text.mimeType,"APPLICATION_JSON");
        assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,"low");
        return new Response(JSON.stringify({modelVersion:"fixture-gemini",candidates:[{finishReason:"STOP",content:{parts:[{thought:true,text:"not output"},{text:JSON.stringify({narrative:"孩子在提示下分享了故事。",clarification:""})}]}}]}));
      }
      assert.equal(url,"https://api.groq.com/openai/v1/chat/completions");
      assert.equal(body.response_format.json_schema.strict,true);
      return new Response(JSON.stringify({model:"fixture-groq",choices:[{finish_reason:"stop",message:{content:JSON.stringify({narrative:"孩子在提示下分享了故事。",clarification:""})}}]}));
    });
    assert.equal(result.provider,provider);
    assert.equal(result.narrative,"孩子在提示下分享了故事。");
    await assert.rejects(()=>generateNarrative("chinese",input,async()=>new Response(JSON.stringify(provider === "gemini" ? {candidates:[{finishReason:"MAX_TOKENS"}]} : {choices:[{finish_reason:"length"}]}))),e=>e.code==="invalid_output");
    await assert.rejects(()=>generateNarrative("chinese",input,async()=>new Response("",{status:429})),e=>e.code==="rate_limit");
  }
  process.env.AI_PROVIDER="invalid";
  await assert.rejects(()=>generateNarrative("english",input),e=>e.code==="configuration");
  console.log("PASS: draft validation, chronological/minimal payload, structured request, usable/clarification outputs, malformed/refused/incomplete outputs, rate limit, timeout and missing key.");
  console.log("PASS: Gemini and Groq payload/authentication/schema, common Chinese result contract, incomplete output rejection and rate limits. Injected transports only.");
})().finally(()=>{
  for(const [name,value] of [["OPENAI_API_KEY",key],["AI_PROVIDER",originalProvider],["GEMINI_API_KEY",geminiKey],["GROQ_API_KEY",groqKey]]) {if(value)process.env[name]=value;else delete process.env[name];}
}).catch(error=>{console.error(error.message);process.exitCode=1;});
