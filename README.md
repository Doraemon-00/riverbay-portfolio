# Riverbay learning portfolios

An internal teacher workspace for preparing learning portfolio content. Fictional demonstration data only. Local prototype checkpoint, 22 October 2026; hosting and final submission write-up remain pending.

## Implemented

- Next.js/React/TypeScript application with locally served fonts and icons.
- PostgreSQL migrations, Supabase password login and role-based admin/teacher pages.
- Annual classes with academic-year identity, class creation/renaming, bulk student and teacher assignment, student creation, unassignment, class clearing, and reversible class/student archiving. Both semester portfolios are prepared atomically; moves preserve saved content.
- Teacher roster for 20 children; four-domain editor; directly selected three-level ring or unassessed state; comments and manually editable narratives.
- Database persistence, explicit saving/error feedback and revision conflicts to prevent silent overwrites from stale tabs.
- Previous/next child retains the domain. Unsaved work prompts on in-app links, sign-out and page unload; browser history back/forward within the app is not yet covered.
- Same-year Semester 1 ring comparison in Semester 2. Narrow history function returns ratings only, including when the previous class differs. Incompatible scales are not compared.
- Row-level security for data, private photo uploads/placeholders and private PDF downloads.
- Optional dated/general observation timeline, editable AI draft suggestions and deterministic bilingual portrait/landscape PDF export.

Not implemented yet: school-specific AI guideline enforcement, formal teacher final review, translation, cloud deployment, account invitations and bulk file import. Configured cloud providers receive the fictional observation payload for drafting; names, student IDs and photos are excluded from the structured model payload, but teachers must still avoid personal details in free text.

## Run locally

Prerequisites: Node 22.13+ or a supported newer LTS, npm, and Docker Desktop with Linux containers running. The initial container download needs disk space and network access. Tested here on Windows with Node 22.11 (commands passed, but a dev dependency warns that it expects a newer patch); use the recommended version for fresh setup.

```powershell
npm ci
npm run db:start
node node_modules/supabase/dist/supabase.js migration up --local
npm run setup:local
npm run dev
```

Open http://127.0.0.1:3000. Local setup captures the local API configuration into ignored `.env.local`, creates an admin and two teacher accounts, and writes their shared local demo password to ignored `.demo-access.txt`. A new checkout generates a password unless `DEMO_PASSWORD` is supplied or the local access file already exists. Existing accounts and the current local password are preserved on reruns. It refuses non-local endpoints. It preserves an already populated fixture rather than resetting teacher work. Service-role credentials are used only in memory by local setup and disposable access-test fixtures; the web app environment contains only the URL and publishable/anon key.

Use `admin@riverbay.com` for assignments, `teacher@riverbay.com` for K1 Willow (20 children), or `teacher2@riverbay.com` for K1 Meadow (one child). Read the password from the local access file; do not publish it or environment files. The first three main-class children retain their fictional Semester 1 ratings. Annual migration reconciles the original demo’s differing semester class allocation to the latest recorded assignment. Later manual changes to demo assignments are preserved.

Stop the app with Ctrl+C. `npx supabase stop` stops this project's local stack and preserves its database backup. No reset is required for normal work. Local CLI development services are not a production hosting setup; use dummy data only.

## Verify

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:access
```

The access test authenticates the local demo accounts and creates isolated disposable fixtures. It checks annual names, both semesters, class isolation, denied anonymous/direct writes, role escalation, cross-year rejection, bulk atomicity, preserved portfolio IDs/content/revisions through moves, unassignment, archive/restore, teacher revocation, class clearing, stale-save conflicts and private storage. It removes only its own test records afterwards, preserving seeded and user-entered data. It refuses non-local endpoints. Do not run against live data.

Historical foundation verification (19 October): migration applied by local startup; fixture seeding; lint/typecheck/production build; access checks above; browser teacher/admin sign-in, English and Chinese saves, reload persistence, next/previous domain retention, prior rating rendering and admin enrolment submission. Screenshots are local under ignored `evidence/`. No production security certification, PDF test, AI evaluation, performance measurement or fresh-clone deployment claim.

`npm audit --omit=dev` found no runtime advisories at the checkpoint. Full audit reports five high-severity findings through ESLint/Next's dev tooling and the braces pattern parser; registry offers no patched braces release at the checkpoint. Do not apply the suggested framework downgrade blindly. Track this tooling dependency before submission; the generic static quality scanner does not replace npm audit or the access tests.

## Design and architecture

Standalone local-model feasibility evidence (19 October 2026): [dated-observation benchmark results](benchmarks/temporal/RESULTS.md). This tests fictional observations on local Qwen models; it does not connect AI to the application or establish production acceptance.

Future direction: [learning from teacher-approved portfolios](docs/MODEL_IMPROVEMENT_ROADMAP.md), including fine-tuning options and the current HuggingChat ML Intern workflow. Proposed research, not an implemented feature.

The earlier static visual draft is archived in [docs/design-study](docs/design-study/README.md), including its source and licensed assets. It is a historical reference, not the working application.

Proposed brand and asset direction (logo, tokens, type, illustration rules, interface states): [docs/DESIGN_DIRECTION.md](docs/DESIGN_DIRECTION.md). Concept artwork, transparent cut-outs, mark SVGs and token files: [docs/design-assets/riverbay/](docs/design-assets/riverbay/README.md). Selected assets are wired into the app; remaining concepts stay provisional.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data relationships, access boundaries and output adapters. Canonical schema: [supabase/migrations/202610180001_foundation.sql](supabase/migrations/202610180001_foundation.sql).

The database holds content, independent of report layout. PDF generation populates an HTML/CSS template from saved content; a viable future Canva integration can map the same content into prepared template fields. No Canva integration is implemented or required to run the editor.

Proposed PDF content and page structure: [Portfolio PDF baseline](docs/PORTFOLIO_PDF_BASELINE.md). This is a recommendation awaiting layout review, not a final template.

Domain photo import now supports private uploads, labelled demo placeholders, previews and removal: see [photo import](docs/PHOTO_IMPORT.md) for scope, storage behaviour and verification. Both portrait and landscape export are connected; see the runtime requirements below.

Visual direction: Riverbay Preschool, Riverbank Garden, pastel marker illustrations and a beaver mascot. Current foundation uses the selected palette direction and ring progression; the sign-in illustration is applied and report artwork remains provisional. DM Sans files are from @fontsource/dm-sans 5.3.0 (OFL); Phosphor duotone sprite is from @phosphor-icons/core 2.1.1 (MIT). Licenses accompany assets in public/assets. Nunito and Noto Sans SC variable fonts are bundled locally; The selected PDF renderer bundles Chinese fonts; both orientations have been checked with fictional bilingual content. No real child photos or third-party school branding are included.


### Riverbay visual foundation

The local app now uses the selected Riverbay logo, colour tokens, Nunito/DM Sans/Noto Sans SC typography, segmented learning rings and a login welcome illustration. Quick tour starts one optional walkthrough for the current page, with short cards and inline help only for complex forms (see `docs/QUICK_TOURS.md`). Motion respects reduced motion. See `docs/APP_STATES.md` and the asset README for scope and asset provenance. AI drafting, private photo upload and PDF export are now connected. Translation and a formal review workflow remain subsequent milestones.

Deployment handoff: read [docs/DEPLOYMENT_HANDOFF.md](docs/DEPLOYMENT_HANDOFF.md). Reset only tour onboarding with `NEXT_PUBLIC_TOUR_ONBOARDING_VERSION`; preserve all seeded data, accounts and files. Do not reset/reseed the database or clear browser storage for this purpose.


### Annual class administration (Style A)

The administrator workspace now manages annual classes, bulk student and teacher assignment, student creation, unassignment, reversible archiving and clearing class groupings without deleting portfolios. Teachers choose the portfolio semester on My classes. See [docs/CLASS_ADMINISTRATION.md](docs/CLASS_ADMINISTRATION.md) for migration, retention and access behaviour. Existing local checkouts must apply pending migrations with `node node_modules/supabase/dist/supabase.js migration up --local`; do not reset saved data.

### Administration directories

The administration workspace now has Classes, Students and Teachers sections using the same search, bulk selection and dialog patterns. Apply migration `202610190003_people_directory.sql` to an existing local database with `node node_modules/supabase/dist/supabase.js migration up --local` (do not reset).

Students have permanent readable IDs and can be found/restored school-wide. Teacher account archiving is enforced by the app and database policies; assignment management covers both semesters of each class year. Invitations and password administration are deferred. Run `npm run test:directory` for the focused local security/integrity suite. See [class administration](docs/CLASS_ADMINISTRATION.md) for restore semantics and prototype limits.

### Add teacher setup

Add teacher now creates a working demo account with optional class access. All demo staff accounts use `teach2LEARN`, including newly added teachers; credentials are shown to the administrator; no email is sent. Email invitations, forced password changes/expiry and password resets remain future work.

Apply `202610200001_teacher_provisioning.sql` with the normal local migration command. Run `npm run setup:local` to configure the server-only local `SUPABASE_SERVICE_ROLE_KEY` while preserving existing records/passwords and unrelated environment values. Hosted deployments must set their own server-only key. Never expose it with a `NEXT_PUBLIC_` prefix. Run `npm run test:teacher-setup` for provisioning checks using disposable local accounts.

## Deliberately deferred work

See [Deferred features](docs/DEFERRED_FEATURES.md) for the consolidated decisions and revisit conditions, including keeping administrators separate from teaching roles in this prototype.

## My classes workspace

The teacher roster now follows the open class-directory layout, with direct domain links, name/ID search, responsive student rows and navigation memory. See [My classes](docs/MY_CLASSES.md) and [verification](docs/verification/MY_CLASSES.md).

## Portfolio student navigation

Portfolio editors include a searchable student sidebar/mobile picker, ready-domain counts and Save/Discard/Stay protection for in-app navigation. See [portfolio navigation](docs/PORTFOLIO_NAVIGATION.md) and [verification](docs/verification/PORTFOLIO_NAVIGATION.md) for scope and browser-history limits.

Observation timeline behaviour and storage: [docs/OBSERVATIONS.md](docs/OBSERVATIONS.md).

AI drafting setup, behaviour and verification: [docs/AI_DRAFTING.md](docs/AI_DRAFTING.md).


## Current editor and export checkpoint — 22 October 2026

- Optional dated/general observations, editable AI draft suggestions, manual indicators and narratives, private photo uploads/placeholders, and direct PDF download are connected.
- Gemini is the locally verified development provider. OpenAI and Groq adapters have transport contract checks; their live availability/output are not verified. Model output needs teacher checking; no school-specific guideline enforcement or production quality acceptance is claimed.
- Domain stamps describe saved fields: mint base = indicator, animal = narrative, both = export-ready fields. There is no formal review flag in this workflow. The student sidebar count describes domains with both required saved fields, matching My classes readiness; it does not assert formal review.
- Apply pending migrations with `node node_modules/supabase/dist/supabase.js migration up --local`; do not reset existing records.

### PDF runtime and limits

The app calls the selected renderer under `docs/pdf-concepts/claude/`. Keep its template, schema, tools and assets with the app. Locally, Node.js 22+ and a separately installed Chromium browser are required; set `CHROME_PATH` if automatic detection fails. On Vercel the export uses the bundled `@sparticuz/chromium` instead (see [deployment handoff](docs/DEPLOYMENT_HANDOFF.md)). `PDF_RENDERER_DIR` optionally overrides the renderer directory. Generated concept PDFs and previews are ignored and can be reproduced with the renderer's commands.

Exports read saved text and private photos, preserve Chinese text, and store the PDF in the private `portfolio-exports` bucket with a ten-minute signed download link. Each domain currently allows at most four photos in the PDF. The prototype keeps only the newest export for each portfolio; it does not retain an immutable issued-report history. Production evidence retention/versioning remains a separate decision.

The Vercel packaging has been rendered on the AWS Lambda Node 22 image (Amazon Linux 2023) from the traced files only; it still needs confirming on the real Vercel deployment, including request duration and memory. Provider keys belong in ignored local environment files or server environment settings, never source control. Only fictional data is authorised for the current demo.

### Verification at this checkpoint

Lint has no errors and seven existing warnings in PDF concept tooling. Typecheck and production build pass. Recent UI changes were checked on desktop and 390px; recorded scenarios/screenshots live in `docs/verification/`. Access and draft contract checks have separate scripts; earlier benchmark output is synthetic feasibility evidence, not matched API benchmarking or school acceptance. No deployment or production security certification is implied.
