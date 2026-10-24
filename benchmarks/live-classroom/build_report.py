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
  # A fixed order per domain, rotated each attempt: within a domain every model sits in every slot once,
  # so a habit of picking one position cannot favour one model. Labels stay hidden until Reveal.
  base=list(itertools.permutations(providers))[int(hashlib.sha256(c['id'].encode()).hexdigest()[:2],16)%6]
  attempts=[]
  for attempt in range(1,4):
    order=base[attempt-1:]+base[:attempt-1]
    cards=[]
    for index,name in enumerate(order):
      r=next((r for r in sorted(providers[name],key=lambda row:not row.get('valid')) if r['case_id']==c['id'] and r['attempt']==attempt),None)
      narrative=r.get('output',{}).get('narrative','') if r else ''
      status=(f'Request failed (HTTP {r.get("http_status", "unknown")}). No draft returned.' if r.get('error') else 'No narrative returned') if r else 'Not attempted.'
      text=narrative or (r or {}).get('output',{}).get('clarification') or status
      if name=='Qwen' and r:
        raw=r['raw'];telemetry=f'{r["wall_seconds"]} s · peak {r["peak_device_vram_mib"]} MiB (device) · input {raw.get("prompt_eval_count")} / output {raw.get("eval_count")} tokens'
      elif name=='Gemini' and r:
        usage=r.get('raw',{}).get('usageMetadata',{});telemetry=f'{r["wall_seconds"]} s · HTTP {r.get("http_status")} · input {usage.get("promptTokenCount","-")} / output {usage.get("candidatesTokenCount","-")} / thinking {usage.get("thoughtsTokenCount","-")} tokens'
      else:telemetry='Writing reference via fresh Codex agent; per-case time, tokens, GPU and exact snapshot unavailable.'
      length=(len(re.findall(r'[㐀-鿿]',narrative)),'Chinese characters') if c['id']=='chinese' else (len(narrative.split()),'words')
      letter=chr(65+index)
      cards.append(f'<article class="draft" data-choice="{letter}" data-model="{name}" role="button" tabindex="0" aria-pressed="false" aria-label="Draft {letter}">'
                   f'<div class="card-head"><h3>Draft {letter}</h3><span class="tags"><span class="tag model identity">{name}</span><span class="tag pick-tag">✓ Your pick</span></span></div>'
                   f'<p class="story">{e(text)}</p><small>{length[0]} {length[1]}</small><div class="identity metrics">{e(telemetry)}</div></article>')
    attempts.append(f'<details open class="round"><summary>Attempt {attempt}<span class="done">✓ picked</span></summary>'
                    f'<div class="grid pick" data-round="{c["id"]}:{attempt}" data-domain="{e(c["input"]["domain"])}" data-attempt="{attempt}">{"".join(cards)}</div></details>')
  sections.append(f'<section id="{c["id"]}"><h2>{e(c["input"]["domain"])}</h2><p>Indicator: {e(c["input"]["indicator"])} · {len(c["input"]["observations"])} observations · Semester 2 only</p><details><summary>Read original observations</summary><ol>{notes}</ol></details>{"".join(attempts)}</section>')
historical=json.loads((ROOT/'historical-reference.json').read_text(encoding='utf8'))
old=''.join(f'<h3>{e(r["domain"])}</h3><p>{e(r["narrative"])}</p>' for r in historical['rows'])

STYLE='''*{box-sizing:border-box}body{margin:0;background:#faf7ef;color:#29382f;font:16px/1.65 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px 32px 110px}
h1,h2,h3{line-height:1.25}header{max-width:950px}a{color:#315f50;margin-right:18px}
button{padding:10px 16px;border:1px solid #c5cfc6;border-radius:10px;background:#fffef9;color:#315f50;font:inherit;font-weight:600;cursor:pointer;transition:background-color .15s,border-color .15s}button:hover,button:focus-visible{background:#e3eee5;border-color:#46695a}button:focus-visible{outline:3px solid #315f50;outline-offset:2px}button.quiet{background:transparent;border-color:transparent;font-weight:400;text-decoration:underline}button.quiet:hover{background:#e3eee5;border-color:transparent}
section{border-top:1px solid #cdd4c9;padding:28px 0}summary{cursor:pointer;padding:10px 0;font-weight:600}small,.metrics,.note{color:#58665c}.note{font-size:14px}li{margin:12px 0}
aside{padding:16px 18px;border-radius:12px;background:#e3eee5;margin:16px 0}.lead{font-size:17px}.about{font-size:14px;color:#58665c;max-width:950px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:8px 0 18px}
.draft{position:relative;border:1px solid #d5d9cc;border-radius:16px;background:#fffef9;padding:20px 22px;min-width:0;cursor:pointer;transition:border-color .15s,background-color .15s,box-shadow .15s}
.draft:hover{border-color:#9db3a4;box-shadow:0 4px 14px #2b36310f}.draft:focus-visible{outline:3px solid #315f50;outline-offset:2px}
.draft[aria-pressed="true"]{border:2px solid #315f50;background:#eef6ef;padding:19px 21px}
.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.card-head h3{margin:0 0 8px}
.tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}.tag{display:none;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.tag.model{background:#efeae0;color:#4d5a51}.revealed .tag.model{display:inline-block}
.tag.pick-tag{background:#315f50;color:#fff}.draft[aria-pressed="true"] .pick-tag{display:inline-block}
.story{white-space:pre-wrap;overflow-wrap:anywhere}.metrics{display:none;border-top:1px solid #ddd;padding-top:10px;margin-top:8px;font-size:13px}.revealed .metrics{display:block}
.round summary .done{display:none;margin-left:10px;color:#315f50;font-size:14px}.round.picked summary .done{display:inline}
.pickbar{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;justify-content:center;padding:10px 16px;background:#fffef9;border-top:1px solid #cdd4c9;box-shadow:0 -6px 18px #2b363114}
.pickbar[hidden]{display:none}.pickbar-inner{display:flex;flex-wrap:wrap;align-items:center;gap:12px;max-width:1500px;width:100%}.pickbar-inner strong{margin-right:auto}
#results{border-top:0}#results table{border-collapse:collapse;margin:10px 0 18px}#results th,#results td{padding:6px 14px 6px 0;border-bottom:1px solid #d5d9cc;text-align:left;vertical-align:top}.ranking{font-size:20px;font-weight:700;margin:6px 0}
@media(max-width:850px){.grid{grid-template-columns:1fr}main{padding:20px 20px 130px}h1{font-size:28px}.pickbar-inner strong{flex-basis:100%}}'''

PICK_SCRIPT=r"""<script>(function(){
var KEY='riverbay-classroom-picks-v2',MODELS=['Qwen','GPT','Gemini'];
var picks={},peeked=false;
try{picks=JSON.parse(localStorage.getItem(KEY)||'{}')||{};peeked=localStorage.getItem(KEY+':peeked')==='1';}catch(e){}
var rounds=[].slice.call(document.querySelectorAll('.pick')),total=rounds.length,bar=document.querySelector('.pickbar'),results=document.querySelector('#results'),body=document.querySelector('#results-body');
function save(){try{localStorage.setItem(KEY,JSON.stringify(picks));localStorage.setItem(KEY+':peeked',peeked?'1':'0');}catch(e){}}
function answered(){return Object.keys(picks).length;}
function paint(){
  rounds.forEach(function(r){var v=picks[r.dataset.round];r.querySelectorAll('.draft').forEach(function(card){card.setAttribute('aria-pressed',String(card.dataset.choice===v));});r.closest('.round').classList.toggle('picked',!!v);});
  document.querySelector('[data-pick-progress]').textContent=answered()+' of '+total+' picked';
  bar.hidden=answered()===0&&results.hidden;
}
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function render(){
  var wins={},byDomain={},rows=[],text=[];
  MODELS.forEach(function(m){wins[m]=0;});
  rounds.forEach(function(r){
    var v=picks[r.dataset.round],d=r.dataset.domain,label=d+' · attempt '+r.dataset.attempt,pick='No pick';
    if(!byDomain[d]){byDomain[d]={};MODELS.forEach(function(m){byDomain[d][m]=0;});}
    if(v){var m=r.querySelector('.draft[data-choice="'+v+'"]').dataset.model;wins[m]++;byDomain[d][m]++;pick='Draft '+v+' · '+m;}
    rows.push([label,pick]);
  });
  var sorted=MODELS.slice().sort(function(a,b){return wins[b]-wins[a];}),place=0,last=null,names=['1st','2nd','3rd'];
  var ranking=sorted.map(function(m,i){if(wins[m]!==last){place=i;last=wins[m];}return names[place]+' '+m+' ('+wins[m]+(wins[m]===1?' pick':' picks')+')';});
  var domains=Object.keys(byDomain).map(function(d){var c=byDomain[d],top=Math.max.apply(null,MODELS.map(function(m){return c[m];}));
    var leaders=MODELS.filter(function(m){return c[m]===top;}),lead=top===0?'No picks':leaders.length===MODELS.length?'Tie: all three':leaders.join(' and ');
    return [d,lead,MODELS.map(function(m){return m+' '+c[m];}).join(' · ')];});
  var notes=[];
  if(answered()<total)notes.push((total-answered())+' of '+total+' rounds have no pick and are not counted.');
  if(peeked)notes.push('Models were revealed before all picks were made, so these picks were not fully blind.');
  notes.push('A preference shows which writing you like, not which draft is accurate. For accuracy, see the review in RESULTS.md.');
  body.innerHTML='<p class="ranking">'+esc(ranking.join(' · '))+'</p>'
    +notes.map(function(n){return '<p class="note">'+esc(n)+'</p>';}).join('')
    +'<h3>By domain</h3><table><tr><th>Domain</th><th>Most picked</th><th>Picks</th></tr>'+domains.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';}).join('')+'</table>'
    +'<h3>Your picks</h3><table><tr><th>Round</th><th>Your pick</th></tr>'+rows.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>';}).join('')+'</table>'
    +'<p><button type="button" data-copy-results>Copy results</button> <span class="note" data-copy-status></span></p>';
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
  results.hidden=false;paint();results.scrollIntoView({behavior:'smooth',block:'start'});
}
function choose(card){var r=card.closest('.pick'),k=r.dataset.round;
  if(picks[k]===card.dataset.choice)delete picks[k];else picks[k]=card.dataset.choice;save();paint();if(!results.hidden)render();}
rounds.forEach(function(r){
  r.addEventListener('click',function(ev){var card=ev.target.closest('.draft');if(card&&!window.getSelection().toString())choose(card);});
  r.addEventListener('keydown',function(ev){var card=ev.target.closest('.draft');if(card&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();choose(card);}});
});
document.querySelector('#reveal').addEventListener('click',function(){var shown=document.body.classList.toggle('revealed');this.setAttribute('aria-pressed',String(shown));this.textContent=shown?'Hide models':'Reveal models';
  if(shown&&answered()<total&&results.hidden){peeked=true;save();}});
document.querySelector('[data-show-results]').onclick=render;
document.querySelector('[data-reset-picks]').onclick=function(){picks={};peeked=false;save();results.hidden=true;paint();};
paint();
})();</script>"""

page=('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1">'
  '<title>Riverbay · Classroom drafting comparison</title><style>'+STYLE+'</style><main><header>'
  '<p>RIVERBAY · MILESTONE B · FICTIONAL DATA</p><h1>What does each draft actually say?</h1>'
  '<p class="lead">Three AI writers drafted the same four portfolio domains from the same notes and prompt. Read the sources, compare the drafts, then reveal which model wrote each.</p>'
  '<aside>All three writers completed all 12 drafts. Gemini\'s first run on 20 October stopped at an HTTP 503 after one draft; the rerun on 24 October completed, resuming twice after 45-second timeouts. This is one fictional child, not teacher validation or a production-readiness verdict.</aside>'
  '<p><strong>Optional:</strong> click the draft you prefer in each round, then Show results to see which model you picked most. <button type="button" id="reveal" aria-pressed="false">Reveal models</button></p>'
  '<details class="about"><summary>About this comparison</summary><p>Same prompt and evidence; different execution settings. GPT uses three fresh four-case agent batches, not comparable API timing. Qwen memory is sampled total device usage, not exact model-only allocation. Draft order rotates each attempt so every model sits in every position once per domain; this is not a formal blinded trial. Picks stay in your browser; nothing is sent anywhere.</p></details>'
  '</header><section id="results" hidden aria-live="polite"><h2>Your results</h2><div id="results-body"></div></section>'
  '<nav>'+''.join(f'<a href="#{c["id"]}">{e(c["input"]["domain"])}</a>' for c in cases)+'</nav>'+''.join(sections)
  +f'<section><h2>Earlier saved drafts</h2><details><summary>Historical reference only: original generation inputs and edits not established</summary>{old}</details><p><a href="RESULTS.md">Read findings and limitations</a><a href="summary.json">Measurements</a><a href="prompt.txt">Frozen prompt</a></p></section></main>'
  '<div class="pickbar" hidden><div class="pickbar-inner"><strong data-pick-progress>0 of 12 picked</strong><button type="button" data-show-results>Show results</button><button type="button" class="quiet" data-reset-picks>Start again</button></div></div>'
  +PICK_SCRIPT+'</html>')
assert page.count('class="draft"')==36 and 'noindex' in page and '—' not in page
(ROOT/'COMPARISON.html').write_text(page,encoding='utf8')
