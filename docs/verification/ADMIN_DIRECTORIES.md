# Administration directories verification — 19 October 2026

## Changes

- Persistent Classes / Students / Teachers navigation with the existing open Riverbay directory styling. No extra landing page; each section retains search, filter and selection state while switching.
- Student references, name/ID search, global Active / Archived / All records, add/assign/archive/restore and explicit optional class assignment on restoration.
- School-wide teacher directory, class-access checklist per academic year, activation/deactivation with confirmation, and protection against discarding unsaved class selections by switching years.
- Compact mobile name/ID/status/class summaries keep Restore and Manage classes visible without horizontal scrolling.
- Local migration 202610190003_people_directory.sql applied without reset; prior student/portfolio data retained. Quick tour untouched.

## Gates

- ESLint: pass.
- Production build: pass.
- Standalone TypeScript check after build: pass.
- git diff --check: pass (line-ending normalisation notices only).
- Existing annual access suite: pass.
- New directory integrity/access suite: pass, including active-token read/write/private-storage denial after teacher deactivation, rejected self-reactivation/teacher-admin targets, unique stable IDs, cross-year restore without stale access, explicit reassignment and preservation of history/content.

## Browser checks

Production server at http://127.0.0.1:3000.

- Desktop: three sections, student/teacher directories, class workspace, create student unassigned, generated ID, name and ID search, selection/archive confirmation, Archived filter, restore & assign, resulting class membership, teacher class-access dialog and save with unchanged assignments.
- 390px: all three sections, student ID search, preserved search across section switches, Active/Archived and Active/Inactive filters, archived student restore dialog (cancelled), teacher assignment picker, dirty selection locks year until save/cancel, deactivation confirmation (cancelled), and no horizontal page overflow (390px viewport / 375px content including scrollbar allowance).
- Temporary viewport override reset. Teacher activation/deactivation and storage revocation were exercised with an isolated disposable auth account through the access suite; existing staff accounts were not deactivated during browser checks.
- Disposable browser-created student Directory UI Check 1019, ID RB-000027, and its generated semester shells were removed after verification. Existing user-added class/student records retained. Test suites clean only their own fixtures.

## Screenshots

- admin-students-desktop.png
- admin-teachers-desktop.png
- admin-students-mobile.png
- admin-teacher-access-mobile.png (shows a temporary unsaved selection; it was cancelled)

## Deferred

Account invitations/creation/password resets, domain-specific staff permissions, full student history/profile screen, pagination for growth beyond API row limits, issued PDF snapshots and a dedicated audit-event UI. Prototype admin assignment edits use last successful save; concurrent-edit version checks remain future work. Previously issued signed object links, if introduced later, require short expiry.

No commit, push, deployment or external sharing was performed.

The inactive-account login message was also inspected at desktop and 390px without submitting credentials; no horizontal overflow. The temporary preview tab was closed and viewport reset.
