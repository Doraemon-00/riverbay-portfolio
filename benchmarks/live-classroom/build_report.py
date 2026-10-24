"""Build a portable comparison from all retained attempts, never select best drafts."""
import hashlib, html, itertools, json, re, statistics
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
  for attempt in range(1,4):
    # A fixed order per domain, rotated each attempt: within a domain every model sits in every slot once,
    # so a habit of picking one position cannot favour one model.
    base=list(itertools.permutations(providers))[int(hashlib.sha256(c['id'].encode()).hexdigest()[:2],16)%6]
    order=base[attempt-1:]+base[:attempt-1]
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
    choices=''.join(f'<button type="button" data-choice="{chr(65+i)}" data-model="{name}" aria-pressed="false">Prefer {chr(65+i)}</button>' for i,name in enumerate(order))
    pick=f'<div class="pick" data-round="{c["id"]}:{attempt}" data-domain="{e(c["input"]["domain"])}" data-attempt="{attempt}"><span>Your pick:</span>{choices}<button type="button" data-choice="none" aria-pressed="false">No preference</button></div>'
    attempts.append(f'<details {"open" if attempt==1 else ""}><summary>Attempt {attempt}</summary><div class="grid">{"".join(cards)}</div>{pick}</details>')
  sections.append(f'<section id="{c["id"]}"><h2>{e(c["input"]["domain"])}</h2><p>Indicator: {e(c["input"]["indicator"])} · {len(c["input"]["observations"])} observations · Semester 2 only</p><details><summary>Read original observations</summary><ol>{notes}</ol></details>{"".join(attempts)}</section>')
historical=json.loads((ROOT/'historical-reference.json').read_text(encoding='utf8'))
old=''.join(f'<h3>{e(r["domain"])}</h3><p>{e(r["narrative"])}</p>' for r in historical['rows'])
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Riverbay · Classroom drafting comparison</title><style>
*{box-sizing:border-box}body{margin:0;background:#faf7ef;color:#29382f;font:16px/1.65 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1,h2,h3{line-height:1.25}header{max-width:950px}button,a{color:#315f50}button{padding:12px 18px;border:1px solid #46695a;border-radius:10px;background:#e3eee5;font:inherit;cursor:pointer}button:hover{background:#c9dfcf}a{margin-right:18px}section{border-top:1px solid #cdd4c9;padding:28px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:20px 0}article{border:1px solid #d5d9cc;border-radius:16px;background:#fffef9;padding:22px;min-width:0}article h3{margin-top:0}.story{white-space:pre-wrap;overflow-wrap:anywhere}small,.metrics{color:#58665c}li{margin:12px 0}summary{cursor:pointer;padding:12px 0;font-weight:600}.metrics{border-top:1px solid #ddd;padding-top:12px;font-size:13px}.identity{display:none}.revealed .identity{display:block}h3 .identity{font-size:14px}aside{padding:18px;border-radius:12px;background:#e3eee5}nav{padding:20px 0}.note{font-size:14px}@media(max-width:850px){.grid{grid-template-columns:1fr}main{padding:20px}h1{font-size:28px}}</style><main><header><p>RIVERBAY · MILESTONE B · FICTIONAL DATA</p><h1>What does each draft actually say?</h1><p>The same four current portfolio inputs and frozen revised prompt. Read the sources first, compare the anonymous drafts, then reveal models and measurements. All attempts are retained.</p><aside>All three writers completed all 12 drafts. Gemini's first run on 20 October stopped at an HTTP 503 after one draft; the rerun on 24 October completed, resuming twice after 45-second timeouts. This is one fictional child, not teacher validation or a production-readiness verdict.</aside><p><button id="reveal" aria-pressed="false">Reveal models & measurements</button></p><p class="note">Same prompt and evidence; different execution settings. GPT uses three fresh four-case agent batches, not comparable API timing. Qwen memory is sampled total device usage, not exact model-only allocation. Card ordering is rotated, not a formal blinded trial.</p></header><nav>'''+''.join(f'<a href="#{c["id"]}">{e(c["input"]["domain"])}</a>' for c in cases)+ '</nav>'+''.join(sections)+f'<section><h2>Earlier saved drafts</h2><details><summary>Historical reference only — original generation inputs and edits not established</summary>{old}</details><p><a href="RESULTS.md">Read findings and limitations</a><a href="summary.json">Measurements</a><a href="prompt.txt">Frozen prompt</a></p></section></main><script>document.querySelector("#reveal").onclick=function(){{const shown=document.body.classList.toggle("revealed");this.setAttribute("aria-pressed",String(shown));this.textContent=shown?"Hide models & measurements":"Reveal models & measurements";}};</script></html>'
PICK_CSS='.play{margin:18px 0;padding:16px 18px;border:1px dashed #9db3a4;border-radius:12px;background:#fffef9}.play p{margin:0 0 10px}.play-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.play-actions span{color:#58665c;font-size:14px}button.quiet{background:transparent;border-color:transparent;text-decoration:underline}.pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 22px}.pick span{color:#58665c;font-size:14px;margin-right:4px}.pick button{padding:8px 14px}.pick button[aria-pressed="true"]{background:#315f50;border-color:#315f50;color:#fff}#results{border-top:0}#results table{border-collapse:collapse;margin:10px 0 18px}#results th,#results td{padding:6px 14px 6px 0;border-bottom:1px solid #d5d9cc;text-align:left;vertical-align:top}.ranking{font-size:20px;font-weight:700;margin:6px 0}'
PLAY='<div class="play"><p><strong>Optional: pick your favourites.</strong> Under each attempt, choose the draft you prefer, or No preference. When you are done, Show results tells you which model you picked most. You can also skip this and use Reveal models at any time.</p><div class="play-actions"><button type="button" data-show-results>Show results</button><span data-pick-progress>0 of 12 rounds answered</span><button type="button" class="quiet" data-reset-picks>Start again</button></div></div>'
RESULTS='<section id="results" hidden aria-live="polite"><h2>Your results</h2><div id="results-body"></div></section>'
PICK_SCRIPT=r"""<script>(function(){
var KEY='riverbay-classroom-picks-v1',MODELS=['Qwen','GPT','Gemini'];
var picks={},peeked=false;
try{picks=JSON.parse(localStorage.getItem(KEY)||'{}')||{};peeked=localStorage.getItem(KEY+':peeked')==='1';}catch(e){}
var rounds=[].slice.call(document.querySelectorAll('.pick')),total=rounds.length,results=document.querySelector('#results'),body=document.querySelector('#results-body');
function save(){try{localStorage.setItem(KEY,JSON.stringify(picks));localStorage.setItem(KEY+':peeked',peeked?'1':'0');}catch(e){}}
function answered(){return Object.keys(picks).length;}
function paint(){
  rounds.forEach(function(r){var v=picks[r.dataset.round];r.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.choice===v));});});
  document.querySelectorAll('[data-pick-progress]').forEach(function(p){p.textContent=answered()+' of '+total+' rounds answered';});
}
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function render(){
  var wins={},byDomain={},rows=[],text=[];
  MODELS.forEach(function(m){wins[m]=0;});
  rounds.forEach(function(r){
    var v=picks[r.dataset.round],d=r.dataset.domain,label=d+' · attempt '+r.dataset.attempt,pick;
    if(!byDomain[d]){byDomain[d]={};MODELS.forEach(function(m){byDomain[d][m]=0;});}
    if(!v)pick='Not answered';else if(v==='none')pick='No preference';
    else{var m=r.querySelector('button[data-choice="'+v+'"]').dataset.model;wins[m]++;byDomain[d][m]++;pick='Draft '+v+' · '+m;}
    rows.push([label,pick]);
  });
  var sorted=MODELS.slice().sort(function(a,b){return wins[b]-wins[a];}),place=0,last=null,names=['1st','2nd','3rd'];
  var ranking=sorted.map(function(m,i){if(wins[m]!==last){place=i;last=wins[m];}return names[place]+' '+m+' ('+wins[m]+(wins[m]===1?' pick':' picks')+')';});
  var domains=Object.keys(byDomain).map(function(d){var c=byDomain[d],top=Math.max.apply(null,MODELS.map(function(m){return c[m];}));
    var leaders=MODELS.filter(function(m){return c[m]===top;}),lead=top===0?'No picks':leaders.length===MODELS.length?'Tie: all three':leaders.join(' and ');
    return [d,lead,MODELS.map(function(m){return m+' '+c[m];}).join(' · ')];});
  var notes=[];
  if(answered()<total)notes.push((total-answered())+' of '+total+' rounds are not answered and do not count.');
  if(peeked)notes.push('Models were revealed before all picks were made, so these picks were not fully blind.');
  notes.push('A preference shows which writing you like, not which draft is accurate. For accuracy, see the review in RESULTS.md.');
  body.innerHTML='<p class="ranking">'+esc(ranking.join(' · '))+'</p>'
    +notes.map(function(n){return '<p class="note">'+esc(n)+'</p>';}).join('')
    +'<h3>By domain</h3><table><tr><th>Domain</th><th>Most picked</th><th>Picks</th></tr>'+domains.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';}).join('')+'</table>'
    +'<h3>Your picks</h3><table><tr><th>Round</th><th>Your pick</th></tr>'+rows.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>';}).join('')+'</table>'
    +'<div class="play-actions"><button type="button" data-copy-results>Copy results</button><span data-copy-status></span></div>';
  text.push('Riverbay drafting comparison: my picks');
  text.push('Ranking: '+ranking.join(', '));
  domains.forEach(function(r){text.push(r[0]+': '+r[1]+' ('+r[2]+')');});
  rows.forEach(function(r){text.push(r[0]+': '+r[1]);});
  notes.slice(0,-1).forEach(function(n){text.push(n);});
  body.querySelector('[data-copy-results]').onclick=function(){
    var status=body.querySelector('[data-copy-status]'),out=text.join('\n');
    (navigator.clipboard?navigator.clipboard.writeText(out):Promise.reject()).then(function(){status.textContent='Copied. Paste it into an email.';},function(){
      var area=document.createElement('textarea');area.value=out;area.rows=8;area.style.width='100%';body.appendChild(area);area.select();status.textContent='Select the text below and copy it.';});
  };
  results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'start'});
}
rounds.forEach(function(r){r.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var k=r.dataset.round;
  if(picks[k]===b.dataset.choice)delete picks[k];else picks[k]=b.dataset.choice;save();paint();if(!results.hidden)render();});});
document.querySelector('#reveal').addEventListener('click',function(){if(document.body.classList.contains('revealed')&&answered()<total&&results.hidden){peeked=true;save();}});
document.querySelectorAll('[data-show-results]').forEach(function(b){b.onclick=render;});
document.querySelectorAll('[data-reset-picks]').forEach(function(b){b.onclick=function(){picks={};peeked=false;save();paint();results.hidden=true;};});
paint();
})();</script>"""
page=page.replace('<meta name="viewport"','<meta name="robots" content="noindex,nofollow"><meta name="viewport"',1)
page=page.replace('</style>',PICK_CSS+'</style>',1)
page=page.replace('<p><button id="reveal"',PLAY+'<p><button id="reveal"',1)
page=page.replace('</header><nav>','</header>'+RESULTS+'<nav>',1)
page=page.replace('<section><h2>Earlier saved drafts</h2>','<section>'+PLAY+'</section><section><h2>Earlier saved drafts</h2>',1)
page=page.replace('</html>',PICK_SCRIPT+'</html>',1)
assert page.count('<button type="button" data-show-results>')==2 and 'noindex' in page and 'id="results"' in page
(ROOT/'COMPARISON.html').write_text(page,encoding='utf8')
print(json.dumps(summary,indent=2))
