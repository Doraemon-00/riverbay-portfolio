/* eslint-disable @typescript-eslint/no-require-imports */
// Same model/configuration as app, frozen revised prompt. No retries or fallback.
const fs=require('node:fs');const path=require('node:path');
const root=__dirname,output=path.join(root,'gemini.jsonl');
if(fs.existsSync(output))throw Error('Do not overwrite a completed run');
if(!process.env.GEMINI_API_KEY)throw Error('Gemini key missing');
const model=process.env.GEMINI_MODEL||'gemini-3.1-flash-lite';
const schema={type:'object',properties:{narrative:{type:'string'},clarification:{type:'string'}},required:['narrative','clarification'],additionalProperties:false};
const prompt=fs.readFileSync(path.join(root,'prompt.txt'),'utf8');
const cases=JSON.parse(fs.readFileSync(path.join(root,'cases.json'),'utf8'));
(async()=>{
  for(let attempt=1;attempt<=3;attempt++)for(const c of cases){
    const start=performance.now(),row={case_id:c.id,attempt,model};
    let halt=false;
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({systemInstruction:{parts:[{text:prompt}]},contents:[{role:'user',parts:[{text:JSON.stringify(c.input)}]}],generationConfig:{maxOutputTokens:4096,thinkingConfig:{thinkingLevel:'low'},responseFormat:{text:{mimeType:'APPLICATION_JSON',schema}}}})});
      row.http_status=r.status;
      if(!r.ok){row.error=r.status===429?'quota_or_rate_limit':'provider_unavailable';halt=true;}
      else {
        const raw=await r.json();row.raw=raw;
        const candidate=raw.candidates?.[0];
        const text=candidate?.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
        row.output=JSON.parse(text);
        row.valid=candidate.finishReason==='STOP'&&Object.keys(row.output).sort().join(',')==='clarification,narrative'&&Object.values(row.output).every(v=>typeof v==='string')&&Boolean(row.output.narrative.trim())!==Boolean(row.output.clarification.trim());
      }
    }catch(e){row.error=e.name==='TimeoutError'?'timeout':'request_or_parse_failure';halt=true;}
    row.wall_seconds=Number(((performance.now()-start)/1000).toFixed(3));
    fs.appendFileSync(output,JSON.stringify(row)+'\n');
    console.log(`${c.id} attempt=${attempt} ${row.wall_seconds}s ${row.error||row.valid}`);
    if(halt){console.log('Stopped Gemini on first unavailable/limited request; no retries.');return;}
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
})().catch(()=>{console.error('Harness failed');process.exitCode=1;});
