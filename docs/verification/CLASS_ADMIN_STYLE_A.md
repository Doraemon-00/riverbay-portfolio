# Class administration Style A — 19 October 2026

Implemented the agreed annual class model and open directory interface. B/C are retained as future concepts. No automatic commit, push or deployment.

## Passed

- Lint, standalone typecheck and production build.
- Local access suite: annual class identity, same names in different years, both semester shells, invalid cross-year requests, atomic bulk assignment, ID/content/revision preservation through moves, student unassignment, student/class archive and restore, teacher revocation, class clearing, role escalation/direct writes denied, stale-save conflict and private storage isolation. All disposable fixtures removed by the test.
- Desktop administration: create class in a different year, create a student, select row, archive with confirmation, filter archived students, restore student, bulk-assign two teachers, inspect class settings. Temporary browser-created fixture removed afterwards without changing seeded people.
- 390px administration: class picker replaces sidebar; table and inline bulk actions fit; selection dialog fits; main clientWidth/scrollWidth both 375px (390px viewport including native scrollbar).
- Teacher sign-in: only K1 Willow appears; Semester 1 and 2 available; switching to S1 shows its 20-child roster; opening a portfolio and returning retains S1. Mobile semester controls fit.
- Quick-tour source unchanged. Its previous administration target selector is obsolete; tour revisions remain intentionally deferred per user instruction.

## Scope limits

No permanent deletion control, account invitation/staff creation, issued-PDF snapshot/history UI, CSV import or production deployment. First-run seed script was adapted and syntax checked; a fresh empty local stack was not reset/reseeded during this pass. Existing saved work was preserved.

Screenshots: class-admin-desktop.png and class-admin-mobile.png.

## Interaction refinement — 19 October 2026

- Reduced keyboard focus outlines from 3px / 4px offset to 2px / 2px; fields use a compact 1px outline. Search focus uses an inset border instead of a broad halo. Keyboard focus remains visible.
- Dropdowns use the Riverbay paper/mint palette and compact rounded menus in browsers supporting customizable native selects. Other browsers retain their native picker, with the themed closed control. Reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select
- Class and section switches retain enough detail height to prevent the browser clamping the current viewport when a long roster becomes a short teacher list. This reserves only the current viewport, rather than the entire previous roster height. Class/status switches share the same treatment.
- Dialogs restore focus without scrolling. Year and new-class navigation opt out of automatic scrolling. Domain/child links also opt out of automatic scrolling, and the shared workspace no longer restarts its entrance animation on pathname changes.
- Removed the redundant client router refresh after server action revalidation. Revalidation targets the admin, roster and portfolio pages rather than the root layout.
- Quick tour unchanged. No database schema changes in this refinement.

Verification: lint, production build and standalone typecheck pass. Checked production UI on desktop and at 390px; no horizontal overflow. Direct desktop section click retained scroll Y=236.67; mobile retained Y=378. Dropdown menus, dialog close and unchanged class-details save were exercised. Portfolio editor was checked in English/Chinese at desktop and Chinese at 390px. Browser viewport override reset.

Screenshots: admin-refinement-desktop.png and admin-refinement-mobile.png. Cross-browser picker styling beyond Chrome remains unverified. Changes remain uncommitted.
