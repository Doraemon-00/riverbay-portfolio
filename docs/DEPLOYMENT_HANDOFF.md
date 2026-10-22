# Deployment handoff

## Hosted demo: Vercel + Supabase (fictional data only)

The shared demo runs on Vercel Hobby (region `sin1`, set in `vercel.json`) with a free Supabase project in Singapore. Hobby is for non-commercial use; this is a fictional demo.

### PDF export on Vercel

Vercel has no installed browser. On Vercel (`VERCEL` is set), the export adapter starts the bundled `@sparticuz/chromium` and passes its executable and flags to the renderer (`CHROME_PATH`, `CHROME_ARGS`). `next.config.ts` ships the renderer's `tools/*.mjs`, `template/` and `assets/` plus the Chromium package with the PDF route, and leaves out art sources, generated output and fixtures (about 97 MB traced; the limit is 250 MB). Local development keeps using the installed Chrome. Set `PDF_BUNDLED_CHROMIUM=1` to force the bundled path on another Linux host.

The adapter adds `--disable-dev-shm-usage`. Serverless `/dev/shm` is tiny, and without the flag the first live export timed out: on the Lambda image with Vercel's limits (2 GB, 1 CPU), six-page portrait reports failed with "Printing failed" or stalled in most runs, while three-page reports passed. With the flag, 10 of 10 full reports printed. Each DevTools command now has a 60-second deadline, a wedged browser is killed on close, and the export stops the renderer after 100 seconds, so a failure returns a message instead of a gateway timeout.

Verified 22 October 2026 on the AWS `nodejs:22` Lambda image (Amazon Linux 2023, as on Vercel) with `VERCEL=1`, using only the traced files on a read-only mount: both orientations of the Avery sample rendered (about 1.1 s to unpack Chromium, then about 1.6 s per PDF), with only the bundled DM Sans, Nunito and Noto Sans SC fonts embedded. Not yet verified on a real Vercel deployment.

### 1. Supabase project

1. Create a project in region **Southeast Asia (Singapore)**. Keep the database password in a password manager.
2. Authentication → Sign In / Providers: turn off **Allow new users to sign up**. Accounts come only from the copy below and from Add teacher.
3. Authentication → URL Configuration: set the Site URL to the Vercel production URL once it exists.
4. Link and apply the migrations from this folder:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

5. Copy the local fictional demo into the empty project. Create ignored `.env.hosted` with `HOSTED_SUPABASE_URL` and `HOSTED_SUPABASE_SERVICE_ROLE_KEY` (the project's secret key), check the local source first, then copy:

   ```bash
   node scripts/copy-demo-to-hosted.mjs --dry-run
   node --env-file=.env.hosted scripts/copy-demo-to-hosted.mjs --confirm <project-ref>
   ```

   It refuses a non-empty target, keeps account and record IDs, gives every account the shared demo password, renumbers generated student/staff codes in the same order, and copies photo files. Exported PDFs are not copied.

### 2. Vercel project

Import the GitHub repository. The default branch deploys as production. Node 22 comes from `package.json` `engines`. Environment variables (Production and Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service role) key. Server-only; used by Add teacher. Never prefix with `NEXT_PUBLIC_`. |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Free-tier key; fictional notes only |
| `NEXT_PUBLIC_TOUR_ONBOARDING_VERSION` | A new value per release, for example `2026-10-demo-1` (see below) |

### 3. After the first deployment

Sign in as each demo account, open a portfolio, save an observation, upload a photo, draft a narrative and export both PDF orientations. Check the PDF function's duration and memory in the Vercel logs. The drafting rate limit is held in memory per function instance, so it is approximate on Vercel.

## Reset tour onboarding only

### Required for the demo deployment

Before the deployment build, set `NEXT_PUBLIC_TOUR_ONBOARDING_VERSION` to a new value for that release, for example `2026-10-demo-1`. This public value is compiled into the browser bundle, so rebuild/redeploy after changing it. Keep it stable across ordinary builds unless a fresh introduction is deliberately required.

**Reset only the tour onboarding indicators. All existing seeded data must remain.**

The setting changes the browser-storage namespace used by first-time workspace and Administration introductions and the welcome invitation. Existing users see those introductions again when they request a tour. Nothing auto-starts. New accounts/browsers already start fresh. Production and localhost have separate browser storage.

### Do not reset anything else

- Do not run `supabase db reset`, reseeding scripts, setup/account-recreation scripts or photo replacement scripts to reset tours.
- Preserve seeded children, teachers, accounts, annual classes, assignments, semester portfolios, ratings, observations, narratives, photos, generated PDFs and storage objects.
- Do not clear database tables, authentication users or buckets.
- Do not call `localStorage.clear()` or `sessionStorage.clear()`. Sign-in sessions, navigation memory and unrelated preferences are not part of this reset.

No database migration or data cleanup is needed for this setting. Old onboarding keys are harmless and are ignored by the new version. There is no need to delete them.

### Exact scope

Keys are generated by `src/lib/tour-onboarding.ts`:

`riverbay:tour-onboarding:<version>:<viewer-id>:<part>`

`part` is only `workspace`, `administration` or `welcome`. Introductions are acknowledged after advancing past their card, not on open or close. The welcome invitation has its own explicit dismissal/start preference in the same versioned namespace. Teachers never receive the Administration introduction.

### Check after deployment

1. Sign in with an existing seeded administrator. Request Quick tour: the top-navigation introduction should appear. Close immediately and reopen: it should still appear. Advance past it: later replays should start with the page workflow.
2. Request the first Administration tour: its three-section introduction should appear once, then the current section's workflow. Switching sections should not repeat an acknowledged introduction.
3. Check a teacher account: its introduction mentions only My classes, and Administration is absent.
4. Verify seeded class/student counts and a known saved portfolio/photo remain intact. A tour reset is not authorization to alter demo records.

This note documents a future deployment step. It does not authorize deployment, sharing, commits or credential changes.
