# My classes verification — 20 October 2026

- Lint, production build and typecheck passed.
- Verified in a real teacher session (Jamie Lee), showing only assigned classes; no admin link in navigation.
- Desktop: open class directory, full four-domain roster, IDs, draft summary and clickable statuses. Existing saved Avery narratives appear as Draft available, not reviewed.
- Switching S2 → S1 → S2 retains K1 Willow. Class selection/semester use URL identifiers without page reload.
- Search by student ID resolves Avery; unmatched search shows an actionable empty state.
- Opened Taylor Chinese directly; Previous opened Sage Chinese in the same class/semester. Back restored K1 Willow S2, search `a`, and scroll at 1238px. No portfolio content was modified.
- At 390px, class dropdown and two-column domain links fit inside the viewport: document width 380px within 390px; domain links span x16–185 / x195–364. Name/ID/Open stay accessible without horizontal scrolling.
- Screenshots: `my-classes-desktop.png`, `my-classes-mobile.png`.
- Viewport restored to desktop and full roster. Quick-tour source unchanged. No commit/push/deploy.

## Follow-up: whole-row links, hover and class-switch scroll

- Lint, production build and typecheck passed.
- Found unconditional storage-key restoration on explicit class switches, explaining jumps to an old saved bottom position. Administration also shifted as roster heights changed; disabling browser anchoring stops the normal-pointer shift.
- Clicked whitespace in Avery’s row: default portfolio opened. Chinese domain link still opened Chinese directly. Enter on the semantic row link opened the default portfolio. No separate Open button remains.
- Returning from Taylor restored search `a` and scroll1294px. A subsequent normal pointer click Meadow→Willow held scroll at9.33px instead of restoring1294px.
- Administration normal class switching held its205.33px position after the anchoring change. Playwright locator clicks can scroll targets themselves; final stability checks used normal pointer clicks.
- At390px the row fits x16–364 within390px viewport, with four independent domain links; document width380px. No horizontal overflow.
- Screenshots: `my-classes-row-desktop.png`, `my-classes-row-mobile.png`. Desktop restored, no original data changed. Quick tour untouched. No commit/push/deploy.

## Commit checkpoint: remove row arrow

- Removed decorative row arrow and its reserved desktop column. Verified zero icons in the student row and four domain links retained.
- Lint, build and typecheck passed. Checked desktop and390px; final screenshots: `my-classes-final-desktop.png`, `my-classes-final-mobile.png`.
- Verification used a separate tab to preserve the user’s open portfolio; temporary tab closed and viewport restored. No data/credential changes.
