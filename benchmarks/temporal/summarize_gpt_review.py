"""Validate and aggregate saved blinded reviews; no model calls or rewrites."""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("folder", type=Path)
folder = p.parse_args().folder
mapping = json.loads((folder / "review-mapping.json").read_text(encoding="utf8"))
seen, records, totals = set(), [], defaultdict(Counter)
for suffix in ["short-a", "short-b", "long"]:
    raw = json.loads((folder / f"review-{suffix}.json").read_text(encoding="utf8"))
    assert raw["reviewed_pairs"] == len(raw["records"])
    for row in raw["records"]:
        pair = row["pair_id"]
        assert pair in mapping and pair not in seen
        seen.add(pair)
        for side in ["left", "right"]:
            findings = row[side + "_findings"]
            for finding in findings:
                assert finding["severity"] in ["critical", "material", "minor"]
                assert all(isinstance(finding[k], str) for k in ["type", "quote", "source_fact", "explanation"])
            candidate = mapping[pair][side]
            totals[candidate]["reviewed_outputs"] += 1
            totals[candidate]["outputs_with_critical_findings"] += any(f["severity"] == "critical" for f in findings)
            totals[candidate]["outputs_with_material_or_critical_findings"] += any(f["severity"] in ["material", "critical"] for f in findings)
            totals[candidate]["outputs_with_any_findings"] += bool(findings)
            records.append({"pair_id": pair, "case_id": mapping[pair]["case_id"],
                            "writer": mapping[pair]["writer"], "candidate": candidate, "findings": findings})
assert seen == set(mapping)
hashes = {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
          for path in folder.glob("*.json*") if path.name != "blind-review-summary.json"}
summary = {"reviewed_pairs": len(seen), "totals": dict(totals), "artifact_sha256": hashes,
           "limits": "Model-name-blinded GPT-family agent judgments, not human ground truth or factual accuracy rates. GPT runs have batched context, unavailable sampling/snapshot settings, and no measured inference latency. Known fixtures, not unseen validation.",
           "records": records}
(folder / "blind-review-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf8")
print(json.dumps(summary["totals"]))
