# Milestone B: current classroom drafting comparison

20 October 2026. One fictional child's four current Semester 2 domains. This evaluates drafting from realistic persisted app inputs, not full browser-to-host latency or production readiness. Portfolio records and the app prompt/provider were not changed.

Open **COMPARISON.html** in this directory for sources, all attempts, optional model/measurement reveal, and earlier saved narratives. No best-output selection. The historical drafts are not controlled comparators: their original request snapshots, generation metadata and subsequent edits cannot be established from persisted narrative text.

## Frozen scope

- English: 4 observations; Chinese: 13; Mathematics: 10; Social-emotional: 4.
- Read-only local authenticated capture of Avery's fictional Semester 2 records. Previous-semester evidence excluded; all current dated notes fall inside July–December 2026. Undated context retained without invented chronology.
- Same `cases.json` and `prompt.txt` for all writers. Model payload contains domain/language, indicator, date/text observations and explicit evidence window; no child name/ID, saved narrative or photos.
- Dates/months may clarify a story but need not appear. Year normally omitted. Meaningful learning themes can replace date order; current assistance must remain visible. Educational interpretation must stay within demonstrated examples.
- GPT: three independent fresh, no-history Codex agents, four-case batch per agent, no other outputs/answer key. Exact inherited model snapshot/sampling/token settings unavailable. This is not an OpenAI API model benchmark or equal per-case execution protocol.
- Qwen: local `riverbay-qwen35-9b:latest`, official Qwen3.5-9B Q4_K_M digest/runtime retained in `qwen-metadata.json`. Thinking disabled, temperature 0.2, seeds 11/29/47, context 8192, output ceiling 2048. JSON-constrained output.
- Gemini: `gemini-3.1-flash-lite`, actual Google API, app-equivalent low-thinking/JSON settings with revised frozen prompt, 4096-token output ceiling, 45-second timeout. Five seconds between completed calls. No automatic retry or paid/provider fallback. API usage reports service tier `standard`; that field alone does not establish billing status. No billing setting was changed.
- This benchmark's extra explicit scope field is not yet part of the live app payload. Prompt and filtering are experimental scaffolding, not a claim that the current app already enforces this scope.

## Completion and resources

| Writer | Completed outputs | Timing | GPU memory |
| --- | --- | --- | --- |
| Qwen3.5-9B Q4_K_M | 12/12, valid JSON and nonempty narrative | First request 9.016 s including 5.903 s reported model load; remaining 11 requests median 3.557 s, range 2.332–4.202 s | Sampled device peak 5409 MiB = 5.282 GiB |
| GPT via Codex agents | 12/12, valid JSON and nonempty narrative | No comparable per-case API latency | Unavailable |
| Gemini 3.1 Flash-Lite | 1 success, 1 failed attempt, 10 not attempted | English 12.505 s; Chinese HTTP 503 after 3.318 s | Unavailable |

Gemini stopped on its first unavailable request. HTTP 503 is an availability failure, not proof of exhausted free quota. No retry was made. There are **25 completed narratives out of 36 planned**, plus one retained failed request. No aggregate three-model quality ranking is justified from one Gemini output.

GPU sampling used nvidia-smi, roughly every 200 ms plus command overhead. It measures the whole device and can miss shorter peaks. First baseline reported 0 MiB on an 8192 MiB GPU; this is the driver-reported measure, not a guarantee that no graphics workload existed. Warm baselines already include the resident model, so their small increases are not model memory requirements. Raw sample times, utilization, load/evaluation durations and token counts remain in `qwen.jsonl`. Cloud GPU metrics are not exposed. No concurrency or school-machine performance claim follows.

## Source-grounded inspection

These are primary-agent observations, not blinded independent grading or bilingual teacher acceptance. The page hides provider labels for the user's first reading, but this does not make this analysis blinded. JSON validity does not measure factual faithfulness.

### English

- Qwen attempts 1 and 3 still follow July/August/October closely. All three use a praise/achievement followed by **but**, despite the prompt. Attempt 2 is shorter and less calendar-driven. No output mentions 2026.
- Gemini's sole output also follows months. It expands the undated single group-time idea into **“Throughout the semester ... shared personal ideas”**, adding unsupported duration/repetition. The teacher-question passage asserts the child explained the ending; the source says a question was needed, which does not explicitly confirm completion.
- GPT attempt 2 groups the evidence around storytelling support and preserves the needed teacher question. Attempt 1 asserts successful explanation of the ending after the question, which the source does not establish. Attempt 3 says **“describing a picnic to two friends”** where the source says an account of a picnic **with two friends**; this changes an ambiguous detail into a specific audience. It should retain the original ambiguity or omit that detail.

### Chinese

- GPT uses selected month references in attempts 1/3 to connect animal naming and later elaboration. Attempt 2 uses thematic organisation. These illustrate the intended discretion rather than a blanket ban on dates. Source-visible teacher review is still needed.
- Qwen attempt 1 introduces **逐步建立表达信心**, an inferred confidence trajectory absent from the observations. It also merges sharing a drawing and describing an animal into one account of added colour/action detail.
- Qwen attempt 2 invents **画作的故事** from introducing a drawing, loses the assistance needed to explain links between sequenced pictures, and uses a 虽然…但 contrast. Attempt 3 again merges detail from the animal-sharing observation into drawing/animal sharing and drops assistance for explaining links between pictures. These are fidelity concerns even though it avoids the year.
- Qwen Chinese outputs are considerably longer than the soft 140–220 character target, especially attempt 1. Length is not itself a factual error; it increases editing/layout burden.

### Mathematics

- GPT outputs concentrate on supported counting and pattern connections and preserve the benefit of arranging scattered objects. They select examples rather than reciting all ten. This is a promising writing pattern, not an accuracy guarantee.
- Qwen attempt 1 adds **strong** early skills, moves a July numeral-matching observation into August, and writes a chronological inventory.
- Qwen attempt 2 adds **growing confidence**, a **gentle** prompt, and unsupported connections to focusing carefully and relationships between numbers from colour patterns.
- Qwen attempt 3 adds **growing confidence**, **emerged quickly**, quantity comparison becoming **natural**, improvement **with practice** as a cause, and omits the latest explicit benefit of arranging scattered objects. This is the clearest example of fluent educational interpretation exceeding its evidence.

### Social-emotional

- GPT generally keeps the teacher introduction, waiting reminder, shared materials and teacher help with disagreement grounded in their recorded situations.
- Qwen attempt 1 adds **patiently** to waiting. Attempt 3 generalises a single crayon disagreement into **“When conflicts arise”** and adds **often** to an undated transition note. Attempt 2 is closer to the source, though it still chooses chronological framing.

## Recommendation

The revised instruction reduces compulsory date use in some outputs, but it does **not** reliably solve qualifier loss, invented confidence or forced educational conclusions in Qwen. Its latency and laptop memory footprint are promising. Its writing is still a candidate needing review, not an accepted replacement model. GPT gives useful style references but also changes facts, so no writer passes a zero-material-error acceptance gate on this sample. Gemini's writing/availability cannot be judged broadly from one successful call.

Do not tune again against these outputs and call it fresh validation. Next: user/teacher review of the visible comparisons, then agree which concrete failure categories to address and test a small unseen set. School-specific guideline ingestion/checking is still unimplemented. Cross-semester narrative synthesis is deferred; Semester 2 display of Semester 1 ratings remains a separate requirement.

## Reproduce and inspect

1. `prepare.cjs` freezes authenticated local demo inputs once; it refuses to overwrite `cases.json`. Never use it on real child data.
2. `run_qwen.py` records 12 local attempts and sampled device metrics; it unloads only this model before the first request. Requires Ollama and nvidia-smi.
3. `run_gemini.cjs`, run with Node's `--env-file=.env.local`, records up to 12 requests and stops on its first API/transport error. It refuses to overwrite output. Credentials are not saved to artifacts.
4. GPT JSON files are agent-written artifacts, not reproducible API calls. Exact model identity/settings remain unknown.
5. `build_report.py` validates case/attempt uniqueness and output shape and rebuilds static HTML plus summary. It makes no network or database calls.

To repeat the experiment, create a new run directory and preserve this run; do not delete/overwrite the failed attempts. Raw results include provider response metadata, not API keys. The comparison page contains no remote assets or external scripts.

Verification: report builder checks all 24 Qwen/GPT outputs and the successful Gemini output for schema/attempt uniqueness; script ESLint and Python compilation passed. Comparison page inspected at desktop and 390px viewport, including reveal controls and Chinese layout; no horizontal overflow at 390px. Screenshots: `desktop.png`, `mobile.png`. No app code changed, so app lint/typecheck/build were not rerun for this standalone experiment. The local Qwen model was unloaded after measurement to release GPU memory.
