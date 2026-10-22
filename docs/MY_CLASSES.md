# My classes workspace

Implemented 20 October 2026. Uses the Administration cream/forest theme, annual class directory, shared fields/icons, open rows and fine dividers. No illustrations inside the roster.

## Flow

- Left class directory on desktop; class dropdown on mobile. Only active classes visible through the viewer's database permissions are loaded. Empty assigned classes remain visible.
- Portfolio semester updates immediately without a full page navigation. The selected class is retained within its year; another year selects its first available class.
- Class heading shows name/year, total students and the number whose every domain is ready for PDF. This measures saved required fields, not formal review.
- Search by name or permanent student ID. Each domain links directly to its editor, and clicking the rest of a student row opens the portfolio's default domain. The student name is the semantic row link, with a stretched hit area; domain links sit above it and keep their own destinations. No separate Open button is shown.
- Saved workflow states: Not started (no saved indicator, story, nonblank observation/comment or photo), In progress (some saved content, but indicator or story is missing), Ready for PDF (saved indicator plus nonblank story). Photos are optional. These describe field completeness, not teacher approval or a quality check.
- Mobile rows show name, ID, Open, and four labelled domain links in a two-column grid. No horizontal scrolling is required.
- Previous/Next remains in the selected class, semester and domain. Back to my classes now includes both class and period identifiers.

## Navigation memory

Class and period IDs are reflected in the URL through native history replacement. Search and scroll are recorded on portfolio opening in optional tab-scoped sessionStorage, keyed by viewer ID, period and class. They are restored when that roster remounts. Search text is not put in the URL or sent to the database. Storage failures do not block access. Browser storage is a navigation convenience, not a source of permission checks.

The server still authenticates the viewer, uses RLS-protected queries, and filters active child/class membership before returning roster data. No access rules, credentials or database schema changed. Class/student administration stays in Administration.

## Pending

Quick-tour content remains frozen per instruction. Its old home/table selectors and sideways-scroll description need revision only when authorised. Actual review/AI/photo/PDF integrations remain their own milestone; this pass does not claim they are implemented.

## Row interaction and scroll follow-up

Rows highlight on hover, have keyboard focus feedback, and use normal links (including new-tab behaviour). Both Administration and My classes class sidebars have hover/selected-hover feedback.

Saved roster search/scroll restoration is skipped for explicit class or semester switches; it remains available on return from a portfolio, including when Next preserves a cached route. Browser automatic scroll anchoring is disabled so changed roster heights do not shift the viewport. My classes retains enough page height when switching to shorter rosters to avoid clamping the current scroll position.

Final polish: decorative row arrows removed at the user’s request. Whole-row and domain links remain; no extra action column is reserved on desktop.


## Current roster readiness — 22 October 2026

Page introduction: “Every moment counts. Every child has a story.” Removed the outdated review instruction. Class summary shows student count and the number with every configured domain ready for PDF, independent of the search filter. Domain links retain direct navigation and use neutral / soft blue / mint states. Hover and keyboard focus describe missing saved fields. Whole-row opening remains available.

Roster and editor sidebar counts share the saved-field readiness helper with the editor stamps and export panel. Sidebar N/4 now means domains with both indicator and narrative saved, not narratives alone. Photo IDs are read through the existing RLS-protected relationship so photo-only work counts as In progress; no image bytes or signed URLs are added to roster data. No schema or permission changes.
