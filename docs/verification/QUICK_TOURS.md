# Quick tour verification — 22 October 2026

## Administration introduction spotlight correction

The three-section introduction now targets `.administration-nav-options`, a content-sized group inside the unchanged full-width navigation/divider. Live first-use tour verified on desktop: 3 buttons, 420px × 46px target within a 1206px row. At 390px the three equal-width buttons fit the 348px × 46px target, excluding the divider and lower padding. Screenshots: `tour-admin-intro-compact-desktop.png` and `tour-admin-intro-compact-mobile.png`.

Build and typecheck passed; lint had only the seven existing PDF-concept warnings. Verification used the localhost origin's separate onboarding storage, without resetting existing flags on 127.0.0.1 or changing seeded records. After interruption, restarted the existing local database stack without setup, reset or reseeding. Normal browser sizing restored. No commit/deployment.

## Current follow-up: first-time introductions and grouped statuses

The fifth My classes step highlights all four status links in one student's row. The desktop group measured 695px within a 954px row; the student name/ID stays outside it. At 390px the same four links form a 348px-wide two-column group, also excluding the name. Existing saved readiness remains visible (20 students and Avery 4/4 at verification).

First requested tours prepend an account-specific workspace introduction. Admin copy explains My classes and Administration; teacher copy explains only My classes. The first Administration guide also explains its three main tabs. Verified closing and reopening each admin intro repeats it; advancing acknowledges it. Switching Administration sections then starts the current workflow without repeating the intro. Verified teacher copy and absence of the Administration link at 390px. Teacher acknowledgement survives reload. Nothing starts automatically.

`NEXT_PUBLIC_TOUR_ONBOARDING_VERSION` versions only workspace/admin intro and welcome flags. Added exact deployment instructions to `../DEPLOYMENT_HANDOFF.md`, README and AGENTS.md: change only that setting for a fresh release introduction; preserve seeded database/auth/storage content and unrelated browser storage. No data reset/reseed, record edit, account recreation, file operation or deployment was performed for this follow-up. Sign-in/out was used only to verify roles, and the existing administrator session and normal viewport were restored.

Build/typecheck pass. Lint retains only the seven existing PDF-concept warnings. Evidence: `tour-four-statuses-desktop.png`, `tour-four-statuses-mobile.png`. Production-version reset instructions are documented; no production deployment was performed to test them.

## Current revision: one complete walkthrough per page

Replaced the topic picker and overlapping guides with a direct-start page walkthrough. My classes has 5 normal steps; portfolio 9; Classes 6; its Teachers subtab 2; Settings 3; student directory 6; teacher directory 5. Optional missing controls are skipped. Cards focus on one intention; the longest description observed across 23 recorded walkthroughs was 21 words.

Verified each main page and all admin subtab contexts at desktop (1280 × 800) and 390 × 844. Verified focused create class/student/teacher, student/teacher assignment, individual teacher access and additive bulk access guides. Teacher creation also checked on mobile. The main page guide opens immediately without a topic menu. An empty roster presents only its relevant steps.

Class-tab spotlight is 266px wide within a 954px divider; the divider and existing visual layout remain. Observation guidance targets Add observation instead of the whole panel. Native dialog help uses distinct fields, year/selection groups and action controls. Confirmations, navigation pickers and image previews have no redundant help buttons; the calendar, unsaved-change choices, credentials and photo-removal confirmation also omit help by catalog policy.

Build and typecheck pass. Lint has no errors and the same seven existing PDF-concept warnings. No business forms were submitted, no account/access changes applied, no observations saved and no AI/photo/PDF requests triggered by the guides. Cancelled all inspected forms and restored the normal browser viewport.

Evidence: `quick-tour-unified-walkthroughs.json`, `tour-unified-portfolio-mobile.png`, `tour-unified-classes-desktop.png`.

Limits: no live AI candidate was generated to exercise the alternate Use draft target; it is conditional on that real button being visible. Restore-students has no available archived demo record and was not exercised live. This revision did not repeat a teacher-account login or inject a server error; shared page guidance and server access rules are unchanged. No commit, push or deployment.

The sections below describe earlier versions and their checks; current guide structure is documented in `../QUICK_TOURS.md`.

## Follow-up: shorter My classes guidance

Removed sign-in guidance and its button. Removed the original Find a portfolio steps 1 and 4, leaving semester, class, search and student opening. Removed the whole-class search-total sentence and keyboard explanation. The student step highlights the name/ID region, and the readiness summary highlights its text block rather than the full-width header.

Verified the four-step populated-class tour on desktop (1280 × 800) and mobile (390 × 844), the shortened search/opening copy, and absence of sign-in tour buttons at both widths. Desktop student target measured 247px within a 954px row. The compact summary spotlight was visually checked; mobile popover fits the viewport. Screenshots: `tour-summary-compact-desktop.png`, `tour-find-portfolio-compact-mobile.png`. Build/typecheck pass; lint retains the same seven existing warnings. Earlier sign-in and six-step walkthrough records below describe the preceding version.

## Implemented

The plan and Driver.js research are in `../QUICK_TOURS.md`. One shared engine supplies optional page topics and inline dialog help. Teachers reuse the same My classes and portfolio guides as administrators; only administrators receive administration topics. No tour changes tabs, submits a form, generates a narrative, uploads/removes a photo or downloads a PDF.

The welcome invitation is optional and remembered per account in this browser. Every guide can be replayed. Progress, Back/Next/Done, Escape, focus restoration and reduced-motion settings use the installed Driver.js capabilities. Hidden/missing optional targets are skipped, and route/context changes dispose of the active guide.

## Browser checks completed

Production build at `127.0.0.1:3000`, desktop and 390 × 844 viewport.

- Administrator: My classes navigation and readiness; Classes Students, Teachers and Settings; school-wide Students and Teachers; Administration overview.
- Teacher: sign-in, optional welcome, My classes, Chinese portfolio overview and mobile student chooser. No Administration navigation or admin tour topics were shown.
- Portfolio topics: overview, observations, AI drafting with no generation request, photos/PDF without export. The AI guide explains Use draft even when no candidate exists.
- Dialog families: create class/student/teacher, add students/teachers, teacher class access, additive teacher bulk assignment, archive confirmation, calendar, class/student chooser, image preview/removal and unsaved changes. Forms were cancelled rather than submitted; Keep image preserved the photo.
- Unsaved guard: a temporary narrative edit was discarded after testing the dialog tour; returning showed the original saved narrative. Escape ended a dialog tour while preserving the dialog, and focus returned to its Quick tour trigger.
- Empty roster and empty portfolio class: guidance keeps the class in context and explains how to continue.
- Setup and unavailable page recovery guides. Unavailable page checked on desktop and mobile.
- Back/Next/Done, close/replay, Escape and trigger focus. Final readiness guide has all three steps on desktop and mobile. An initial `display:contents` target was replaced with the visible student row so its explanation is retained.
- Restored the browser's normal viewport and left the app signed in as the existing administrator. Docker had stopped between sessions; restarted the existing local stack without setup, reset or reseeding.

`quick-tour-walkthroughs.json` records titles from the resumed final-build walkthroughs, not every earlier check. Screenshots: `tour-my-classes-desktop.png`, `tour-portfolio-mobile.png`, `tour-teacher-dialog-mobile.png`.

## Build gates

- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: no errors; seven pre-existing warnings in PDF concept files.

## Explicit limits

- No new teacher account or archived student was created solely to test a tour. The credentials and restore-students variants are wired and typechecked, but their complete live dialogs were not exercised in this pass (there are currently no archived students).
- The error boundary guide uses the same recovery engine, but a server error was not deliberately injected. Setup and 404 recovery were exercised.
- Reduced motion and route/disappearing-target cleanup are implemented; this pass did not exhaustively test OS motion settings, every history-navigation case or other browsers.
- No live AI generation, uploads, account changes, portfolio save or PDF export was used as a tour action. This verifies guidance, not those services' availability.
- No commit, push or deployment was performed.
