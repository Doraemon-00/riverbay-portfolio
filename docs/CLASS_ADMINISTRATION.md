# Annual class administration

## Implemented scope

Style A remains the visual direction, with persistent Classes / Students / Teachers navigation: an open cream workspace, tinted class directory, fine row dividers and inline selection actions. B and C remain future options in docs/design-concepts/class-admin. No illustrations inside the administration workspace. Quick-tour source remains unchanged by this work; its old administration selector will need updating only when the user authorises tour revisions.

- Separate class identity for each academic year; same name can recur across years.
- Add class (year, level, name); rename; reversible archive/restore.
- Bulk-select existing students and teachers, with search and select-all-shown.
- Create student in a class or Unassigned. Remove from class without deleting student/report records.
- Bulk move between classes in the same year.
- Student archive is global: it hides the student and denies teacher access across years. School-wide restoration retains historical groupings with access disabled, then optionally assigns a current class. Class-level restoration uses the same year/class chooser, preselecting the current class only when it is active in the current year.
- Clearing a class removes current membership and teacher access, retaining the grouping, students and portfolio content. No permanent deletion control.
- Teacher assignments apply to all domains and both semesters of a class year. Teacher accounts can be created from the Teachers directory; email invitations and password resets remain future work.
- Teachers select the reporting semester on My classes. Back navigation from an editor preserves that semester.

## Data and migration

Apply migrations with `node node_modules/supabase/dist/supabase.js migration up --local` for an existing local database. Do not reset the database. New checkouts use the normal local startup and setup instructions.

`classes.academic_year` is part of identity, with case-insensitive yearly name uniqueness. `class_memberships` has one row per child and year; nullable class_id represents Unassigned. `class_teachers` holds annual teacher assignment. Old semester assignment writes are revoked from authenticated users.

Both semester enrolments/portfolios are prepared atomically when assigning a student. Moving changes class grouping in both semesters, preserving portfolio IDs, entries, revisions and content. Migration uses the latest recorded semester's grouping to reconcile the old demo's inconsistent S1/S2 class allocation. Previous academic years remain distinct. There were no released PDF snapshots to migrate. Immutable issued-report snapshots remain part of the future export milestone.

Archive/removal leaves stored enrolments in place for administrator history. Teacher RLS additionally requires current membership, active child, active class and annual teacher assignment. So an old enrolment cannot bypass revoked access. Private photo paths inherit the same portfolio check.

All UI writes use the administrator-only manage_class and manage_directory RPCs, validated at both the server action and database boundary. Bulk changes are transactions, and a small advisory transaction lock serialises administration writes to prevent move/archive races. Admin direct table writes are denied to prevent bypassing annual membership rules.

## Verification

The local access suite creates isolated temporary fixtures and removes only those fixtures afterwards. It checks annual names, semester creation, cross-year rejection, bulk atomicity, content/revision/ID preservation through moves, unassignment, student/class archive/restore, teacher revocation, clear grouping, stale saves, RLS and private storage. Browser-created verification fixtures were removed after checking class/student creation, archive/restore and bulk teacher assignment.

## School-wide directories

Administration has three persistent sections, without an extra landing screen. Each keeps its own search, status filter and selection when switching sections. Classes retains the existing annual workspace and its Students / Teachers / Settings subsections. Main navigation is labelled Administration.

- Students: all school records across years, name/ID search, Active / Archived / All filter, bulk selection, add, assign, archive and restore. Each student has an automatically generated, permanent RB-000001-style reference; the underlying UUID remains the database key. Names may repeat. IDs are not based on year, class or personal details and are not added to parent reports.
- Restore: default is unassigned, with a year and optional active class. The RPC disables historical membership access before restoring, preserving history without granting former teachers access. Explicit Restore & assign re-enables only the chosen year's membership. Class-level Restore opens the same assignment fields. Status changes keep the current filter; a notification offers View active or View archived.
- Teachers: school-wide Active / Archived / All directory, multi-select Archive / Restore and per-teacher Manage classes. The picker edits active classes in one year, covers both semesters/all domains, and retains archived class associations. Unsaved assignment changes must be saved or cancelled before changing year. Restoring restores access to assigned active classes and the confirmation says so. Teacher creation is available with a shared demo password `teach2LEARN` and optional class assignments. Email invitations, password resets and domain-specific permissions remain future work.
- Mobile: student name/ID, status/class summary and the row action remain visible in a compact table; class access is edited in the same dialog. There is no required horizontal swipe to reach Restore or Manage classes.

Migration 202610190003_people_directory.sql adds generated permanent references, profiles.is_active and class_memberships.access_enabled, retaining existing student/portfolio IDs and content. The old class RPC implementation moves to the private schema behind the new checked wrapper. No database reset is required.

Teacher archiving is enforced in request authentication and RLS helpers, including existing JWT sessions, entry writes and private object access. It does not delete auth accounts or contributions. Existing issued signed links, if used in future, still require short expiry; app-level archiving cannot revoke an already issued signed URL by itself.

`npm run test:directory` verifies references, duplicate-name students, cross-year archive discovery/restoration, retained content and groupings, no restored historical access, explicit reassignment, inactive-session read/write/storage denial, teacher-only targets, direct-write denial and transactional class replacement. It provisions an isolated fictional teacher and removes only its own fixtures. Existing annual access tests remain in `npm run test:access`.

Prototype limits: the server currently loads school-wide lists in one request (suitable for the current ~120 students); pagination/server search will be needed before exceeding the API row limit. Full student history/profile screens, immutable issued-PDF snapshots, audit-event UI and version conflict handling for concurrent admin assignment edits remain future work.

## Interaction consistency and teacher creation — 20 October 2026

- Status actions preserve search and status filters in both school-wide directories and the class workspace. Completed selections are cleared. All records stays All records; matching rows update or leave the filtered view. Explicit View active / View archived / View inactive shortcuts change the filter. Creating a person is the intentional exception: switch to Active and search for the new record.
- All administration success feedback uses a shared floating notification, without inserting a row above the search controls. It expires after five seconds, pauses while hovered or keyboard-focused, can be dismissed and is replaced by newer feedback. Non-modal errors persist until dismissed; form errors remain inside dialogs. Timers do not depend on unrelated rerenders.
- Student Restore uses shared assignment fields in both entry points. Historical access is disabled until an explicit class assignment; the current filter is retained on save. Cross-year shortcut navigation opens the chosen destination year/class.
- Add teacher accepts name, email and optional classes for a selected year. It creates a working demo auth account, then atomically inserts the teacher-only profile and class assignments. Duplicate emails produce an inline error. The administrator's own session is not replaced.
- Initial sign-in details appear in a dedicated dialog, with masked password/reveal and a copy button. They are cleared from component state when closed. No plaintext password is stored in application tables, written to logs, or sent by email. All demo staff accounts use `teach2LEARN`; the password does not expire or force a change in this prototype; production should use verified invitations and a password setup/recovery flow.
- Creation uses a server-only Supabase admin client after active-admin authorisation. The acting admin's authenticated RPC checks authorisation again and validates class/year/actor metadata; role is hardcoded teacher. Failed profile setup attempts removal of only the newly created auth account. Interrupted setup/credential recovery still requires administrator assistance.
- Migration 202610200001_teacher_provisioning.sql adds staff email and the protected provisioning RPC. Set SUPABASE_SERVICE_ROLE_KEY only on the server; never use a NEXT_PUBLIC_ prefix. Local setup configures the local key without resetting data or changing existing passwords, and retains unrelated environment values. The key must be configured separately for hosted environments.
- Plus and close icon background layers were removed from the sprite. Other icon artwork remains unchanged pending the user's approval of this treatment.

`npm run test:teacher-setup` runs the real server helper with local disposable fixtures, checking active-admin access, invalid input, actual sign-in, multi-class assignment, duplicate email, protected profile setup and compensation after an injected setup failure. The test needs the included Node experimental type-stripping flag on Node 22. Browser checks and screenshots are recorded in verification/ADMIN_INTERACTION_POLISH.md.

## Student assignment filters and scrolling — 20 October 2026

The Students directory has separate academic year, class (All classes / Unassigned / active classes) and account status filters. Unassigned means no enabled membership in an active class for that year; archived students have no current assignment and retain their history. Changing filters clears selection and preserves scroll position. Changing year resets class to All classes. The assignment/create/restore picker starts in the selected directory year; no data migration is needed.

Scrollbars use thin, muted colours with transparent tracks and native forced-colour fallback. Admin dialogs keep the heading visible and action rows sticky inside a single scrolling content area, without a nested class-picker scroll area.

## Bulk teacher class assignment — 20 October 2026

Select active teachers in Teachers → Assign classes. Choose one academic year and any number of active classes, then save. Each checked class is added to every selected teacher, covering both semesters. Existing assignments in all years are retained; duplicate pairs are skipped. Changing year clears the checked classes. The button is disabled for mixed/archived selections. Individual Manage classes still edits/replaces that teacher’s active assignments for the selected year.

The additive operation is one administrator-only database transaction (`add_teacher_classes`), validates every teacher/class before writing, and rejects archived accounts, archived classes and year mismatches. Migration: `202610200002_bulk_teacher_classes.sql`.

## Staff references and role boundary — 20 October 2026

Teachers have automatic permanent `RB-T000001`-style staff references, shown/searchable in the teacher directory, class teacher lists and teacher pickers. Emails remain login identifiers; UUIDs remain database keys. Migration `202610200003_staff_references.sql` backfills existing profiles and generates IDs for new ones. All staff profiles receive a code so future role changes can retain it; administrators stay outside teaching assignments and the Teachers directory for now. See [Deferred features](DEFERRED_FEATURES.md) for that decision and the rest of the backlog. IDs may have gaps and are not added to parent reports.

## Classes tab alignment — 20 October 2026

- Selected class headings show class name and academic year. Unassigned is scoped to that year and has only student controls. Its active-student membership rule matches the global directory: no enabled membership in an active class.
- Add students defaults to Unassigned, with All active students available for transfers. Current class/year is shown on transfer candidates. Search supports student IDs. Selected students remain selected across search/source filters, with a hidden-selection hint.
- Class teacher lists/pickers show permanent staff ID and email; both are searchable alongside names. Archived teacher accounts are labelled Archived / Access blocked.
- Remove class access affects only that class, both semesters; whole-account archive/restore stays in the global Teachers directory. Existing account and other-class access are retained.
- Existing student move/remove/archive/restore actions remain. Restore now starts with the class workspace’s selected academic year (superseding the previous current-calendar-year default); the year can still be changed explicitly.
- Actions preserve current class, subsection, search, status filter and scroll where applicable; creating a new class/student intentionally navigates to it. Quick tour unchanged.
