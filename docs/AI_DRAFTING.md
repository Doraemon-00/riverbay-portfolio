# AI drafting — milestone A

Implemented 20 October 2026. Subsequently the user reassigned milestone B to a [current-input writing/resource comparison](../benchmarks/live-classroom/RESULTS.md). That standalone experiment freezes a revised semester-only prompt; it does not change this app integration. School-guideline checks and production model acceptance remain pending.

## Setup

Configure one provider in ignored `.env.local` and restart the server. Keep keys server-only.

| Provider | Key | Optional model override | Default |
|---|---|---|---|
| Gemini | GEMINI_API_KEY | GEMINI_MODEL | gemini-3.1-flash-lite |
| Groq | GROQ_API_KEY | GROQ_MODEL | qwen/qwen3.8-27b |
| OpenAI | OPENAI_API_KEY | OPENAI_MODEL | gpt-4.1-mini-2025-04-14 |

Set `AI_PROVIDER=gemini`, `groq` or `openai` to pin the provider. When unset, a configured Gemini key selects Gemini, then a Groq key selects Groq, otherwise OpenAI. There is no retry/fallback across providers. The initial adapter pass had no key. A later Gemini live smoke check is recorded below; Groq remains untested live. Groq is distinct from xAI Grok.

Free access is model/account/quota-dependent, not enforced by the adapter: keep the account on its free tier for this demo. Do not enable paid billing automatically. Gemini free-tier content may be used to improve Google's products; use fictional notes only. Sources checked: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [Groq structured output](https://console.groq.com/docs/structured-outputs), [Groq limits](https://console.groq.com/docs/rate-limits).

The adapter uses Responses API Structured Outputs. Sources: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). The default model is provisional, not a benchmark result.

## Behaviour

- Draft narrative sends the current indicator and all nonblank observations, including unsaved notes and collapsed history. An indicator without notes cannot generate.
- The current narrative remains unchanged and editable during generation. Cancel stops the browser request.
- Proposed AI draft appears below the current narrative. Use draft explicitly replaces the narrative, marks the form unsaved, and requires Save changes. Dismiss changes nothing. Try again requests another candidate.
- A changed observation, indicator or narrative disables acceptance of an outdated candidate. Failures preserve all teacher text. Clarification responses are shown without an acceptance button.
- Accepted text uses the existing Save/Discard/Stay guard. Unaccepted previews are transient and can disappear on navigation/reload.

## Pipeline and boundaries

POST `/api/narrative/draft` checks origin host, authenticated active viewer, RLS-protected entry access, saved revision, and input limits. Domain comes from the database. The provider sends domain/language, indicator and chronologically ordered date/text notes. Undated notes supply context without chronology.

Entry, student and observation IDs, class, photos, existing narrative and other domains are not forwarded. Free-text notes can contain identifiers; this is not an anonymisation guarantee or production PDPA assessment. Fictional data only.

One request goes to the selected provider's fixed endpoint, with a 45-second timeout, bounded output and JSON schema. OpenAI uses Responses with `store:false`; Groq uses Chat Completions with strict JSON schema; Gemini uses generateContent with JSON response format. OpenAI's store setting is not a cross-provider retention guarantee. Refused/incomplete/unusable responses return a safe error. Provider/model, prompt version and input revision accompany the result. The same baseline prompt asks for warm, evidence-only prose; school-guideline ingestion, prohibited-word checking and automatic factual verification remain outside A.

Generation makes no database changes. Candidate metadata/snapshots are transient; durable generation/acceptance provenance and retention remain future work. The existing generation_runs table is unused; no guideline check is labelled passed.

Prototype throttling is one concurrent request and six requests per minute per viewer, held in process memory. Distributed limits/spend controls remain future work. An upstream request may continue after browser cancellation until its timeout.

## Verification

- Lint, typecheck and production build passed.
- `node --conditions=react-server scripts/check-drafting.cjs`: injected-transport tests for request validation, minimal chronological payload, structured schema, results/clarifications, malformed/refused/incomplete output, rate limit, timeout and missing key.
- `node --env-file=.env.local scripts/check-drafting-route.mjs`: isolated localhost:3001 fixture-server tests for auth/origin/access/revision/empty-input rejection, provider failures, metadata, no-store and unchanged database content.
- Browser checked English/Chinese loading and previews, explicit acceptance, dirty state, discard, dismissal, stale acceptance blocked, unsaved notes retained on failure, desktop and 390px layouts.
- Screenshots `verification/ai-draft-fixture-desktop.png` and `verification/ai-draft-fixture-mobile.png` show simulated responses, not live GPT output or model-quality evidence.
- No temporary edits or fixture output were saved to Avery. The isolated fixture server was stopped. Main server uses the real adapter; a later user-supplied Gemini key enabled live checks.

The fixture preload under scripts/fixtures refuses to run without its explicit isolated-process settings. Never load it into the main demo server. Production source contains no mock-provider switch.

## Free-provider checks

The contract harness also covers Gemini/Groq authentication headers, minimal Chinese input, output schema, non-output thinking exclusion for Gemini, truncated result rejection and rate limits. These are injected-transport tests, not live output. Lint, typecheck and build passed after adding both adapters.

To run two fictional live smoke cases after adding a key: `node --conditions=react-server --env-file=.env.local scripts/try-draft-provider.cjs gemini` (or `groq`). The script checks for the selected key before any request, does not fall back to paid providers, and records only fictional inputs/results in docs/verification. Initial attempts for both providers reported missing keys and made no requests. This is a smoke test, not milestone C benchmarking.


## Live Gemini follow-up — 20 October 2026
The user configured a Gemini key in ignored local environment settings. Model-list access succeeded. Initial Gemini 3.8 Flash narrative requests timed out at 45 seconds, both at default thinking and low thinking; a tiny diagnostic request returned HTTP 503 UNAVAILABLE. Those failures are preserved in live-gemini-smoke-initial-timeout.json and live-gemini-smoke-low-thinking-timeout.json.

Gemini 3.1 Flash-Lite returned the two fictional smoke drafts in about 8.3 seconds (English) and 30.7 seconds (Chinese), with the expected JSON structure. It is now the provisional default. Gemini 3-series requests explicitly use low thinking to limit latency, based on the [official thinking guide](https://ai.google.dev/gemini-api/docs/generate-content/thinking). This is not a guarantee of response time.

See [readable live results](verification/GEMINI_LIVE_CHECK.md) and raw verification/live-gemini-smoke.json. The English output invented growing confidence and regular engagement; the notes did not establish those claims. Do not treat a successful API call as faithful output or teacher acceptance. Prompt quality checks remain milestone B, unchanged by this smoke test. No paid billing, provider fallback, commit or deployment was configured.


Live UI verification also succeeded on Avery's Chinese domain using all current observations, including collapsed/general notes. The proposed draft remained unaccepted; saved narrative was unchanged. Desktop and 390px checked, screenshots: verification/ai-draft-gemini-live-desktop.png and verification/ai-draft-gemini-live-mobile.png. The live Chinese result also used broad participation/accuracy language beyond the exact evidence; no quality gate is claimed. Contract tests, lint, typecheck and build passed after selecting Flash-Lite and low thinking. The key was never printed, committed or sent in a URL. No paid billing settings were changed.
