"""Recheck saved outputs without changing original inference evidence or calling a model."""
import hashlib
import json
from pathlib import Path

from run import checks

root = Path(__file__).resolve().parent
checker_hash = hashlib.sha256((root / "run.py").read_bytes()).hexdigest()
for folder in sorted((root / "results").iterdir()):
    source = folder / "outputs.jsonl"
    if not source.exists():
        continue
    rows = [json.loads(line) for line in source.read_text(encoding="utf8").splitlines()]
    revised = []
    for row in rows:
        output = row.get("output")
        findings = row["mechanical_failures"]
        if isinstance(output, dict):
            case = {"expected": row["expected"]}
            findings = checks(case, output, row["eligible_notes"])
            if row.get("raw_response", {}).get("done_reason") == "length":
                findings.append("token_limit")
        revised.append({"case_id": row["case_id"], "seed": row["seed"],
                        "original_findings": row["mechanical_failures"], "findings": findings})
    report = {"checker_sha256": checker_hash,
              "note": "Post-hoc stricter check adds latest_not_used. Original inference evidence and summaries unchanged. No prose faithfulness score.",
              "attempts": len(rows), "mechanically_clean": sum(not r["findings"] for r in revised),
              "checks": revised}
    (folder / "posthoc-checks.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf8")
    print(folder.name, report["mechanically_clean"], "/", report["attempts"])
