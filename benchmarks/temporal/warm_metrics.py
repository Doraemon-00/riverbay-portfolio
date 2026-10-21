"""Descriptive style warnings, not a semantic quality score. No model calls."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
import re
import statistics

p = argparse.ArgumentParser()
p.add_argument("folder", type=Path)
folder = p.parse_args().folder
scores = json.loads((folder / "mechanical-score.json").read_text(encoding="utf8"))
mapping = json.loads((folder / "review-mapping.json").read_text(encoding="utf8"))
cases = json.loads((folder / "evaluation-key.json").read_text(encoding="utf8"))
languages = {c["id"]: c["language"] for c in cases.values()}
all_pairs = {}
for path in folder.glob("blind-review-short.json"):
    all_pairs.update({pair["pair_id"]: pair for pair in json.loads(path.read_text(encoding="utf8"))["pairs"]})
for path in folder.glob("blind-review-long.json"):
    all_pairs.update({pair["pair_id"]: pair for pair in json.loads(path.read_text(encoding="utf8"))["pairs"]})
rows, buckets, warnings = [], defaultdict(list), defaultdict(int)
for pair_id, pair in all_pairs.items():
    info = mapping[pair_id]
    case_id = info["case_id"]
    for side in ["left", "right"]:
        text = pair[side]["narrative"]
        language = languages[case_id]
        length = len(re.findall(r"[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+", text)) if language == "en" else len(re.findall(r"[\u3400-\u9fff]", text))
        pivots = re.findall(r"\b(?:but|however|although|nevertheless|despite)\b|但是|不过|然而|尽管|却", text, flags=re.I)
        candidate = info[side]
        rows.append({"pair_id": pair_id, "case_id": case_id, "candidate": candidate,
                     "language": language, "length": length, "contrast_word_warnings": pivots})
        warnings[candidate] += bool(pivots)
        if case_id.startswith("rich-") and text:
            buckets[candidate + ":" + language].append(length)
report = {"note": "Lengths and lexical contrast warnings only. A contrast word may require context; absence does not prove supportive tone or factual grounding. Sparse narratives have no minimum length.",
          "contrast_warning_outputs": dict(warnings),
          "rich_case_lengths": {k: {"count": len(v), "median": statistics.median(v), "min": min(v), "max": max(v)} for k, v in buckets.items()},
          "records": rows}
(folder / "style-metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf8")
print(json.dumps({k: v for k, v in report.items() if k != "records"}))
