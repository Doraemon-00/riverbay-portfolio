# Future direction: learning from teacher-approved portfolios

Research checked 19 October 2026. Proposal only: no training, training-data collection feature, Hugging Face account connection, upload, compute purchase or deployment has been implemented by this research. The application remains separate from the standalone synthetic benchmarks.

Jun Song confirmed that fine-tuning and HuggingChat ML Intern should remain potential future directions, outside the current prototype milestone. Neither is a selected provider, dependency or commitment to implement.

## Purpose and current evidence

Teacher-approved drafts could provide examples for adapting a model to the school's writing style and reducing editing effort. Fine-tuning builds on an existing model; it does not require training a foundation model from scratch. It also does not guarantee factual accuracy or replace teacher review.

Qwen3.5-9B is a potential local candidate. Local task screening demonstrated useful bilingual chronological connections and inference on an 8 GB GPU. The warm-style rerun also exposed unsupported claims, qualifier loss and tone failures; GPT drafts had fewer flagged issues but were not error-free. Neither warm configuration passed the proposed critical-faithfulness gate. See [warm benchmark findings](../benchmarks/temporal/WARM_STYLE_RESULTS.md). Fine-tuning has not been tested and is not claimed to solve those errors.

## Preserve useful examples before considering training

For a deliberately reviewed candidate example, retain a versioned relationship between:

- The exact eligible teacher observations, observation dates, ratings and rating definitions, domain, language and report coverage available at generation time.
- The trusted wording-guide/prompt version, model/version and generation configuration.
- The original candidate narrative and the final approved narrative.
- Approval provenance and the distinction between wording edits and newly supplied factual evidence. Optional correction categories can be introduced if useful without burdening routine teacher work.

The initial supervised training pair would be **supported evidence and instructions → approved narrative**. The original draft can support error analysis and, later, carefully curated preference pairs. It need not become an extra inference input for ordinary drafting. Do not treat every save, unreviewed AI output or teacher edit as automatically correct training data, and do not update a live model after every save.

Important example: if notes merely record story sharing, a teacher's edited output that adds confidence and picture support contains new facts. Add and validate that evidence before using the pair for training; otherwise it could reward the model for inventing those details. Preference comparisons also require the same factual basis, not an original response and a revised response supplied with different information.

Training-data collection is a future design task, not permission to retain all child text indefinitely. Any future implementation needs explicit access, retention, provenance and training-use decisions.

## Training approaches and providers

| Route | Possible use | Decision still needed |
|---|---|---|
| Qwen with Unsloth / Hugging Face training libraries | Pilot supervised tuning using LoRA/QLoRA where supported; export a tested custom checkpoint/adapter into the local-serving workflow. | Exact base checkpoint, supported trainer/version, hardware, licence obligations and post-export quality. |
| Alibaba Cloud Model Studio | Managed supervised tuning. Current Singapore documentation lists Qwen3.5-9B for full and efficient training. | Contractual processing locations, training/inference/log/storage coverage, exportability and ongoing hosting cost; a Singapore entry alone is not an end-to-end residency guarantee. |
| HuggingChat ML Intern | Assist with preparing an experiment, writing/running training code and evaluating artifacts on Hugging Face infrastructure. | Dataset readiness, account/artifact ownership, restricted permissions, approved budget and all processing locations. Not evaluated here. |

Qwen3.5-9B's published licence is Apache 2.0. A custom version remains subject to its base licence; managed services have their own terms. Training hardware is different from inference hardware: Unsloth lists about 22 GB for its 9B bf16 LoRA configuration, with other configurations requiring their own measurement. Our 8 GB inference result is not a training-capacity claim. [Qwen model card](https://huggingface.co/Qwen/Qwen3.5-9B), [Unsloth guide](https://unsloth.ai/docs/models/qwen3.5/fine-tune), [Alibaba supported tuning models](https://www.alibabacloud.com/help/en/model-studio/model-training-overview).

OpenAI's direct fine-tuning documentation currently says its platform is winding down and not accepting new users; do not assume it is a new-project fallback. This does not describe all third-party hosting arrangements, which need separate verification. [Official documentation](https://developers.openai.com/api/docs/guides/supervised-fine-tuning).

## Hugging Face ML Intern: assessment

The current supported entry is ML Intern mode in HuggingChat. It can plan experiments, prepare datasets, run fine-tuning/evaluation and produce Hub artifacts. Jobs/sandbox compute and agent-model inference have separate billing; its conversation compute budget is not an all-services spending cap. Documentation also distinguishes billing ownership from where repositories/Spaces are created. Review artifact ownership and privacy before use. [Current guide](https://huggingface.co/docs/chat-ui/ml-intern/getting-started).

The older huggingface/ml-intern repository is archived and points users to HuggingChat. Do not follow its historical CLI instructions as the maintained setup. [Repository status](https://github.com/huggingface/ml-intern).

Running Chat UI locally still uses remote inference and launches account-backed Hugging Face jobs in the documented setup. A local interface does not establish local-only processing. Singapore-only processing across the agent, compute, datasets, logs and checkpoints has not been verified. [Local setup guide](https://huggingface.co/docs/chat-ui/ml-intern/local-development).

Assessment: suitable to investigate as development assistance for a bounded synthetic-data training pilot. We still own the definition of good feedback, source fidelity, train/test separation and the deployment decision. An agent completing a job or showing a lower training loss does not establish useful classroom writing.

## Suggested future sequence

1. Confirm the wording guide and approval process; retain useful examples only under an approved data policy.
2. Curate consistent English/Chinese examples across domains, ages and support levels. Deduplicate repeated versions; keep development/evaluation children or cohorts separate so the same child's near-identical notes do not leak into both sets.
3. Start with supervised fine-tuning, then consider preference tuning only if reliable same-input comparisons justify it. Original generated drafts are not automatically legitimate rejected examples.
4. Run a bounded pilot on fictional or genuinely anonymised material first. Fix the dataset, compute budget, baseline and held-out tests before training. Review scripts, saved configurations, checkpoints and all failures.
5. Compare base versus tuned model for factual support, frequency/context preservation, language quality, guideline adherence, teacher editing effort and latency. Check both languages independently. Reject a style improvement that increases unsupported claims.
6. Version and approve any release, preserve rollback, and repeat evaluation after quantisation/export. Keep changing pupil facts in the application data, rather than trying to teach the model individual children's histories.

For scale illustration only, 120 children × four domains × two semesters gives 960 candidate domain examples per year before exclusions. Repeated children and similar templates reduce diversity; volume alone is not a training-readiness threshold.

## Privacy and ownership

Have the school's DPO assess training reuse, relevant notifications/consent or applicable exceptions, minimisation, retention and provider contracts. Permission to prepare a report should not be assumed to cover model development. Removing names alone may leave identifiable contextual information; models/checkpoints also need protection. PDPC's GenAI guidance addresses reuse for model development, anonymisation and subsequent personal-data requests. [PDPC guidance, issued 20 July 2026](https://files.app.optical.gov.sg/pdpc/production/assets/143cb9d4-532e-4cca-9a77-bcc0415ca294.pdf).

The prototype uses fictional data only. This roadmap does not authorise uploading pupil information, granting agent permissions, publishing artifacts or spending on compute.
