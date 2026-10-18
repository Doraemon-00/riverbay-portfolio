# Riverbay learning portfolios

An internal teacher workspace for preparing learning portfolio content. Fictional demonstration data only. Foundation checkpoint, 18 October 2026; not yet the complete submission prototype.

## Implemented

- Next.js/React/TypeScript application with locally served fonts and icons.
- PostgreSQL migrations, Supabase password login and role-based admin/teacher pages.
- Admin assignment of existing teachers to classes by semester, access removal, and enrolment/transfer of existing fictional children. Enrolment creates a portfolio and its four domain entries atomically.
- Teacher roster for 20 children; four-domain editor; directly selected three-level ring or unassessed state; comments and manually editable narratives.
- Database persistence, explicit saving/error feedback and revision conflicts to prevent silent overwrites from stale tabs.
- Previous/next child retains the domain. Unsaved work prompts on in-app links, sign-out and page unload; browser history back/forward within the app is not yet covered.
- Same-year Semester 1 ring comparison in Semester 2. Narrow history function returns ratings only, including when the previous class differs. Incompatible scales are not compared.
- Row-level security for data and private photo storage. Upload UI is not yet connected.

Not implemented yet: AI drafting/checking, teacher final review, photo upload UI, PDF rendering/export, translation, final animal/floral artwork, cloud deployment, account invitations, new-child/class management and bulk import. The UI labels pending capabilities explicitly. No consumer chatbot or external AI receives data at this checkpoint.

## Run locally

Prerequisites: Node 22.13+ or a supported newer LTS, npm, and Docker Desktop with Linux containers running. The initial container download needs disk space and network access. Tested here on Windows with Node 22.11 (commands passed, but a dev dependency warns that it expects a newer patch); use the recommended version for fresh setup.

```powershell
npm ci
npm run db:start
npm run setup:local
npm run dev
```

Open http://127.0.0.1:3000. Local setup captures the local API configuration into ignored `.env.local`, creates an admin and two teacher accounts, and writes their shared local demo password to ignored `.demo-access.txt`. A new checkout generates a password unless `DEMO_PASSWORD` is supplied or the local access file already exists. Existing accounts and the current local password are preserved on reruns. It refuses non-local endpoints. It preserves an already populated fixture rather than resetting teacher work. Service-role credentials are used only in memory by the setup script; the web app environment contains only the URL and publishable/anon key.

Use `admin@riverbay.com` for assignments, `teacher@riverbay.com` for K1 Willow (20 children), or `teacher2@riverbay.com` for K1 Meadow (one child). Read the password from the local access file; do not publish it or environment files. The first three main-class children have fictional Semester 1 ratings in a different class to demonstrate history across class changes.

Stop the app with Ctrl+C. `npx supabase stop` stops this project's local stack and preserves its database backup. No reset is required for normal work. Local CLI development services are not a production hosting setup; use dummy data only.

## Verify

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:access
```

The access test uses the local seeded fixture. It checks blocked public registration, class isolation, denied anonymous reads, cross-class write denial, blocked direct entry writes and role escalation, revision conflicts, narrow Semester 1 access, assignment revocation, private storage access and admin class transfer. Transfers/assignments are restored in finally blocks. It performs a no-content-change save that increments a revision and uploads/removes one synthetic test PNG. It expects the seeded 20+1 class sizes. Do not run against live data.

Verified at this checkpoint: migration applied by local startup; fixture seeding; lint/typecheck/production build; access checks above; browser teacher/admin sign-in, English and Chinese saves, reload persistence, next/previous domain retention, prior rating rendering and admin enrolment submission. Screenshots are local under ignored `evidence/`. No production security certification, PDF test, AI evaluation, performance measurement or fresh-clone deployment claim.

`npm audit --omit=dev` found no runtime advisories at the checkpoint. Full audit reports five high-severity findings through ESLint/Next's dev tooling and the braces pattern parser; registry offers no patched braces release at the checkpoint. Do not apply the suggested framework downgrade blindly. Track this tooling dependency before submission; the generic static quality scanner does not replace npm audit or the access tests.

## Design and architecture

The earlier static visual draft is archived in [docs/design-study](docs/design-study/README.md), including its source and licensed assets. It is a historical reference, not the working application.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data relationships, access boundaries and output adapters. Canonical schema: [supabase/migrations/202610180001_foundation.sql](supabase/migrations/202610180001_foundation.sql).

The database holds content, independent of report layout. PDF generation will populate an HTML/CSS template from saved content; a viable future Canva integration can map the same content into prepared template fields. No Canva integration is implemented or required to run the editor.

Visual direction: Riverbay Preschool, Riverbank Garden, pastel marker illustrations and a beaver mascot. Current foundation uses the selected palette direction and ring progression; final decorative assets are pending. DM Sans files are from @fontsource/dm-sans 5.3.0 (OFL); Phosphor duotone sprite is from @phosphor-icons/core 2.1.1 (MIT). Licenses accompany assets in public/assets. Chinese currently uses system fonts; PDF font embedding remains pending. No real child photos or third-party school branding are included.
