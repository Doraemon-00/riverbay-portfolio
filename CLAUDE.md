@AGENTS.md

# Riverbay portfolio: working notes for Claude

Riverbay Preschool is a fictional school for a paid prototype (the real client is Peterhouse). Fictional names and placeholder images only; never add real children's data or photos.

## Where things are

- Status, local setup and checks: `README.md`. Architecture and access rules: `docs/ARCHITECTURE.md`. Deliberately postponed work: `docs/DEFERRED_FEATURES.md`.
- Hosted demo: https://riverbay-portfolio.vercel.app (Vercel Hobby, `sin1`) on the Supabase project `riverbay-demo` (Singapore). Setup and environment variables: `docs/DEPLOYMENT_HANDOFF.md`.
- PDF export: `src/lib/pdf/export.ts` runs the renderer in `docs/pdf-concepts/claude/` (template, tools, assets). On Vercel it uses the bundled `@sparticuz/chromium` with `--disable-dev-shm-usage`; without that flag longer reports fail to print.
- Approved loading and swim motion, not yet wired in: `docs/design-concepts/motion/`, frames in `public/assets/riverbay/motion/`.

## Cloud sessions (no local machine)

- There is no Docker, so the local Supabase stack cannot run here. Check changes with `npm run lint`, `npm run typecheck` and `npm run build`.
- To see a change running, push a branch: Vercel builds a Preview deployment with its own URL. Previews use the same hosted fictional demo database as production, so test with care and never reset, reseed or bulk-edit it.
- Production deploys from `codex/riverbay-foundation`. Work on a separate branch and merge only when the user asks.
- Never run `scripts/setup-local.mjs`, `scripts/copy-demo-to-hosted.mjs` or the access test scripts against the hosted project.

## Rules

- Never commit `.env*`, `.demo-access.txt` or any key. Provider keys stay server-only; never prefix secrets with `NEXT_PUBLIC_`.
- Commit and push only when the user asks.
- Write user-facing text without em dashes.
