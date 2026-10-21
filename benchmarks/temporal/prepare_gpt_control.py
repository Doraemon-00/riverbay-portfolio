"""Prepare answer-key-free subagent packets; never invokes an inference provider."""
import datetime as dt
import argparse
import hashlib
import json
from pathlib import Path
import random

from run import eligible, SCHEMA

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("--prompt-file", type=Path, default=root / "prompt-v2.txt")
parser.add_argument("--dataset", type=Path)
parser.add_argument("--tag", default="")
args = parser.parse_args()
guide = args.prompt_file.read_text(encoding="utf8")
cases = json.loads((args.dataset or root / "cases.json").read_text(encoding="utf8"))
if args.dataset is None:
    cases += json.loads((root / "long-cases.json").read_text(encoding="utf8"))
random.Random(811).shuffle(cases)
stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
folder = root / "gpt-control" / (stamp + ("-" + args.tag if args.tag else ""))
folder.mkdir(parents=True)
items, key = [], {}
for i, case in enumerate(cases, 1):
    item_id = f"item{i:02}"
    notes, _ = eligible(case)
    items.append({"case_id": item_id, "input": {"target_language": case["language"],
                  "reporting_period": {"start": case["period_start"], "end": case["period_end"]},
                  "observations": notes}})
    key[item_id] = case
packet = {"writing_instructions": guide, "output_schema": SCHEMA, "items": items}
raw = json.dumps(packet, ensure_ascii=False, indent=2).encode("utf8")
(folder / "packet.json").write_bytes(raw)
(folder / "evaluation-key.json").write_text(json.dumps(key, ensure_ascii=False, indent=2), encoding="utf8")
metadata = {"created_utc": stamp, "packet_sha256": hashlib.sha256(raw).hexdigest(),
            "prompt_sha256": hashlib.sha256(guide.encode()).hexdigest(), "cases": len(items),
            "protocol": "Three fresh no-history GPT subagents; same selected guide and filtered facts. No expected labels or local results in writer packet. Batch-context control, not matched API sampling or token latency."}
(folder / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf8")
print(folder.resolve())
