"""Verify saved warm benchmark/viewer artifacts without any model inference."""
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.request

root = Path(__file__).resolve().parent
folder = root / "gpt-control/20261019T043925Z-warm-v4"
local = root / "results/20261019T043925Z-qwen9b-warm-v4"
published = root / "gpt-control/20261019T034416Z/WARM_COMPARISON.html"

def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

for script in root.glob("*.py"):
    ast.parse(script.read_text(encoding="utf8"))
for artifact in folder.glob("*.json"):
    read(artifact)
meta, packet, local_meta = read(folder / "metadata.json"), read(folder / "packet.json"), read(local / "metadata.json")
assert hashlib.sha256((folder / "packet.json").read_bytes()).hexdigest() == meta["packet_sha256"]
assert packet["writing_instructions"] == (root / "prompt-v4-warm.txt").read_text(encoding="utf8")
assert "expected" not in json.dumps(packet)
assert meta["prompt_sha256"] == local_meta["prompt_sha256"]
assert hashlib.sha256((local / "prompt.txt").read_text(encoding="utf8").encode()).hexdigest() == meta["prompt_sha256"]
assert hashlib.sha256((local / "source-cases.json").read_bytes()).hexdigest() == local_meta["cases_sha256"]

page = (folder / "DRAFT_COMPARISON.html").read_text(encoding="utf8")
embedded = re.search(r'<script id="saved-data" type="application/json">(.*?)</script>', page, re.S)
saved = json.loads(embedded.group(1))
assert [len(r["cases"]) for r in saved["rounds"]] == [23, 19]
assert saved["rounds"][0]["guide"] == packet["writing_instructions"]
key = read(folder / "evaluation-key.json")
ids = {case["id"]: item for item, case in key.items()}
writers = {letter: {row["case_id"]: row["output"] for row in
                   [json.loads(line) for line in (folder / f"writer-{letter}.jsonl").read_text(encoding="utf8").splitlines()]}
           for letter in "abc"}
qwen = {(row["case_id"], row["seed"]): row["output"] for row in
        [json.loads(line) for line in (local / "outputs.jsonl").read_text(encoding="utf8").splitlines()]}
assert all(len(w) == 23 for w in writers.values()) and len(qwen) == 69
for case in saved["rounds"][0]["cases"]:
    assert len(case["pairs"]) == 3
    for pair, letter, seed in zip(case["pairs"], "abc", [11, 29, 47]):
        assert pair["gpt"] == writers[letter][ids[case["id"]]]
        assert pair["qwen"] == qwen[case["id"], seed]

js = page.split("<script>", 1)[1].split("</script>", 1)[0]
result = subprocess.run(["node", "--check", "--input-type=commonjs"], input=js, text=True, capture_output=True)
assert result.returncode == 0, result.stderr
assert published.read_bytes() == (folder / "DRAFT_COMPARISON.html").read_bytes()
with urllib.request.urlopen("http://127.0.0.1:8767/WARM_COMPARISON.html") as response:
    assert response.status == 200 and response.read() == published.read_bytes()

summary = read(folder / "blind-review-summary.json")
assert summary["reviewed_pairs"] == 69 and len(summary["records"]) == 138
for name, digest in summary["artifact_sha256"].items():
    assert hashlib.sha256((folder / name).read_bytes()).hexdigest() == digest, name
print("Verified syntax/JSON, matching guides and frozen hashes, answer-key-free packet, all 69 exact draft pairs, two viewer rounds, localhost HTTP 200, and 138 reviewed outputs.")
