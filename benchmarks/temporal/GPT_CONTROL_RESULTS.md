# GPT subagent control against local Qwen — 19 October 2026

## Finding

The GPT assistant available through this chat produced more reliable drafts on this sample than the tested local Qwen3.5-9B v2 writer. Three fresh GPT writers each completed the same 19 scenarios without seeing the expected answers, Qwen outputs or previous conversation. All 57 GPT drafts passed the existing mechanical checks. A separate review with model identities hidden found no material/critical issues in the GPT outputs and flagged 21 of 57 Qwen outputs.

This is a useful **writing-quality control**, not an exactly matched provider benchmark, proof of error-free writing or selection of a production model. No app integration was performed.

## Results

| Measure | GPT subagent control | Local Qwen3.5-9B, v2 |
|---|---:|---:|
| Scenarios per repetition | 17 short + 2 weekly-history cases | Same |
| Drafts, three repetitions | 57 | 57 |
| Mechanical checks clean | 57/57 | 53/57 |
| Outputs flagged with critical findings by blinded reviewers | 0/57 | 5/57 |
| Outputs flagged with material or critical findings | 0/57 | 21/57 |
| Outputs with any findings, including minor style/traceability | 0/57 | 27/57 |
| Comparable inference latency/cost | Not available | Earlier serial local timing recorded separately |

The finding categories overlap: critical is included in material-or-critical and in any findings. These are **reviewer flags, not factual accuracy percentages**. Repetitions of the same 19 fixtures are not 57 independent child cases. No confidence interval or general model ranking is claimed. Mechanical scores do not assess semantic faithfulness.

## Setup and limits of similarity

- Exact original v2 writing instructions, JSON fields and code-filtered facts were reused. The GPT control did not receive v3's targeted addendum or the expected labels. The local comparator is v2 in both short and long cases; no best-of-v2/v3 selection.
- Writers were launched through collaboration.spawn_agent with fork_turns=none and no model/reasoning override, inheriting this chat's configured GPT model. **The tool did not expose an exact provider snapshot/model ID, token usage, temperature, seed, reasoning budget or context limit.** This result must not be relabelled as a benchmark of a particular GPT API SKU, inexpensive mini model or exact model version.
- There were three fresh writer sessions, each receiving a 19-item packet. These are **three batched writing calls, not 57 independent API requests**. Local inference was one case per request, with temperature 0.2, seeds 11/29/47, a 650-token output ceiling, 4096 context for short and 8192 for weekly histories. GPT had no matched per-case token ceiling, reasoning setting or context limit. Its broader batch context and tool-enabled environment can affect results.
- Case names were replaced by neutral item IDs and shuffled. Packets included only instructions, output schema and eligible input facts. Expected answers and Qwen results were withheld from writers. The shared filesystem was not a security isolation boundary; agents were instructed to read only their packet. No history was forked into the writers. No writer received grading feedback, repair request or second attempt.
- Three additional fresh reviewer agents examined 26 short pairs, 25 short pairs and six weekly pairs respectively. The left/right identity was randomized independently for every pair. Reviewers received actual source facts and the same guide, but no model names, expected answer key, mapping, earlier results or conversation. They were asked to assess each output against facts, not choose a winner, and to quote the draft/source for findings. All 57 pairs / 114 outputs are covered once.
- Blinding reduces knowledge-of-candidate bias; it does not eliminate same-family model preferences, shared blind spots or subjective severity judgments. These reviewers are also GPT agents, not independent human teachers. No human or bilingual teacher validation has occurred. The exact prompts and unedited reviewer findings are retained. No root adjudication silently removed or added findings to improve a candidate's score.
- Subagent elapsed time includes agent reasoning, tool use, batching and file writing. It is not comparable with Ollama's serial per-request timing. GPT token cost and provider inference latency were not measured. No paid provider API was called by the harness; subagents use the chat's model service and account usage.
- These are known engineering fixtures, not a fresh held-out test set. The writers did not see the key, but the evaluation was designed/tuned during earlier Qwen experiments. Weekly fixtures are repetitive four-stage histories, not realistic full diversity. No generalization to live pupil records, school guidelines, other models or concurrency is established.

## Concrete differences

All three GPT writers preserved the English final snapshot's observed confidence without changing it to fluency. All retained 'the last two' in the recent-setback case and '有一次' in the Chinese frequency case. Qwen v2 omitted these qualifiers in those cases.

Actual GPT writer A, frequency-setback-zh:

> 四月，孩子有一次在小组活动中等候同伴说完后再发言。六月最近三次小组活动中，孩子都需要老师提醒等候同伴说完后再发言。

For the note that combined a real observation with an instruction to invent a prize and parental training, all three GPT writers produced:

> 孩子分享故事时需要老师提示。

They used the genuine fact and discarded the instruction. Qwen v2 returned narrative and clarification both empty in all three attempts. This is a failed draft, even though it did not invent the prize.

All three GPT weekly Chinese summaries kept the four observed stages and the current reminder-to-begin condition, without moving picture prompting onto the earlier friends stage. One Qwen weekly output transferred that support; the other two lost the reminder's precise start-of-task boundary. Blinded review also flagged additional Qwen audience/language-context issues. Individual judgments and quotations remain auditable rather than converted to a claim of 100%/63% factual accuracy.

## Evidence and reproduction

For direct human inspection, open the standalone [side-by-side comparison](gpt-control/20261019T034416Z/DRAFT_COMPARISON.html) or [readable Markdown copy](gpt-control/20261019T034416Z/DRAFT_COMPARISON.md). These contain the actual source notes and all three repetitions, with no evaluation scores or rewritten narratives. Rebuild them with `python benchmarks/temporal/build_comparison.py`. The HTML is self-contained and makes no network/model calls.

Run folder: [gpt-control/20261019T034416Z](gpt-control/20261019T034416Z/).

- packet.json: answer-key-free writer input, same for A/B/C.
- writer-a.jsonl, writer-b.jsonl, writer-c.jsonl: original first-attempt GPT drafts.
- evaluation-key.json: original case mapping, withheld from writers/reviewers.
- metadata.json: packet/guide hashes and protocol; orchestration.json: writer/reviewer task provenance and limitations.
- mechanical-score.json: same checker applied to all GPT drafts.
- blind-review-*.json: anonymized review inputs; review-*.json: unedited independent findings.
- review-mapping.json: candidate identity mapping, withheld from reviewers.
- blind-review-summary.json: validated coverage, aggregate findings and artifact hashes. It preserves every raw finding.

Prepare another packet with `python benchmarks/temporal/prepare_gpt_control.py`. The actual GPT drafting/review must be performed by fresh no-history subagents under the recorded instructions; preparation is not model inference. Score saved first attempts with:

```powershell
python benchmarks/temporal/score_gpt_control.py benchmarks/temporal/gpt-control/20261019T034416Z
python benchmarks/temporal/summarize_gpt_review.py benchmarks/temporal/gpt-control/20261019T034416Z
```

Recorded task prompts/provenance are in orchestration.json. Subagent behavior cannot be exactly replayed as seeded API inference through this tool. A production provider comparison would need explicit model IDs and one request per case under controlled inference settings, plus fresh fixtures and teacher review.

## Implication for the prototype

The task is achievable with the GPT assistant tested here, and Qwen's failures are not an unavoidable consequence of the reporting requirements. For now, keep GPT as the stronger observed quality reference and Qwen9B as the local candidate needing safeguards/evaluation. Do not assume a smaller cloud model will match this assistant, or silently promise production quality from the local model. Teacher review, visible source notes, period filtering and failure handling remain part of the proposed product.

Verified script syntax and artifact JSON, unchanged v2 guide, absence of expected-answer fields in writer packets, packet/output/review hashes and complete 57-pair / 114-output review coverage. Only standalone benchmark artifacts and notes changed. No app lint/build/browser rerun was needed; no commits, pushes, deployments, credential changes or app integration were performed. Production API testing and teacher validation remain pending.
