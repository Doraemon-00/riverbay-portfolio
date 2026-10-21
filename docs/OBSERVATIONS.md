# Observation timeline

Implemented 20 October 2026. Plain line and identical points; plant/leaf decoration remains undecided.

## Teacher flow
- One blank undated input is available immediately for an empty domain.
- Add observation opens another input, defaulting to today's date in Singapore. The date is optional and can be changed or cleared.
- Show fewer collapses history and returns focus/scroll to the observation heading only when it is above the viewport. The heading lands with a 24px inset. Scrolling is smooth unless reduced motion is preferred; expanding history does not programmatically move the page.
- Dated notes sort newest first. Three are shown initially; Show earlier / Show fewer expands or collapses history. Notes being edited remain visible even when older than the latest three.
- Undated notes appear separately as General observations; their position does not imply a date. Three are visible by default, with an independent Show more / Show fewer control. Notes being edited remain visible. Collapsing returns to the General observations heading only when it is above the viewport, with the same focus and reduced-motion behaviour as dated history.
- Edit is inline. Done editing collapses the input; it does not save to the database. The section explains that Save changes saves observations.
- Remove is a draft change until Save changes. The existing navigation dialog can discard changes to recover the saved timeline.
- Long notes have Read more / Read less. Inputs grow with content up to a sensible height.
- All notes are scoped to the current student's domain and semester. No cross-semester merging or date guessing.

## Riverbay date picker — 21 October 2026

Observation inputs use the MIT-licensed `@daypicker/react` 10.0.2 calendar: cream rounded dialog, mint hover/focus, green selected day, outlined Singapore today and Phosphor navigation/calendar icons. At the user's request, month/year dropdowns were replaced with button grids: click the month for 12 months, or the year for a paged 12-year grid; choosing a year opens the month grid, then the day calendar. No down-arrow icons or browser dropdown menus remain. Today chooses the current Singapore date. Clear date keeps dates optional. Manual entry uses DD/MM/YYYY and validates real calendar dates, including leap days. Storage remains the existing YYYY-MM-DD string or null, with no schema or timestamp conversion.

The dialog supports keyboard day navigation/selection, Tab through month/year buttons, Escape, outside dismissal and focus restoration. Browsing months/years alone does not edit the observation. A chosen, typed or cleared date remains an unsaved edit until Save changes. Year grids browse in groups of 12 within valid four-digit years (1000–9999), consistent with manual-entry validation.

Verified keyboard selection, year/month changes, 29 February 2024, invalid 31 February rejection, Singapore Today, clearing to an undated note with restored input focus, and discarding test changes. Desktop/390px visual checks and lint/typecheck/build passed; existing PDF concept lint warnings remain. Screenshots: verification/calendar-desktop.png and verification/calendar-mobile.png. Saved observations were not changed during these checks.

## Persistence and compatibility
Migration `202610200004_observation_timeline.sql` adds `domain_entries.observations`, a JSON array of `{ id, date, text }`. Stable UUIDs identify points; dates are ISO calendar dates or null. Existing comments are copied intact into an undated observation. No dates are inferred from legacy prose.

The aggregate is appropriate for this prototype's whole-domain Save changes flow. `save_domain_observations` validates dates, duplicate IDs, nonempty text and limits, checks existing class access, and saves notes, indicator and narrative atomically with the existing revision check. Conflicting saves retain the teacher's draft. Direct table writes remain restricted by the existing policies.

The old comments field is retained as a plain-text preview (up to 6,000 characters) for existing progress summaries. The full structured observations remain complete. The legacy save_domain_entry RPC remains for compatibility with existing clients/tests; the app uses the new RPC exclusively. Future integrations must use structured observations rather than the preview to preserve dates and complete text.

Limits: 100 notes per domain/semester, 6,000 characters per note, and a 120,000-character serialized aggregate. Blank notes are omitted on save. There are no independent per-note author or edit-history records yet; observation dates must not be represented as save timestamps.

## Future AI use
Send the structured dates and notes to the model in chronological order. Multiple dated observations can support growth; one final note supports only a current snapshot. Undated notes provide context without proving chronology. The latest note must not erase earlier observations about different skills. AI drafting is still unconnected in the current editor.

## Verification
- Lint, typecheck and production build passed.
- Extended test:access checks timeline round-trip, invalid date and duplicate rejection, whitespace rejection, access denial, stale revision rejection, atomic failure, edit/remove persistence and preservation across class moves.
- Browser checked add/edit/remove, date change/clear, expand/collapse, reload persistence and Stay/Discard navigation protection using disposable fictional records.
- Desktop and 390px layouts checked, including date-field fit and Chinese note entry. Temporary records cleaned afterward.
- Screenshots: verification/observation-timeline-desktop.png and verification/observation-timeline-mobile.png.

Collapse verification: Avery mathematics (10 notes), desktop and 390px; heading returned to approximately 24px from viewport top with keyboard focus. Lint, typecheck and build passed. Screenshots: verification/observations-collapse-desktop.png and verification/observations-collapse-mobile.png.

General-note collapse verification: Avery Chinese (four general notes), desktop and 390px. Confirmed 3 → 4 → 3 visible entries, dated history stays collapsed independently, and collapse returns focus to the General observations heading (~24px inset). Lint, typecheck and build passed. Screenshots: verification/general-observations-collapse-desktop.png and verification/general-observations-collapse-mobile.png.
