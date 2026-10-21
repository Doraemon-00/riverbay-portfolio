# Portfolio navigation verification — 20 October 2026

## Gates

Lint, production build, typecheck and diff whitespace checks passed.

## Functional verification

Disposable local class/two students in year2194 were used for changes; existing portfolios were read only.

- Editing observations then selecting another student opens Save your changes.
- Stay preserved exact typed observations. Switching domain also opened the same guard.
- Discard moved to Chinese; returning to English showed the saved baseline instead of discarded text.
- Save and continue persisted observations/narrative, moved to the next student, and sidebar draft count changed from0/4 to1/4. Persistence independently asserted through the local database.
- Advanced the second disposable entry revision externally, then tried Save and continue: the conflict message appeared, URL remained on the current English entry, and typed text remained. Database verification confirmed the concurrent revision/comment was not overwritten.
- Mobile picker links triggered the same guard. After navigation the picker closed, and reopening retained the search.
- In the real20-student fictional class, selecting Taylor from Avery preserved Chinese. Sidebar scroll retained846px across student navigation.
- Mobile picker at390×844 measured347×705px, with visible close/search/list controls. Desktop uses the sidebar; mobile uses Choose student and keeps Previous/Next.
- Unique textarea/label/dialog IDs verified through successful accessible-name lookup after student changes.

All temporary children, entries, portfolios, enrolments, memberships, class and newly created periods were removed after assertions. No original reports or credentials changed. Browser viewport restored to desktop.

## Screenshots

- `portfolio-student-sidebar-desktop.png`
- `portfolio-student-picker-mobile.png`
- `portfolio-unsaved-conflict.png`
- `portfolio-unsaved-mobile.png`

## Limits

Guard covers application links/forms plus native unload warnings; SPA browser Back/Forward and recoverable unsaved drafts are not implemented. Quick tour unchanged. No commit/push/deployment.

## Follow-up: student navigation glitch

- Moved the shared authenticated workspace shell to `src/app/portfolio/layout.tsx`, retaining it across student navigation. The page still checks viewer access on each data request.
- Replaced after-paint sidebar restoration with before-paint restoration, including filtered list scroll and picker closure. Ignore hidden-list scroll events.
- Repeated Next from Casey to Dylan: heading position held263.45px, document scroll0px and shell transform remained none.
- Filtered sidebar search `a` retained574px list scroll when selecting Taylor. A normal pointer switch to Sage retained document scroll511.33px and list scroll574px; Chinese stayed selected.
- Mobile picker still opens/closes correctly; entering temporary unsaved text then choosing Taylor showed the same Save/Discard/Stay guard. Discard completed navigation and closed dialogs. No report changes were saved.
- Lint, build and typecheck passed. Desktop/390px checked, viewport restored. Screenshots: `portfolio-navigation-stable-desktop.png`, `portfolio-navigation-stable-mobile.png`. No commit/push/deploy.

## Follow-up: class arrows/picker, locate and button consistency

- Class arrows: Willow→Meadow retained Chinese/Semester2; first-class Previous disabled. Returning Meadow→Willow restored Bailey, the last visited student in Willow.
- Clicking the class heading opens the class picker, including empty classes. Selecting empty K2 Daisy from mobile opened its My classes roster, Semester2, with the existing empty-state explanation.
- Show current student appeared when the list scrolled to868.67px; it returned Bailey into view. Filtering to Taylor then locating Bailey cleared the filter and restored the active row.
- Unsaved temporary observations were intercepted through desktop class arrows and mobile class dropdown. Stay kept the editor; Discard continued to the intended class without saving the temporary text.
- Unsaved dialog buttons measured46px height with10px corners. Mobile stacks primary, Stay, Discard. Hover surfaces are explicitly defined for secondary/danger/primary controls.
- Access suite passed, along with lint (no warnings), production build, typecheck and whitespace checks. Existing reports unchanged; access suite cleaned its fixtures.
- Screenshots: `portfolio-class-navigation-desktop.png`, `portfolio-class-navigation-mobile.png`, `unsaved-buttons-standard-desktop.png`, `unsaved-buttons-standard-mobile.png`.
- Quick tour unchanged; browser Back/Forward limitation unchanged. No commit/push/deploy.

## Empty class workspace
- Verified Willow → empty Daisy → populated Lily using class arrows, retaining Chinese and Semester 2.
- Empty class stays under the shared portfolio layout; no editor, student search or student Previous/Next controls.
- Returning to Willow restores Bailey, the last visited student.
- At 390px, Choose class opens the class dropdown; selecting Willow closes the dialog and restores Bailey/Chinese.
- Desktop and 390px screenshots: portfolio-empty-class-desktop.png and portfolio-empty-class-mobile.png.
- Lint, build, typecheck and access regression suite passed. No demo records modified.

### Empty-class jump regression
Reproduced the prior collapse: scrollY 474.67 became 0 and main height 1351 became 497 on Willow → Daisy. With the shared height reservation, main height stays 1352 and scrollY stays 474.67 through Willow → Daisy → Lily. Checked the empty message remains visible. Lint, typecheck and build passed; mobile 390px layout also checked.
