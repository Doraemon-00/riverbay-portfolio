# Administration interaction polish — 20 October 2026

## Implemented

- Removed tinted square paths from plus and close symbols. Their Phosphor foreground paths are unchanged. Every other sprite symbol is byte-identical to its committed form. Broader icon changes await the user's review.
- One shared floating notification across the three admin sections: five-second success expiry, remaining-time pause while hovered/focused, explicit dismissal, latest-message replacement, persistent non-modal errors and inline dialog errors. No inserted notification row shifts the search/table.
- Student archive/restore and teacher deactivate/reactivate preserve the current status filter and search. All records retains updated rows; filtered lists remove rows that no longer match. View active / View archived / View inactive are explicit navigation actions. Creation intentionally switches to Active and locates the new record.
- Class Restore now uses the shared year/class assignment fields, including Unassigned and cross-year destinations. Class archive no longer silently enables Show archived classes.
- Add teacher creates an actual demo auth account, profile and optional annual class assignments. Email is searchable/displayed for staff. Initial credentials are masked in a one-time dialog with reveal/copy controls; no email is sent and no plaintext password is persisted/logged. The prototype does not enforce password expiry or first-login change; invitations/recovery remain future work.
- Applied migration 202610200001_teacher_provisioning.sql without reset. Local setup adds the local server-only account key while retaining unrelated environment settings, existing data and existing passwords. server-only dependency is explicit for standalone helper testing as well as Next compilation.

## Verification

- ESLint, production build and standalone TypeScript check: pass.
- Directory access/integrity suite: pass with the new migration.
- Teacher setup suite: pass using the real server helper and disposable auth accounts. Covers anonymous/teacher denial, invalid class/email, email normalisation, actual sign-in with generated credentials, optional multi-class assignment, duplicate accounts, protected setup RPC and compensating deletion after an injected profile failure.
- Scanned 19 production client assets: server account key absent.
- Sprite comparison against HEAD: only plus/x changed; no opacity layer remains in either.
- Browser desktop/390px: clean add/close icons; Add teacher form collapsed and expanded; duplicate email error inside the form; working creation and one-time credentials dialog; school-wide email search; class/global restore chooser; consistent status filters; explicit notification shortcut; no horizontal overflow. The expanded mobile teacher form is bounded to 812px with vertical scrolling and all controls reachable.
- Timer: normal notice was absent after six seconds without another data/UI action. Search field top stayed 263.07px before/after dismissal. A keyboard-focused notice remained after six seconds. A hovered mobile notice remained after six seconds, then expired after leaving. Explicit View active changed the filter and dismissed the notice.
- Browser observations: archive student kept Active; restore kept Archived; deactivate teacher kept All; reactivate kept Inactive. Creation from Archived switched to Active. Completed selections cleared.
- Credential copy/reveal controls are present; clipboard contents were not overwritten during browser checks. Generated credentials were tested via the server helper's real sign-in check and were not logged or included unmasked in screenshots.
- Viewport override reset. Disposable UI Flow Review Teacher account and UI Status Check 1020 student removed after checks; existing user-created records/credentials retained. Automated suites remove only their fixtures. Quick-tour source unchanged.

## Screenshots

- admin-clean-icons-teacher-add.png
- admin-clean-icons-teacher-add-mobile.png
- admin-status-notification-desktop.png
- admin-status-notification-mobile.png

## Limits and follow-up

Prototype credentials are initial passwords, not expiring invitations. Lost setup responses or credentials may need administrator recovery; that UI is deferred. Provisioning spans Auth and an atomic profile/assignment transaction, so compensation is best effort if the network fails after a commit. Production requires verified invitation/setup/recovery, HTTPS and a separately configured server secret. No email, external sharing, commit, push or deployment was performed.

## Follow-up: shared demo credentials and teacher wording (20 October 2026)

- All three existing local staff accounts now use `teach2LEARN`; verified successful sign-in for each. No roles, account status, memberships or assignments changed.
- New teacher provisioning and fresh local demo setup use the same shared password. The provisioning suite passes, including actual sign-in and failure cleanup.
- Teacher interface uses Archive / Restore / Archived, including filters, confirmation, status, notifications and login explanation. Database flags and RPC identifiers are unchanged.
- Archive confirmation and teacher directory checked on desktop and at 390px; no original teacher was archived during this check. Screenshots: `teacher-archive-wording-desktop.png`, `teacher-archive-wording-mobile.png`.
- Lint, production build, typecheck and diff whitespace checks pass.
- Production invitation/recovery remains future work. Broader icon changes still await approval. No commit, push or deployment.

## Follow-up: unassigned filter and quiet scrolling

- Lint, production build and typecheck passed.
- Desktop and 390px: Unassigned shows the existing active unassigned student with Assign class; K1 Willow shows its assigned students. No student data was changed.
- Switching to 2027 resets class filter to All classes and shows year-specific assignments; returned to 2026 Unassigned afterwards.
- At 390px the expanded Add teacher dialog has one scrolling content region, visible title and action buttons, and no page horizontal overflow (380px document width within 390px viewport).
- Screenshots: `students-unassigned-desktop.png`, `students-unassigned-mobile.png`, `admin-dialog-scroll-mobile.png`.
- Viewport restored to desktop. Quick tour and other icons unchanged. No commit/push/deployment.

## Follow-up: bulk teacher classes

- Directory suite passed: multi-teacher/multi-class addition, preserved existing access, repeat operation without duplicates, invalid year/classes/empty targets, admin-target rejection, non-admin denial and archived-teacher rejection. Fixtures cleaned without changing original assignments.
- Lint, production build and typecheck passed.
- Desktop and 390px: checked bulk toolbar, empty-selection disabled save, checked-class enabled save, bounded dialog/actions, and successful save keeping teacher list/filter and clearing selection. UI save used only a class already assigned to both demo teachers, so original access was unchanged.
- Screenshots: `teacher-bulk-classes-desktop.png`, `teacher-bulk-classes-mobile.png`. Viewport restored. No commit/push/deploy.

## Follow-up: staff references and deferred work index

- Applied additive migration `202610200003_staff_references.sql` locally without resetting data. Existing staff received unique generated codes; new-teacher provisioning generates them automatically. UUIDs, roles, credentials and assignments unchanged.
- Provisioning and directory suites passed, including unique new codes and stable codes through archive/restore and assignment changes. Lint, production build and typecheck passed.
- Desktop and 390px: teacher directory shows staff IDs with email retained; lower-case ID search resolves the intended teacher. Class teacher list and Add teachers picker show IDs; picker search by ID works. No original assignments changed during UI checks.
- Screenshots: `teacher-staff-id-desktop.png`, `teacher-staff-id-mobile.png`. Desktop viewport restored.
- Added central `docs/DEFERRED_FEATURES.md` index and README link. Admin teaching/dual-role support is explicitly deferred. No commit/push/deployment.

## Follow-up: Classes tab alignment

- Lint, production build and typecheck passed. No backend mutation semantics or schema changed.
- Desktop/390px: Add students defaults to Unassigned, All active students shows current-class/year transfer labels, student-ID search resolves candidates, and selections survive filters with a hidden-selection hint. Dialog buttons remain visible.
- Class teacher list shows ID/email, ID search resolves the expected account, and Remove class access confirmation explicitly retains other assignments/accounts. Cancelled without changing user data.
- At 390px Unassigned shows student controls only; no Teachers/Settings subsection.
- Screenshots: `classes-student-source-desktop.png`, `classes-student-source-mobile.png`, `classes-teachers-aligned-mobile.png`.
- Viewport returned to desktop. No commit/push/deployment.
