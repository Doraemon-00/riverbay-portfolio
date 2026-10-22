# Quick tours

Updated 22 October 2026 after the user's review: one complete walkthrough per current page, with short, focused cards. No topic picker or separate overlapping overview tours. Sign-in has no tour.

## Content rules

- One intention per card, usually 15–25 words or fewer.
- Spotlight the relevant control or small group, not its whole panel. Class subtabs have a content-sized wrapper for their spotlight without shortening the navigation divider.
- Cover the normal working sequence. Labels, tooltips, confirmation copy and real error messages explain minor controls and exceptions.
- Preserve important consequences: saved-field readiness, immediate photo saving, retained portfolios, replacement versus additive class access.
- Do not repeat introductions in class subtabs or explain every possible future state.

## Current coverage

| Surface | Sequence | Normal steps |
|---|---|---:|
| My classes | Semester, class, search, open student/domain, readiness | 5 |
| Portfolio | Student search, domain/stamp, indicator, observation, AI draft, final wording, save, photos, PDF | 9 |
| Administration Classes / Students subtab | Year, class, add class, subtabs, add students, bulk selection | 6 |
| Class Teachers subtab | Add staff, remove access to this class | 2 |
| Class Settings subtab | Rename, archive/restore, clear grouping | 3 |
| Administration Students | Search, class/year filter, add student, bulk selection, assign/restore, archived records | 6 |
| Administration Teachers | Search, add account, individual access, additive bulk access, archive/restore | 5 |
| Empty class | Empty state and choose another class | 2 |
| Setup / recovery | Available next actions | 1–2 |

Counts adapt to visible controls. Empty/search-result states replace unavailable student steps with a short explanation. A missing optional target is omitted, never replaced by a broad unrelated panel. When an AI candidate is present, the final-wording step targets Use draft; otherwise it targets the narrative editor. Tours never generate a candidate to demonstrate this.

## Dialog help

Only forms with meaningful choices retain an inline Quick tour: create class/student/teacher, assign students/teachers, individual/bulk teacher class access, and restore students. Each uses 2–4 targeted steps. Hidden optional fields are not opened automatically.

Simple confirmations, unsaved-change choices, calendar, image preview/removal, credentials and student/class pickers have no separate tour. Their normal copy and controls explain the action.

## Engine and safeguards

`src/lib/quick-tours.ts` returns one guide for the visible page or class subtab. `src/components/quick-tour.tsx` launches it directly and dynamically imports Driver.js only on request. The optional first-visit My classes invitation remains, remembered per account/browser. Replay is available from Quick tour.

The first requested tour prepends a role-aware top-navigation introduction. The first Administration tour also introduces Classes / Students / Teachers. These introductions are remembered per account/browser only after advancing past their card. Closing early leaves the introduction available. Later replays contain the current workflow without repeated introductions. Teachers do not receive Administration guidance.

My classes readiness highlights all four domain statuses for one student, excluding the name/ID. Its base workflow remains five steps; first-use introductions add to the visible count.

Progress, Back/Next/Done, Escape/close, reduced motion, trigger focus return and scroll restoration remain. Native dialogs use the installed Driver.js popover-layer support. Escape closes a tour before it can cancel the underlying dialog. Route/context changes and missing active targets dispose of guidance. Responsive hidden duplicates and cached hidden pages are excluded.

Tour controls do not select tabs or records, fill forms, save edits, upload/delete photos, call AI or create PDFs. Guidance does not change permissions or replace existing server checks.

## Documentation reviewed before implementation

Installed Driver.js 1.10.2 types/runtime, plus official [configuration](https://driverjs.com/docs/configuration), [API](https://driverjs.com/docs/api), [interactive tours](https://driverjs.com/docs/interactive-tours) and [theming](https://driverjs.com/docs/theming). No new subscription or dependency.

See `verification/QUICK_TOURS.md` for checks and limitations. No commit, push or deployment requested.

Deployment agents must follow `DEPLOYMENT_HANDOFF.md`: bump only the onboarding version when resetting introductions; preserve all seeded records and files.
