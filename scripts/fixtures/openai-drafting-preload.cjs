// Isolated localhost UI/API verification only. Never load this in the demo server.
if (process.env.RIVERBAY_TEST_TRANSPORT !== "1" || process.env.OPENAI_API_KEY !== "local-transport-fixture") throw Error("Fixture transport requires the isolated test process.");
process.env.AI_PROVIDER = "openai";
const originalFetch = global.fetch;
global.fetch = async (url,options) => {
  if (String(url) !== "https://api.openai.com/v1/responses") return originalFetch(url,options);
  const body=JSON.parse(options.body), input=JSON.parse(body.input);
  await new Promise(resolve=>setTimeout(resolve,1400));
  if(input.observations.some(o=>o.text.includes("[TEST_FAIL]"))) return new Response("",{status:503});
  const chinese=input.target_language==="Simplified Chinese";
  const narrative=chinese ? "在图片和简短提示的帮助下，孩子尝试用短句分享自己的想法，并在小组中介绍自己的画。遇到不熟悉的词语时，孩子会向教师求助。" : "With picture prompts and a little time to begin, the child shared an idea during group time. The observations describe opportunities to name familiar characters and share a story with classmates.";
  return new Response(JSON.stringify({status:"completed",model:"fixture-only-not-a-live-model",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify({narrative,clarification:""})}]}]}),{headers:{"Content-Type":"application/json"}});
};
