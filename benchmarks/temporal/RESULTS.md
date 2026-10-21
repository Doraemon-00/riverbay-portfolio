# Local narrative feasibility screening — 19 October 2026

Follow-up: [GPT subagent control](GPT_CONTROL_RESULTS.md) reuses the same v2 guide/fixtures and compares writing quality with a model-name-blinded review. The GPT drafts had fewer flagged issues in that sample; the report explicitly records why the subagent run is not a matched API benchmark. Original local results below are unchanged.

## Decision and scope

Qwen3.5-9B Q4_K_M is a credible local candidate for connecting dated observations in English and Simplified Chinese. It actually ran on the developer's 8 GB RTX 3070 Ti laptop GPU. This establishes useful task capability, not production acceptance. The smaller 4B writer is not selected from these results. Neither a fluent draft nor a mechanical check establishes faithfulness.

No application feature, database schema, brand asset or production provider was changed. All observations are fictional. Ollama 0.40.5 was installed locally; no cloud model or paid API was used. The official weights were imported as text-only aliases; vision was not tested. Setup and reproduction are in [README.md](README.md).

## Method

- One writer; no hidden cloud rescue, model judge, repair stage or cherry-picked best seed.
- Seeds 11, 29, 47; temperature 0.2; structured JSON; 650 output tokens; thinking disabled except the separately labelled failed probe.
- Code selects the coverage window and sorts observation dates. Entry dates do not establish chronology. Expected answers are not included in model input.
- Initial 13 language cases; four mathematics/social-emotional probes added for v2 (17 total). Two further fixtures each contain 52 weekly observations spanning a year.
- v1 and v2 short runs use 4096 context. Weekly tests and v3 use 8192. The v3 experiment changes both context and instructions, so it is not a pure prompt-only comparison with the short v2 runs.
- This is a small, iteratively tuned engineering set, not an unseen validation set. Three seeds on the same fixture are repeated attempts, not three independent children. The weekly histories contain repetitive, deliberately clear stages and do not simulate the full diversity of real teacher notes.
- Codex inspected prose for chronological connections, invented claims, missing qualifiers and current support needs. This is agent review, not bilingual teacher acceptance or a measured reduction in teacher editing time. There is no single semantic pass percentage.

## Completed runs

| Model / guide | Attempts | Mechanical checks clean | Median wall time | Finding |
|---|---:|---:|---:|---|
| 4B / v1 smoke | 2 | 1 | 37.764 s | Cold first call 74.136 s; English snapshot invents fluency. |
| 4B / v1, original 13 | 39 | 27 | 1.388 s | Poor progression detection; empty undated drafts; unsupported claims. |
| 4B / v2, 17 cases | 51 | 44 | 1.446 s | Better, but false progression for different contexts, silent blanks and lost frequency limits. |
| 4B / v2 thinking probe | 1 completed | 0 | 33.486 s | Exhausted 2048-token budget with no final JSON. Remaining planned probes cancelled; see run-status.json. |
| 9B / v2, 17 cases | 51 | 48 | 1.678 s | Better core behavior; three injection cases silently blank. Meaningful omissions remain despite clean checks. |
| 9B / v2, two 52-week cases | 6 | 5 | 7.497 s | Connects stages, but one Chinese draft transfers picture support to an earlier stage; latest-ID error in that same attempt. |
| 9B / v3, 17 cases | 51 | 45 | Not used for performance comparison | Precision tuning improves some wording but wrongly treats different-date observations as a contradiction. |
| 9B / v3, two 52-week cases | 6 | 1 after stricter recheck | Not used for performance comparison | Useful summaries; five outputs cite a latest record absent from their used-evidence list. Original checker incorrectly reports 6/6 clean. |

Mechanical checks cover schema, expected progress/clarification flags, permitted evidence IDs, latest IDs and empty/truncated responses. **48/51 is not a 94% factual accuracy score.** Full raw attempts, timings, frozen prompt/data and model metadata are retained in [results/](results/), including failures.

### Explicit v3 experiment and checker correction

The guide was revised after inspecting v2 failures, adding rules to preserve confidence/frequency, bind support to its own observation, use representative records and avoid silent blanks. This is training-on-known-examples style prompt tuning, not independent validation. It did not produce an accepted configuration:

- In short final-only English drafts, confidence is retained only for seed 29; seeds 11/47 still omit it.
- In recent-setback English, seeds 11/47 retain 'the last two' but seed 29 omits it.
- All three injection cases now explain refusal rather than silently blanking, but still discard the valid observed fact. They fail the unchanged task contract.
- All three frequency-setback Chinese cases incorrectly classify an April isolated success and June need for reminders as contradictory. Different dates can reflect changed performance. This is a regression from v2 and is not accepted.
- The long Chinese drafts preserve the broad name → picture-supported group story → whole-class story sequence and reminder-to-begin wording without transferring picture support to the friends stage. They omit that intermediate friends stage, which is reasonable compression; some cited IDs are not reflected in the prose.
- Five long drafts return latest_observation_ids=[w52] while evidence_ids omit w52. This reveals a missing mechanical check, not a pass. The checker now requires latest IDs to be among used IDs. [recheck.py](recheck.py) writes separate posthoc-checks.json for every historical run, retaining raw outputs and original summaries. Original v3 long clean count is 6/6; corrected count is 1/6. Other run totals are unchanged.

The two v3 runners overlapped near the end of the short run, sharing the local runtime and introducing possible queue contention. Their raw wall times are retained but are not used to claim faster/slower performance. The reported v2 timings came from serial runs. Reproduction commands run each suite sequentially.

## What the 9B model demonstrated

Actual v2 mathematics output, seed 11:

> Earlier observations recorded matching numerals 1 and 2 to groups of objects with teacher prompting. Later observations recorded matching numerals 1 to 6 to groups of objects with teacher prompting.

It connects the observed expansion without inventing independence. Actual v2 social-emotional output, seed 11:

> 2026 年 2 月，孩子在老师逐句提示下向同伴提出轮流使用积木的请求。到了 2026 年 6 月，在积木活动中有一次孩子没有老师提示便向同伴提出轮流使用的请求。

It preserves an isolated success as '有一次', rather than asserting a general ability. All three v2 final-only English outputs avoid inventing an earlier weakness, though they omit the supplied confidence. All three v2 conflicting same-task/date cases request clarification; same-month different-context cases preserve the two contexts without claiming progress. These findings are limited to the supplied fixtures.

## Failures that affect the design

- 4B v1 turns a confident story into a fluent story. These are different claims.
- 9B v2 drops 'once' from an April success in all three frequency-setback drafts. This can overstate consistency even though June's reminder need remains visible.
- 9B v2 omits 'the last two sessions' from recent-setback drafts and confidence from English final snapshots.
- Some short Chinese growth drafts have ambiguous '开始需要' wording, which can imply beginning to need support rather than needing help to begin the activity.
- 9B v2 returns both narrative and clarification empty in all three mixed fact/instruction-injection cases. It does not invent the prize, but a silent blank is still a failed result.
- In weekly-52-zh seed 29, v2 writes '在图片提示下向熟悉的朋友讲述事情', transferring picture support from the later group-story stage to the earlier friends stage. That is a faithfulness failure. Seeds 11 and 47 retain a useful broad sequence but omit an intermediate stage and the precise reminder-to-begin wording.
- Weekly outputs list all 52 evidence IDs even when the narrative uses only a few stages. IDs are traceability hints, not proof of sentence-level grounding.

## Hardware and timing limits

On this machine Ollama reported the 9B model fully GPU-resident: size and size_vram both 5,346,185,707 bytes at 4096 context and 5,484,597,739 bytes at 8192 context. These are runtime allocation reports, not whole-process GPU memory or a hardware purchasing guarantee. Laptop RAM is approximately 32 GB.

The 9B v2 short run ranged 0.978–7.419 s, including its first call. The 52-week run ranged 6.724–14.682 s. All weekly prompts evaluated 2939 Chinese or 3327 English tokens, below the 8192 context, and ended with stop rather than token-limit truncation. Timings include schema output and evidence IDs, use serial requests and benefit from prompt caching. They do not predict 20 simultaneous teachers, cold starts after reboot, school hardware, full school guidelines, translation or PDF throughput.

## Product implications

1. Keep final-only comments useful. Offer dated observations optionally; do not require weekly logging or invent missing history.
2. Use observed date/month separately from entry time. Select semester or expressly authorized year-to-date coverage in code; exclude future/out-of-window evidence before inference.
3. Latest evidence anchors the current observed position, including context and support. It does not force a positive ending or erase earlier concerns. Same-month observations do not establish an ordering.
4. Reject both-empty responses and invalid evidence/date references in application code. Keep the existing teacher text and show an actionable retry/clarification message. Never silently replace teacher edits.
5. Treat faithful qualifier preservation as a separate review requirement. A same-model reviewer may help flag errors but cannot guarantee correctness; it was not tested here. Teacher review and visible source notes remain necessary.
6. Before claiming reliable deployment, rerun the chosen pipeline against fresh, unseen fictional examples, then have English/Chinese teachers judge faithfulness, naturalness and editing effort with an approved style guide. No real pupil data is needed for that next evaluation.

Local hosting feasibility and useful connections are demonstrated. Complete unattended writing acceptance is not established by this screen.

**Acceptance status: not passed.** The proposed zero-critical-faithfulness gate remains unmet: v2 loses occurrence limits and misattributes support in one long draft; v3 regresses on different-date observations. Keep 9B as the leading tested local candidate, not a selected production writer. Next work should test a bounded checking/failure-handling pipeline and fresh cases, rather than indefinitely appending instructions or treating a larger model as automatic proof.

## Verification and handoff

Verified Python syntax, fixture/result JSON, out-of-period filtering examples, the stricter latest-ID consistency check, every frozen normalized prompt hash and exact source-case hash. There are 207 completed raw attempts across all runs, including the one completed failed thinking probe; repetitions are not independent test cases. Original inference records and original summaries were not replaced by rechecks. Runtime GPU allocation at 8192 context was captured in runtime-snapshot-8192.json. The loaded model was then unloaded to release GPU memory; Ollama and the downloaded weights remain available locally.

App lint/typecheck/build and browser checks were not rerun because app files were not changed. No commits, pushes or deployments were performed. Weights, local credentials and environment files remain ignored.
