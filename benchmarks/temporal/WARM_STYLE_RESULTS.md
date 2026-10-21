# Warm developmental rerun — 19 October 2026

## Read the actual drafts

[Interactive comparison](http://127.0.0.1:8767/WARM_COMPARISON.html#rich-english-sharing) · [standalone HTML](gpt-control/20261019T043925Z-warm-v4/DRAFT_COMPARISON.html) · [readable Markdown](gpt-control/20261019T043925Z-warm-v4/DRAFT_COMPARISON.md).

The interactive page has a prompt-version selector: v4 warm developmental, or v2 earlier concise factual. Both models and all three repetitions are shown within each round. The original 19 scenarios are shared; four new, richer examples cover English, Chinese, Mathematics and Social-Emotional Development and appear only in v4. All displayed drafts are copied unchanged from saved model outputs. Scores are deliberately absent from the reading page. The old comparison file remains unchanged.

## Editorial direction tested

Jun Song selected warm developmental paragraphs for general portfolio feedback. Support is integrated before a supported achievement where natural. Praise should not be cancelled by a 'but/however' pivot; current needs must still remain visible. Teacher-recorded confidence/energy can be retained, never invented. A separate serious-concern/parent-contact workflow is outside this prototype scope. No invented interventions, goals or home activities.

The new [v4 guide](prompt-v4-warm.txt) requests roughly 80–120 English words or 140–220 Chinese characters when evidence is rich. Sparse evidence has no minimum length and must not be padded. These are provisional editorial choices, not the school's approved style guide.

## Execution

- Same 19 legacy fixtures plus four richer fictional cases, supplied to both candidates: 23 cases × three attempts = 69 outputs each.
- Actual Qwen3.5-9B Q4_K_M text-only inference on the laptop through Ollama. Temperature 0.2, seeds 11/29/47, 8192 context, 1000 output tokens, thinking disabled; serial requests with no repair/reviewer/cloud rescue.
- GPT: three fresh no-history subagents, each receiving the same shuffled 23-item packet, with expected labels, earlier conversation and Qwen outputs withheld. No writer grading feedback or second attempt. Inherited GPT snapshot/sampling/reasoning metadata are not exposed. These are three batch sessions, not 69 matched individual API calls.
- Three further fresh GPT agents reviewed all 69 randomized anonymous pairs / 138 outputs. Sources and the v4 guide were shown; candidate identity mapping was withheld. Reviewers assessed each draft independently rather than selecting a winner, recording exact quotations and source facts plus a style note. No raw findings were edited or silently adjudicated away.
- All fixtures are known engineering probes, not held-out validation. New rich fixtures provide enough actual facts for substantial paragraphs; they do not establish realistic school workload diversity. Same-family agent review reduces context contamination but cannot guarantee impartial or exhaustive judgment. No human/bilingual teacher acceptance occurred.

## Results

| Check | GPT subagents | Local Qwen9B v4 |
|---|---:|---:|
| Mechanical checks clean, all 23 cases | 69/69 | 53/69 |
| Mechanical checks clean, original 19 only | 57/57 | 43/57 |
| Outputs with critical reviewer findings | 1/69 | 42/69 |
| Outputs with material or critical reviewer findings | 2/69 | 55/69 |
| Outputs with any findings, including minor style issues | 22/69 | 62/69 |
| Outputs with lexical contrast-word warnings | 0/69 | 12/69 |
| Rich English paragraph length, median | 93 words | 112 words |
| Rich Chinese paragraph length, median | 165 Chinese characters | 181 Chinese characters |

Critical is included in material-or-critical and any-finding counts. These are **reviewer flags, not factual accuracy percentages**. Style and severity judgments are subjective; a mechanical pass is not a faithful paragraph. Contrast-word warnings are a limited lexical screen; reviewers can identify additional concessive phrasing. Repeated attempts are not independent child cases.

The earlier v2 common-19 screen had 57/57 GPT and 53/57 Qwen mechanical checks clean. v4's local common-case score is lower. Context/output ceilings also changed from 4096/650 for short v2 requests to 8192/1000 in v4, and the reviewer task now includes warm-style criteria. These runs do not isolate a single causal effect of prompting, nor support directly comparing old and new reviewer-flag percentages as accuracy changes.

## What improved and what failed

The richer cases produce substantial paragraphs for both candidates. GPT generally integrates support and achievement without cancelling pivots. Qwen's paragraphs are longer too, but warmth often introduces unrecorded confidence, motivation, fluency, gender or broad developmental claims. It also retains 'however', 'although', '尽管' and '不过' in some outputs despite the instruction. The page preserves those failures.

GPT is not error-free in this rerun. One recent-setback draft says 'beginning and sustaining a whole-class contribution currently involves more support than in the earlier storytelling occasion'. The source records prompting to begin and stopping after one sentence; it does not establish support for sustaining speech. Blinded review flagged that as an invented support need. Another GPT draft omits the two-classmate scope of a retained March observation. Twenty GPT outputs received minor repetition findings: a closing sentence restates sparse evidence without adding substance. Rich GPT drafts are closer to the selected style, but sparse inputs should remain shorter rather than filling space.

Qwen also fails some structured progress decisions, refuses usable observations mixed with an instruction injection, falsely treats different-date behavior as conflicting, and returns inconsistent used/latest IDs for long histories. These issues remain separate from a parent's preference for its wording. There were no token-limit truncations in the 69 local attempts.

**Neither configuration meets a zero-critical-faithfulness acceptance gate for this warm style.** GPT remains the stronger observed quality reference on this sample. No production provider or app prompt was selected or integrated. The next revision should address unnecessary restatement and verify support qualifiers, rather than simply ask for more words.

## Timing and artifacts

Local median wall time was 2.419 seconds, range 1.342–12.228 seconds. Requests were serial and benefited from prompt caching; timings include structured evidence IDs. Rich/weekly requests vary substantially. No comparable GPT provider latency, tokens, price or concurrency was exposed. The model was unloaded after the run to release GPU memory.

Local evidence: [results/20261019T043925Z-qwen9b-warm-v4](results/20261019T043925Z-qwen9b-warm-v4/). GPT packet, raw writers, blinded review packets/findings, metadata, provenance, metrics and aggregate coverage: [gpt-control/20261019T043925Z-warm-v4](gpt-control/20261019T043925Z-warm-v4/). Exact task instructions and tool settings are recorded in orchestration.json. Review packets were frozen before review; they contain 26, 25 and 18 pairs respectively. Existing historical evidence was not rewritten.

The comparison builder embeds the saved v2 round alongside v4 and publishes a separate WARM_COMPARISON.html into the existing localhost preview folder. It does not overwrite the original DRAFT_COMPARISON.html or alter app files, brand assets, login or sharing.

## Verification and remaining work

`python benchmarks/temporal/verify_warm_artifacts.py` passed: Python/JavaScript syntax, JSON, matching GPT/Qwen guide hashes, frozen source-case hashes, no expected labels in writer packets, all 69 viewer pairs matching their unedited output records, both prompt versions, exact published HTML over localhost HTTP 200, and complete 138-output review coverage/artifact hashes.

Browser checks covered scenario/repetition selection, switching v4 → v2 → v4 on a shared case, English/Chinese display, desktop layout and the stacked 390px layout. The temporary viewport override was reset, and the warmer English comparison was left open as a deliverable. Source notes remain expandable. No app files changed, so app lint/typecheck/build were not rerun. No commits, pushes, deployment, credential or sharing changes were made. This is still a local synthetic writing experiment; prompt refinement, school-guide alignment, independent teacher review and app integration remain pending.
