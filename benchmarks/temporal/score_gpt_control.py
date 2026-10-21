"""Mechanical scoring and model-name-blinded review packet; no model calls."""
import argparse
import hashlib
import json
from pathlib import Path
import random

from run import checks, eligible

p = argparse.ArgumentParser()
p.add_argument("folder", type=Path)
p.add_argument("--qwen-runs", nargs="+", default=["20261019T032904Z-qwen9b-guided-v2", "20261019T033257Z-qwen9b-weekly52-v2"])
p.add_argument("--qwen-label", default="qwen9b-v2")
args = p.parse_args()
folder = args.folder
root = Path(__file__).resolve().parent
key = json.loads((folder / "evaluation-key.json").read_text(encoding="utf8"))
packet = json.loads((folder / "packet.json").read_text(encoding="utf8"))
assert len(key) == len(packet["items"])
outputs, scores = {}, []
for letter in "abc":
    path = folder / f"writer-{letter}.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8-sig").splitlines()]
    assert len(rows) == len(key), (path, len(rows))
    assert {row["case_id"] for row in rows} == set(key)
    outputs[letter] = {row["case_id"]: row["output"] for row in rows}
    for row in rows:
        case = key[row["case_id"]]
        notes, excluded = eligible(case)
        scores.append({"writer": letter, "item_id": row["case_id"], "case_id": case["id"],
                       "output": row["output"], "excluded_ids": excluded,
                       "mechanical_failures": checks(case, row["output"], notes)})

local = []
for name in args.qwen_runs:
    local += [json.loads(line) for line in (root / "results" / name / "outputs.jsonl").read_text(encoding="utf8").splitlines()]
local_outputs = {(r["case_id"], r["seed"]): r["output"] for r in local}
pairs, mapping = [], {}
rng = random.Random(719)
for item in packet["items"]:
    for letter, seed in zip("abc", [11, 29, 47]):
        pair_id = f"pair{len(pairs)+1:02}"
        candidates = [("gpt", outputs[letter][item["case_id"]]),
                      (args.qwen_label, local_outputs[(key[item["case_id"]]["id"], seed)])]
        rng.shuffle(candidates)
        pairs.append({"pair_id": pair_id, "input": item["input"],
                      "left": candidates[0][1], "right": candidates[1][1]})
        mapping[pair_id] = {"item_id": item["case_id"], "case_id": key[item["case_id"]]["id"],
                            "writer": letter, "seed": seed, "left": candidates[0][0], "right": candidates[1][0]}

report = {"attempts": len(scores), "mechanically_clean": sum(not r["mechanical_failures"] for r in scores),
          "checker_sha256": hashlib.sha256((root / "run.py").read_bytes()).hexdigest(),
          "warning": "Not semantic accuracy. Batch GPT subagents do not expose API sampling or inference latency.",
          "records": scores}
(folder / "mechanical-score.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf8")
(folder / "review-mapping.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf8")
for suffix, part in [("short", [pair for pair in pairs if len(pair["input"]["observations"]) < 50]),
                     ("long", [pair for pair in pairs if len(pair["input"]["observations"]) >= 50])]:
    data = {"writing_instructions": packet["writing_instructions"], "pairs": part}
    (folder / f"blind-review-{suffix}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf8")
print(json.dumps({"attempts": report["attempts"], "mechanically_clean": report["mechanically_clean"],
                  "pairs": len(pairs)}))
