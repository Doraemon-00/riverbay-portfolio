# Domain readiness stamps and control polish — 22 October 2026

## Applied

- Domain tabs reserve a 36px stamp space (32px on mobile): butter circle = saved indicator, animal = saved narrative, combined = both fields ready for PDF, empty = neither. Animals: English/beaver, Chinese/rabbit, Mathematics/squirrel, Social-emotional/bear.
- Readiness derives from saved ratings and nonblank saved narratives. The same helper drives the export panel. It is not a formal teacher-review flag; photos are not a completeness gate.
- Hover and keyboard focus expose a short missing-fields tooltip, also attached with aria-describedby. IDs include portfolio/current-domain to avoid collisions with Next's retained navigation pages.
- Warmer PDF headings and thank-you text replace the repeated domain-name list. A compact overall count explains the disabled export state. Orientation is hidden until complete; direct download is preserved.
- Calendar month/year and orientation controls use transparent borders and the existing mint/forest selection and hover colours. Keyboard outlines stay visible. Hidden orientation radio inputs no longer extend the page width. Radio groups use unique component IDs across retained navigation pages.
- Existing artwork was separated through the canonical build script, using the closed brown outline as a cut-out boundary. No new art generated; source rasters are unchanged. Four derived face WebPs adopted; asset README records exact paths and rebuild instructions.

## Verified

- npm run lint: zero errors; seven pre-existing warnings in docs/pdf-concepts.
- npm run typecheck: passed.
- npm run build: passed.
- Four saved-field combinations checked: only indicator + narrative enables export.
- Avery's complete saved portfolio: four combined stamps, orientation visible, Create PDF enabled.
- Casey's existing Chinese narrative-only entry: animal without circle; tooltip explains indicator missing. Keyboard focus shows tooltip.
- Bailey's incomplete portfolio: no stamp layers, 0 of 4 areas ready, disabled Create PDF, no orientation. Checked at desktop and 390px.
- Calendar month grid checked on desktop and 390px; no observation dates changed or saved.
- Orientation toggles correctly; selected fill rgb(213, 237, 223), transparent borders. At 390px, document width 380px within the 390px viewport; no horizontal overflow.
- Screenshots: readiness-ready-desktop.png, readiness-ready-mobile.png, readiness-partial-desktop.png, readiness-incomplete-mobile.png, calendar-soft-desktop.png, calendar-soft-mobile.png.
- Existing user/demo records were not edited. No AI calls or new PDF exports were needed for this UI change. Direct PDF download had been verified in the preceding task; backend unchanged here.

## Pending

User visual acceptance of stamps and messaging. Formal narrative review remains separate future work. Quick tour unchanged. No commit, push or deployment performed.

## Mint trial — 22 October 2026

User selected option D from the four-colour board for an app trial. Indicator base now uses existing mint #D5EDDF. Desktop base/face = 38/27px; mobile = 32/23px, matching comparison proportions. Readiness conditions and animal files unchanged. Design direction and asset README updated.

Verified computed colour and sizes, desktop and 390px layouts. Lint: no errors, seven existing PDF concept warnings. Typecheck and production build passed. Evidence: readiness-mint-desktop.png and readiness-mint-mobile.png. No commit or deployment; visual acceptance pending.


## Current checkpoint — 22 October 2026

Earlier sections record the sequence of visual trials, not the final UI contract. Current base is mint, 38px/27px desktop and 32px/23px mobile. The redundant PDF readiness sentence and sidebar 'Narrative drafts · not reviewed' label are removed. Sidebar numeric counts subsequently changed to ready-domain counts in the My classes readiness update; see MY_CLASSES_READINESS.md. Image confirmation buttons are transparent normally, with mint/red boxes only on hover or keyboard focus. No formal review step has been added. Latest relevant evidence: sidebar-clean-desktop/mobile.png, pdf-clean-status-desktop/mobile.png and photo-remove-buttons-desktop/mobile.png.

Commit checkpoint checks: local access/integrity suite and injected AI provider contract checks passed. A renderer extracted from committed Git files (without untracked concepts or local outputs) successfully generated a four-page portrait English/Chinese fixture. This proves the selected renderer's committed assets are present; it is not a full fresh-install or hosting test. Lint/typecheck/production build passed in the preceding UI verification; seven existing PDF-concept lint warnings remain. No additional live AI requests were made for the commit review.
