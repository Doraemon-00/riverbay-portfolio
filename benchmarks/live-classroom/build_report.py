"""Build a portable comparison from all retained attempts, never select best drafts."""
import hashlib, html, json, re, statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def lines(name):return [json.loads(x) for x in (ROOT/name).read_text(encoding='utf8').splitlines() if x.strip()]
cases=json.loads((ROOT/'cases.json').read_text(encoding='utf8'))
qwen=lines('qwen.jsonl');gemini=lines('gemini.jsonl')
gpt=sum([json.loads((ROOT/f'gpt-attempt-{i}.json').read_text(encoding='utf8')) for i in range(1,4)],[])
assert len(cases)==4 and len(qwen)==12 and len(gpt)==12
for rows in [qwen,gpt]:
  assert len({(r['case_id'],r['attempt']) for r in rows})==12
for r in qwen+gpt+gemini:
  if 'output' in r:
    assert set(r['output'])=={'narrative','clarification'}
    assert all(isinstance(v,str) for v in r['output'].values())
    assert bool(r['output']['narrative'].strip())!=bool(r['output']['clarification'].strip())
warm=[r['wall_seconds'] for r in qwen if not r['cold_start_requested']]
summary={'cases':4,'planned_attempts':36,'qwen_completed':12,'gpt_completed':12,'gemini_completed':sum(bool(r.get('valid')) for r in gemini),'gemini_failed':sum(bool(r.get('error')) for r in gemini),'gemini_unattempted':12-len({(r['case_id'],r['attempt']) for r in gemini}),'gemini_seconds':{'median':statistics.median([r['wall_seconds'] for r in gemini if r.get('valid')]),'minimum':min(r['wall_seconds'] for r in gemini if r.get('valid')),'maximum':max(r['wall_seconds'] for r in gemini if r.get('valid'))},'gemini_first_run':'gemini-2026-10-20.jsonl: English completed, then HTTP 503; run stopped','qwen_warm_seconds':{'median':statistics.median(warm),'minimum':min(warm),'maximum':max(warm)},'qwen_first_request_seconds':qwen[0]['wall_seconds'],'qwen_model_load_seconds':qwen[0]['raw']['load_duration']/1e9,'qwen_peak_device_vram_mib':max(r['peak_device_vram_mib'] for r in qwen),'qwen_first_baseline_mib':qwen[0]['baseline'][0][1],'qwen_peak_gib':round(max(r['peak_device_vram_mib'] for r in qwen)/1024,3),'prompt_sha256':hashlib.sha256((ROOT/'prompt.txt').read_bytes()).hexdigest(),'cases_sha256':hashlib.sha256((ROOT/'cases.json').read_bytes()).hexdigest()}
(ROOT/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
e=lambda x:html.escape(str(x))
providers={'Qwen':qwen,'GPT':gpt,'Gemini':gemini}
sections=[]
for c in cases:
  notes=''.join(f'<li><small>{e(o["observed_on"] or "Undated")}</small> {e(o["text"])}</li>' for o in c['input']['observations'])
  attempts=[]
  # Rotate stable card order by domain; labels remain anonymous until reveal.
  order=list(providers);shift=int(hashlib.sha256(c['id'].encode()).hexdigest()[:2],16)%3;order=order[shift:]+order[:shift]
  for attempt in range(1,4):
    cards=[]
    for index,name in enumerate(order):
      r=next((r for r in sorted(providers[name],key=lambda row:not row.get('valid')) if r['case_id']==c['id'] and r['attempt']==attempt),None)
      narrative=r.get('output',{}).get('narrative','') if r else ''
      status=(f'Request failed (HTTP {r.get("http_status", "unknown")}). No draft returned.' if r.get('error') else 'No narrative returned') if r else 'Not attempted — Gemini run stopped after HTTP 503; not a model quality failure.'
      text=narrative or (r or {}).get('output',{}).get('clarification') or status
      if name=='Qwen' and r:
        raw=r['raw'];telemetry=f'{r["wall_seconds"]} s · peak {r["peak_device_vram_mib"]} MiB (device) · input {raw.get("prompt_eval_count")} / output {raw.get("eval_count")} tokens'
      elif name=='Gemini' and r:
        usage=r.get('raw',{}).get('usageMetadata',{});telemetry=f'{r["wall_seconds"]} s · HTTP {r.get("http_status")} · input {usage.get("promptTokenCount","—")} / output {usage.get("candidatesTokenCount","—")} / thinking {usage.get("thoughtsTokenCount","—")} tokens'
      else:telemetry='Writing reference via fresh Codex agent; per-case time, tokens, GPU and exact snapshot unavailable.'
      length=(len(re.findall(r'[\u3400-\u9fff]',narrative)),'Chinese characters') if c['id']=='chinese' else (len(narrative.split()),'words')
      cards.append(f'<article><h3>Draft {chr(65+index)} <span class="identity">· {name}</span></h3><p class="story">{e(text)}</p><small>{length[0]} {length[1]}</small><div class="identity metrics">{e(telemetry)}</div></article>')
    attempts.append(f'<details {"open" if attempt==1 else ""}><summary>Attempt {attempt}</summary><div class="grid">{"".join(cards)}</div></details>')
  sections.append(f'<section id="{c["id"]}"><h2>{e(c["input"]["domain"])}</h2><p>Indicator: {e(c["input"]["indicator"])} · {len(c["input"]["observations"])} observations · Semester 2 only</p><details><summary>Read original observations</summary><ol>{notes}</ol></details>{"".join(attempts)}</section>')
historical=json.loads((ROOT/'historical-reference.json').read_text(encoding='utf8'))
old=''.join(f'<h3>{e(r["domain"])}</h3><p>{e(r["narrative"])}</p>' for r in historical['rows'])
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Riverbay · Classroom drafting comparison</title><style>
*{box-sizing:border-box}body{margin:0;background:#faf7ef;color:#29382f;font:16px/1.65 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1,h2,h3{line-height:1.25}header{max-width:950px}button,a{color:#315f50}button{padding:12px 18px;border:1px solid #46695a;border-radius:10px;background:#e3eee5;font:inherit;cursor:pointer}button:hover{background:#c9dfcf}a{margin-right:18px}section{border-top:1px solid #cdd4c9;padding:28px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:20px 0}article{border:1px solid #d5d9cc;border-radius:16px;background:#fffef9;padding:22px;min-width:0}article h3{margin-top:0}.story{white-space:pre-wrap;overflow-wrap:anywhere}small,.metrics{color:#58665c}li{margin:12px 0}summary{cursor:pointer;padding:12px 0;font-weight:600}.metrics{border-top:1px solid #ddd;padding-top:12px;font-size:13px}.identity{display:none}.revealed .identity{display:block}h3 .identity{font-size:14px}aside{padding:18px;border-radius:12px;background:#e3eee5}nav{padding:20px 0}.note{font-size:14px}@media(max-width:850px){.grid{grid-template-columns:1fr}main{padding:20px}h1{font-size:28px}}</style><main><header><p>RIVERBAY · MILESTONE B · FICTIONAL DATA</p><h1>What does each draft actually say?</h1><p>The same four current portfolio inputs and frozen revised prompt. Read the sources first, compare the anonymous drafts, then reveal models and measurements. All attempts are retained.</p><aside>All three writers completed all 12 drafts. Gemini's first run on 20 October stopped at an HTTP 503 after one draft; the rerun on 24 October completed, resuming twice after 45-second timeouts. This is one fictional child, not teacher validation or a production-readiness verdict.</aside><p><button id="reveal" aria-pressed="false">Reveal models & measurements</button></p><p class="note">Same prompt and evidence; different execution settings. GPT uses three fresh four-case agent batches, not comparable API timing. Qwen memory is sampled total device usage, not exact model-only allocation. Card ordering is rotated, not a formal blinded trial.</p></header><nav>'''+''.join(f'<a href="#{c["id"]}">{e(c["input"]["domain"])}</a>' for c in cases)+ '</nav>'+''.join(sections)+f'<section><h2>Earlier saved drafts</h2><details><summary>Historical reference only — original generation inputs and edits not established</summary>{old}</details><p><a href="RESULTS.md">Read findings and limitations</a><a href="summary.json">Measurements</a><a href="prompt.txt">Frozen prompt</a></p></section></main><script>document.querySelector("#reveal").onclick=function(){{const shown=document.body.classList.toggle("revealed");this.setAttribute("aria-pressed",String(shown));this.textContent=shown?"Hide models & measurements":"Reveal models & measurements";}};</script></html>'
(ROOT/'COMPARISON.html').write_text(page,encoding='utf8')
print(json.dumps(summary,indent=2))
