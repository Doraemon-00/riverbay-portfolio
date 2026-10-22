# Portfolio student navigation

Implemented 20 October 2026. The portfolio editor now uses the same cream/forest open sidebar language as Classes, with Phosphor controls, matching hover/selected states, and no decorative artwork in forms.

## Student selector

- Desktop: sticky, searchable student sidebar scoped to the current class and semester. Shows name, permanent student ID and a compact ready-domain count.
- Mobile: Choose student opens a searchable dialog with the same list; it closes after a successful switch.
- Search supports name or ID. Search/list scroll are optional tab-session navigation memory, keyed by viewer/class/year/semester. They are kept when moving between students; no search text is sent to the server or put in URLs.
- Previous/Next remain. Student links preserve the current domain. The server still authenticates and uses RLS-protected class/semester queries; archived children are excluded.
- Ready-domain counts use configured domain definitions rather than dots or a hard-coded denominator. This supports adding more domains to the configuration later without adding eight visual dots. It does not mean eight domains are implemented now.
- Ready-domain count means saved indicator plus nonblank saved narrative, consistent with domain stamps and PDF field requirements; it is not a formal review or content-quality check. Domain navigation can wrap if additional configured subjects are added.

## Unsaved changes

The editor captures in-app navigation links and other form submissions while dirty, including student list, mobile picker, Previous/Next, domain links, Back to my classes, shell links and sign-out. The dialog offers Stay, Discard changes, and Save and continue.

- Stay preserves current text and destination can be chosen again.
- Discard restores the last saved editor values before navigating, so cached pages do not retain discarded text as if it were saved.
- Save and continue navigates only after a successful revision-checked save. Validation/errors/conflicts retain text and keep the dialog on the current page.
- Controls disable during saving. Saving invalidates roster and portfolio routes so sidebar ready-domain counts refresh.
- New-tab/modified link clicks are not blocked because the current editing page remains open. Native beforeunload warnings remain for reload/tab close; browsers control whether those warnings appear.
- Browser Back/Forward SPA navigation is not covered by the in-app click/form guard. Cross-browser history protection and recoverable drafts remain follow-up work; do not claim every browser navigation is protected.

Shared dialogs and editor field labels use unique IDs, avoiding collisions when multiple cached routes/dialogs coexist. The navigation pass did not add AI, review or export integration. Subsequent work connected drafting, photos and PDF export; the 22 October Quick tour update covers these workflows and contextual dialog help (see `QUICK_TOURS.md`). Formal review remains deferred.

## Student-switch stability fix

The authenticated Shell now lives in the shared portfolio layout. It remains mounted between student routes, so the workspace entrance animation is not replayed for each student. Each portfolio page still authenticates and reads RLS-protected data.

Student search, sidebar scroll and mobile-picker closure now restore in layout effects before paint, rather than delayed animation frames. Hidden desktop/mobile lists do not overwrite stored scroll position when their responsive visibility changes.

## Class navigation and locating students

Desktop sidebar class headings have Previous/Next class arrows (no wrapping; Previous is hidden on the first class and Next on the last, matching student navigation) and open a class picker when clicked. The mobile Choose student dialog has a class dropdown. Only active classes visible through RLS in the current academic year are offered. Semester and domain are retained when entering another class portfolio.

Last opened students are remembered per viewer/class/year/semester in optional session storage and validated against currently accessible portfolio IDs. First visit falls back to the first named student. Empty classes remain inside the portfolio workspace with a clear empty state, class arrows/picker and current semester/domain preserved. Student search, editor and Previous/Next student controls are absent. Admins have a Manage class link; teachers can continue to another class. Empty classes are never skipped. No student is automatically created.

Show current student appears when the selected row is scrolled/filtered out of view. It clears a conflicting search and scrolls the list to the current student. Class arrows/links use the same unsaved guard as student links; the mobile dropdown sends a cancelable navigation request so it cannot bypass Save/Discard/Stay.

Dialog buttons now share height, radius, typography and padding. Stay is outlined, Discard is outlined red, Save and continue is solid green. Hover fills are mint/red/deeper green with visible focus outlines. Mobile order is Save and continue, Stay, Discard.

## Empty-class scroll stability
The shared portfolio layout reserves the workspace height reached at the current viewport width. Moving from a tall editor to a short empty class therefore does not shrink the document and force the browser to clamp the scroll position. The reservation resets when the viewport width changes or the portfolio workspace is left. The empty-state message stays visible while scrolled; mobile rows keep the class chooser compact instead of stretching it into the reserved space.
