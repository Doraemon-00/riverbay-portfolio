# Calendar and direct PDF flow

21 October 2026. User-requested changes; no changes to portfolio content or report renderer/layout.

## Calendar

- Replaced month/year dropdowns and the rotated down arrows with compact button grids. Month offers 12 named buttons; year offers 12-year pages with Phosphor previous/next arrows. Year → month → day supports quick backdating.
- Shared cream/mint/forest styling, current choices highlighted, keyboard focus moves into the selected item, Tab navigates options. DayPicker retains the actual day grid/keyboard behaviour.
- Browsing does not update a saved date. Choosing a day still updates the unsaved observation; dates remain optional. Existing manual entry, Today and Clear date stay available.
- Checked year paging, 2024 → February → leap day selection, discard restoring the saved observation, and mobile grid fit. All test date edits were discarded.

## PDF

- Orientation radios sit left of Create PDF, including on the checked 390px layout. No confirmation dialog, per-area table or separate preview/download buttons.
- One click POSTs the selected orientation and final mode, then activates the returned signed attachment URL. No blank tab is opened. The server no longer requires a separate `confirmed` flag; active login, portfolio access and per-domain indicator/story checks remain.
- Readiness and errors are inline. Duplicate clicks are blocked while exporting. A short-lived Download again link appears after success. The PDF always uses saved records, not unsaved editor text.
- Actual browser downloads completed: `Avery Lim 2026 S2.pdf` (landscape) and `Avery Lim 2026 S2 (1).pdf` (portrait), both under the local Downloads directory. PyMuPDF inspection: six pages each, every page in the requested orientation; first landscape page 841.92 × 594.96 points, first portrait page 594.96 × 841.92. No new tabs or confirmation dialog were required. Private exports are retained by the app's existing export storage flow.
- Missing-content student checked: Create PDF remains disabled with inline guidance. No saved ratings, observations or narratives were modified.

## Gates and evidence

Lint has no errors (existing PDF-concept warnings only), typecheck and build passed. Desktop and 390px checks passed; calendar and PDF controls have no horizontal overflow. Screenshots: `calendar-month-grid-desktop.png`, `calendar-year-grid-mobile.png`, `pdf-direct-desktop.png`, `pdf-direct-mobile.png`.

No commit, push, cloud deployment, sharing or credential changes.
