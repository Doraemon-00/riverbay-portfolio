# Local dated-observation writing check

Purpose: test whether a small locally served model can relate dated teacher observations into a supported preschool narrative, in English and Simplified Chinese, while handling final-only, undated, conflicting and adverse evidence. Initial cases focus on language; added mathematics/social-emotional probes and repetitive 52-week fixtures broaden the engineering screen. This is not an all-domain quality certification, teacher study or production-ready app feature. See [RESULTS.md](RESULTS.md) for measured findings and remaining failures.

A subsequent GPT subagent quality control, using the same v2 guide and fixtures with model-name-blinded agent review, is documented in [GPT_CONTROL_RESULTS.md](GPT_CONTROL_RESULTS.md). It has important batching/sampling/model-identity limits and is not a matched provider-latency benchmark.

Latest: [warm developmental v4 rerun](WARM_STYLE_RESULTS.md), including the original 19 scenarios plus four richer domain examples. Both candidates were rerun with the same new guide; the interactive comparison offers v4/v2 switching. Raw outputs remain unpolished and neither warm configuration meets the zero-critical-faithfulness gate.

## Run

Install Ollama from its official distribution and start its local service. Download the candidate with `ollama pull qwen3.5:4b`. The runner sends synthetic cases only to `http://127.0.0.1:11434`; no cloud fallback, provider credential or app database is used. Model weights are a separate download, not tracked in this repository.

From the repository root:

```powershell
python benchmarks/temporal/run.py --model qwen3.5:4b --seeds 11,29,47 --tag baseline-v1
```

Optional `--cases growth-zh,snapshot-only-en` for a smoke check; `--think` for a separately labelled thinking-mode comparison; `--model` for another locally downloaded model. Keep prompt/data/settings fixed for a fair candidate comparison. This runner does not silently repair failed output, use another model as a judge, or count only best-of-three results.

`--prompt-file benchmarks/temporal/prompt-v2.txt` selects the explicitly revised guide; the original v1 guide remains in run.py and historical results. `--num-predict` overrides the token ceiling for a separately labelled experiment. The fixture initially had 13 language scenarios; four additional mathematics/social-emotional probes were appended for guided-v2 (17 cases total). Compare the original 13 separately when comparing v1/v2 rates. They are small engineering probes, not a preregistered unseen validation set.

The v3 guide adds precision rules based on observed failures. Rebuild it by concatenating prompt-v2.txt, two newlines and prompt-v3-addendum.txt as UTF-8. Its cases are known/tuned, not unseen validation. Reproduce the final short and long screens sequentially (avoid competing requests when measuring latency):

```powershell
python benchmarks/temporal/run.py --model riverbay-qwen35-9b --prompt-file benchmarks/temporal/prompt-v3.txt --num-ctx 8192 --tag qwen9b-guided-v3
python benchmarks/temporal/run.py --model riverbay-qwen35-9b --prompt-file benchmarks/temporal/prompt-v3.txt --dataset benchmarks/temporal/long-cases.json --num-ctx 8192 --tag qwen9b-weekly52-v3
```

### Local setup on 19 October 2026

Ollama 0.40.5 was installed from the official winget package on the user's RTX 3070 Ti laptop (8 GB VRAM, approximately 32 GB RAM). Normal pull hit IPv6 timeouts. The official registry manifest/weight blob was downloaded over IPv4 with curl and SHA-256 checked against the manifest, without changing system network configuration.

Text-only model aliases are imported from the official GGUF weights with the published `{{ .Prompt }}` template and sampling defaults (presence penalty 1.5, temperature 1, top_k 20, top_p 0.95); the benchmark overrides temperature to 0.2. Vision projectors are deliberately omitted because this is a text-only task. Therefore these are local text-only imports, not a claim to have tested every capability of the complete multimodal tag. Exact quantization and alias digest are in metadata.json. Large downloads and Modelfiles are local under ignored evidence/temporal/, not committed. No paid model API or cloud model was used.

## Evidence

Each run creates `results/<UTC timestamp>-<tag>/` with:

- `metadata.json`: exact model details/digest, runtime version, prompt/data hashes and inference settings.
- `prompt.txt` and `cases.json` (or verified historical `source-cases.json`): frozen writing instructions and fixtures used by the run.
- `outputs.jsonl`: full response, selected/excluded evidence, timings, expected labels and mechanical findings for every case/seed, including failures.
- `summary.json`: mechanical totals only. Not a semantic quality score.
- `posthoc-checks.json`: stricter recheck including latest IDs being among used evidence IDs. Run `python benchmarks/temporal/recheck.py` without inference. Original summaries/raw outputs are preserved; see RESULTS.md for the v3 long-run correction.

Prompt hashes use the UTF-8 prompt text with normalized newlines, as sent by the Python runner; source-case hashes use exact file bytes. For early runs made before automatic fixture freezing, source-cases.json was recovered only after matching its exact bytes to the recorded SHA-256. Raw observations/outputs remain unchanged.

Expected labels remain outside model input. Reporting-period filtering/sorting happen in code and are disclosed. The single writer receives a trusted guideline, evidence and a JSON output schema. Record whether a later system adds a reviewer/repair step; do not attribute pipeline performance to the unaided writer.

Human/agent inspection must evaluate the actual prose: unsupported claims, qualifier loss, chronology, context differences, missing concerns, naturalness and edit burden. Evidence-ID membership is not proof a sentence is grounded. Target zero critical faithfulness errors in this small screen, then assess useful writing and measured latency. A clean run does not prove zero hallucinations or teacher acceptance. Any application adoption still needs review safeguards and broader real-workflow evaluation.

No UI, schema or production provider is changed by running this benchmark. Do not commit/push results without the user's instruction. All fixtures and retained outputs are fictional.
