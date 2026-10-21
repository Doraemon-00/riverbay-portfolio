"""Render saved model drafts for human review. Does not call or rewrite models."""
import html
import argparse
import json
from pathlib import Path

from run import eligible

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("--folder", type=Path, default=root / "gpt-control" / "20261019T034416Z")
parser.add_argument("--dataset", type=Path)
parser.add_argument("--qwen-runs", nargs="+", default=["20261019T032904Z-qwen9b-guided-v2", "20261019T033257Z-qwen9b-weekly52-v2"])
parser.add_argument("--previous-folder", type=Path)
parser.add_argument("--label", default="v2 · concise factual")
parser.add_argument("--publish", type=Path)
args = parser.parse_args()
folder = args.folder
packet = json.loads((folder / "packet.json").read_text(encoding="utf8"))
key = json.loads((folder / "evaluation-key.json").read_text(encoding="utf8"))
item_ids = {case["id"]: item for item, case in key.items()}
cases = json.loads((args.dataset or root / "cases.json").read_text(encoding="utf8"))
if args.dataset is None:
    cases += json.loads((root / "long-cases.json").read_text(encoding="utf8"))
gpt = {}
for letter in "abc":
    gpt[letter] = {row["case_id"]: row["output"] for row in
                   (json.loads(line) for line in (folder / f"writer-{letter}.jsonl").read_text(encoding="utf8").splitlines())}
qwen = {}
for run in args.qwen_runs:
    for line in (root / "results" / run / "outputs.jsonl").read_text(encoding="utf8").splitlines():
        row = json.loads(line)
        qwen[row["case_id"], row["seed"]] = row["output"]

def cell(text):
    return text.replace("|", "\\|").replace("\n", "<br>")

md = ["# Actual narrative drafts for your review", "",
      "These are domain narrative drafts, not full portfolio PDFs. Every draft below is copied from saved first-attempt output without polishing. All observations are fictional.", "",
      "Compare each draft against the notes: are the current support needs, context, frequency and supported growth preserved? You can judge the wording before reading the separate evaluation reports.", "",
      f"Prompt: {args.label}. Both writers received the same guide and eligible facts. GPT used three fresh batch sessions; Qwen9B used individual local requests. A/B/C are repetitions, not equivalent random seeds. Exact GPT snapshot/settings and comparable inference timing are unavailable.", ""]
data = []
for index, case in enumerate(cases, 1):
    case_id = case["id"]
    md.append(f"- [{case_id}](#{case_id})")
    notes, excluded = eligible(case)
    pairs = []
    for letter, seed in zip("abc", [11, 29, 47]):
        pairs.append({"repetition": letter.upper(), "qwen_seed": seed,
                      "gpt": gpt[letter][item_ids[case_id]], "qwen": qwen[case_id, seed]})
    data.append({"id": case_id, "language": case["language"],
                 "start": case["period_start"], "end": case["period_end"],
                 "notes": notes, "excluded_notes": [n for n in case["notes"] if n["id"] in excluded],
                 "pairs": pairs})

for case in data:
    md += ["", f"## {case['id']}", "", f"Language: {case['language']} · Coverage: {case['start']} to {case['end']}", "",
           "### Original notes supplied to both writers", "", "| Observed | Entered | Note |", "|---|---|---|"]
    for note in case["notes"]:
        md.append(f"| {note.get('observed_at') or 'Undated'} | {note.get('recorded_at') or '—'} | {cell(note['text'])} |")
    if case["excluded_notes"]:
        md += ["", "Excluded by the coverage filter; neither writer received these:", ""]
        md += [f"- {n.get('observed_at', 'Undated')}: {n['text']}" for n in case["excluded_notes"]]
    for pair in case["pairs"]:
        md += ["", f"### Repetition {pair['repetition']}", "", "| GPT | Qwen9B |", "|---|---|"]
        md.append("| " + " | ".join(cell(pair[m]["narrative"]) if pair[m]["narrative"] else "*(Empty narrative returned)*" for m in ["gpt", "qwen"]) + " |")
        for model, label in [("gpt", "GPT"), ("qwen", "Qwen")]:
            if pair[model]["clarification"]:
                md += ["", f"**{label} clarification:** {pair[model]['clarification']}"]
    md += ["", "[Back to case list](#actual-narrative-drafts-for-your-review)", ""]
(folder / "DRAFT_COMPARISON.md").write_text("\n".join(md), encoding="utf8")

template = r'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Actual narrative drafts · GPT and Qwen</title>
<style>
*{box-sizing:border-box}body{font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif;color:#232927;background:#f4f5f2;margin:0}main{max-width:1180px;margin:auto;padding:32px 24px}h1{font-size:30px;line-height:1.2}h2{font-size:20px}h3{margin-top:0}p{max-width:88ch}.meta,small{color:#57635d}.controls{display:flex;gap:16px;flex-wrap:wrap;margin:24px 0}label{display:grid;gap:5px;font-weight:600}select,button{font:inherit;padding:9px 12px;border:1px solid #aab6ae;border-radius:8px;background:#fff;color:#232927}select{max-width:100%}button{cursor:pointer}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card,details{background:white;border:1px solid #d8dfd9;border-radius:12px;padding:24px;margin-bottom:16px}.draft{white-space:pre-wrap;font-size:18px}.empty{font-style:italic;color:#6b514c}.clarification{white-space:pre-wrap;border-top:1px solid #d8dfd9;padding-top:16px}.notes{padding-left:22px}.notes li{margin:12px 0}.notes small{display:block}summary{cursor:pointer;font-weight:600}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.hint{font-size:14px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:650px){main{padding:22px 14px}.grid{grid-template-columns:1fr}.card,details{padding:18px}h1{font-size:25px}.controls{display:grid}.draft{font-size:17px}}
</style>
<main><h1>Actual narrative drafts</h1>
<p>Original teacher notes and saved GPT/Qwen outputs, without polishing. These are <strong>domain narrative drafts</strong>; full portfolio PDFs have not been generated. All data is fictional.</p>
<p class="meta hint">Within each round, both writers received the same guide and filtered facts. GPT used fresh batch sessions; Qwen9B used local individual requests. Repetitions are not matched random seeds. This page shows no evaluation scores.</p>
<div class="controls"><label>Prompt version<select id="round"></select></label><label>Scenario<select id="scenario"></select></label><label>Repetition<select id="repetition"><option value="0">A · GPT writer A / Qwen seed 11</option><option value="1">B · GPT writer B / Qwen seed 29</option><option value="2">C · GPT writer C / Qwen seed 47</option></select></label><button id="previous">Previous scenario</button><button id="next">Next scenario</button></div>
<p id="meta" class="meta" aria-live="polite"></p>
<details open><summary>Original notes supplied to both writers</summary><ol class="notes" id="notes"></ol></details>
<details id="excludedPanel" hidden><summary>Notes excluded before either writer saw the input</summary><ol class="notes" id="excluded"></ol></details>
<div class="grid"><section class="card"><h2>GPT subagent</h2><div id="gptDraft" class="draft"></div><div id="gptClarification" class="clarification"></div></section><section class="card"><h2>Local Qwen3.5-9B</h2><div id="qwenDraft" class="draft"></div><div id="qwenClarification" class="clarification"></div></section></div>
<details><summary>Exact structured outputs</summary><div class="grid"><div><h3>GPT</h3><pre id="gptRaw"></pre></div><div><h3>Qwen</h3><pre id="qwenRaw"></pre></div></div></details>
<details><summary>Writing instructions shared by both writers</summary><pre id="guide"></pre></details>
<p class="hint meta">Check whether each draft preserves the actual support needs, context, frequency and growth. An empty result is displayed explicitly; clarification is shown separately. No model calls, tracking or external resources are used by this page.</p></main>
<script id="saved-data" type="application/json">__DATA__</script>
<script>
const saved=JSON.parse(document.getElementById('saved-data').textContent);let data=saved.rounds[0].cases;
const $=id=>document.getElementById(id);saved.rounds.forEach((r,i)=>{let o=document.createElement('option');o.value=i;o.textContent=r.label;$('round').append(o)});
function setRound(wanted){const round=saved.rounds[Number($('round').value)];data=round.cases;$('guide').textContent=round.guide;$('scenario').replaceChildren();data.forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${c.id}`;$('scenario').append(o)});const found=data.findIndex(c=>c.id===wanted);$('scenario').value=found>=0?found:0;render()}
function notesInto(id,notes){const list=$(id);list.replaceChildren();notes.forEach(n=>{let li=document.createElement('li'),date=document.createElement('small'),text=document.createElement('span');date.textContent=`Observed: ${n.observed_at||'Undated'}${n.recorded_at?' · Entered: '+n.recorded_at:''} · ID: ${n.id}`;text.textContent=n.text;li.append(date,text);list.append(li)})}
function render(){const i=Number($('scenario').value),c=data[i],p=c.pairs[Number($('repetition').value)];$('meta').textContent=`${i+1} / ${data.length} · ${c.language} · Coverage: ${c.start} to ${c.end} · ${c.notes.length} observations`;notesInto('notes',c.notes);notesInto('excluded',c.excluded_notes);$('excludedPanel').hidden=!c.excluded_notes.length;['gpt','qwen'].forEach(m=>{const o=p[m],draft=$(m+'Draft');draft.textContent=o.narrative||'(Empty narrative returned)';draft.classList.toggle('empty',!o.narrative);$(m+'Clarification').hidden=!o.clarification;$(m+'Clarification').textContent=o.clarification?'Clarification: '+o.clarification:'';$(m+'Raw').textContent=JSON.stringify(o,null,2)});$('previous').disabled=i===0;$('next').disabled=i===data.length-1;location.hash=c.id}
$('round').addEventListener('change',()=>setRound(data[Number($('scenario').value)].id));$('scenario').addEventListener('change',render);$('repetition').addEventListener('change',render);$('previous').onclick=()=>{$('scenario').value=Number($('scenario').value)-1;render()};$('next').onclick=()=>{$('scenario').value=Number($('scenario').value)+1;render()};setRound(location.hash.slice(1));
</script></html>'''
payload = {"rounds": [{"label": args.label, "cases": data, "guide": packet["writing_instructions"]}]}
if args.previous_folder:
    previous = (args.previous_folder / "DRAFT_COMPARISON.html").read_text(encoding="utf8")
    old = json.loads(previous.split('<script id="saved-data" type="application/json">', 1)[1].split('</script>', 1)[0])
    payload["rounds"] += old.get("rounds", [{"label": "v2 · earlier concise factual", "cases": old.get("cases"), "guide": old.get("guide")}])
encoded = json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
result = template.replace("__DATA__", encoded)
# Confirm every displayed draft comes unchanged from its saved candidate output.
recovered = json.loads(result.split('<script id="saved-data" type="application/json">', 1)[1].split('</script>', 1)[0])
assert recovered == payload
assert len(data) == len(cases) and sum(len(c["pairs"]) for c in data) == 3 * len(cases)
(folder / "DRAFT_COMPARISON.html").write_text(result, encoding="utf8")
if args.publish:
    args.publish.write_text(result, encoding="utf8")
print(folder / "DRAFT_COMPARISON.html")
print(folder / "DRAFT_COMPARISON.md")
