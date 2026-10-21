"""Sequential local inference with sampled device-wide VRAM; no portfolio writes."""
import datetime, hashlib, json, subprocess, threading, time, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
MODEL='riverbay-qwen35-9b:latest'
def call(endpoint,body=None):
    data=None if body is None else json.dumps(body,ensure_ascii=False).encode()
    with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:11434'+endpoint,data=data,headers={'Content-Type':'application/json'}),timeout=180) as r:return json.load(r)
def sample():
    r=subprocess.run(['nvidia-smi','--query-gpu=index,memory.used,memory.total,utilization.gpu','--format=csv,noheader,nounits'],capture_output=True,text=True,timeout=5)
    if r.returncode:raise RuntimeError('GPU sampling failed')
    return [list(map(int,line.split(','))) for line in r.stdout.strip().splitlines()]
prompt=(ROOT/'prompt.txt').read_text(encoding='utf8')
cases=json.loads((ROOT/'cases.json').read_text(encoding='utf8'))
out=ROOT/'qwen.jsonl'
if out.exists():raise RuntimeError('Do not overwrite a completed run')
schema={'type':'object','properties':{'narrative':{'type':'string'},'clarification':{'type':'string'}},'required':['narrative','clarification'],'additionalProperties':False}
meta={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'model':MODEL,'tags':call('/api/tags'),'runtime':call('/api/version'),'show':call('/api/show',{'model':MODEL}),'prompt_sha256':hashlib.sha256(prompt.encode()).hexdigest(),'cases_sha256':hashlib.sha256((ROOT/'cases.json').read_bytes()).hexdigest(),'settings':{'think':False,'temperature':0.2,'num_ctx':8192,'num_predict':2048,'seeds':[11,29,47]},'memory_scope':'Device-wide sampled at approximately 200ms plus nvidia-smi overhead; includes other GPU processes; peak is a sampled lower bound, not exact per-process model allocation'}
(ROOT/'qwen-metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
# Deliberately unload this model so the first attempt includes model loading.
call('/api/generate',{'model':MODEL,'keep_alive':0})
for attempt,seed in enumerate([11,29,47],1):
  for case in cases:
    samples=[];errors=[];stop=threading.Event()
    baseline=sample()
    def monitor():
      while not stop.is_set():
        try:samples.append({'elapsed_s':round(time.perf_counter()-start,3),'gpus':sample()})
        except Exception:errors.append('sampling_failed')
        stop.wait(.2)
    start=time.perf_counter();thread=threading.Thread(target=monitor);thread.start()
    result={'case_id':case['id'],'attempt':attempt,'seed':seed,'cold_start_requested':attempt==1 and case==cases[0],'baseline':baseline}
    try:
      raw=call('/api/chat',{'model':MODEL,'stream':False,'think':False,'keep_alive':'10m','format':schema,'options':meta['settings']|{'seed':seed},'messages':[{'role':'system','content':prompt},{'role':'user','content':json.dumps(case['input'],ensure_ascii=False)}]})
      result['raw']=raw
      parsed=json.loads(raw['message']['content'])
      result['output']=parsed
      result['valid']=set(parsed)=={'narrative','clarification'} and all(isinstance(v,str) for v in parsed.values()) and bool(parsed['narrative'].strip())!=bool(parsed['clarification'].strip()) and raw.get('done_reason')=='stop'
    except Exception as e:result['error']=type(e).__name__;result['valid']=False
    result['wall_seconds']=round(time.perf_counter()-start,3)
    stop.set();thread.join();result['gpu_samples']=samples;result['sampling_errors']=errors
    result['peak_device_vram_mib']=max([s['gpus'][0][1] for s in samples]+[baseline[0][1]])
    result['increase_over_baseline_mib']=result['peak_device_vram_mib']-baseline[0][1]
    with out.open('a',encoding='utf8') as f:f.write(json.dumps(result,ensure_ascii=False)+'\n')
    print(case['id'],attempt,result['wall_seconds'],result['valid'],result['peak_device_vram_mib'],flush=True)
