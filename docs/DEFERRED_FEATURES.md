# Deferred features

A central index of deliberately postponed work, not a promise to build every item. Update this list when a decision changes or an item ships. Detailed design/verification documents remain the supporting record. AI drafting, photos and PDF delivery are core submission requirements; incomplete work on those belongs in the current milestone, not this backlog.

## Agreed deferrals

| Item | Current decision / reason | Revisit when |
| --- | --- | --- |
| Administrator who also teaches | Keep administrators separate from the teacher directory and teaching assignments for the prototype. Avoid combining account administration and teaching access controls prematurely. Staff IDs are already role-independent. | Real staff need both duties; define dual roles and safe account archive/last-admin rules. |
| Domain-specific staff permissions | Assigned teachers can access all four domains in their classes, across both semesters. | School confirms distinct editing/review restrictions. |
| Production account invitations and recovery | Working demo accounts use the shared demo password. No invitation email, reset UI or forced first-login change. | Prepare a deployment for real staff/data. |
| Full audit/history interface | A dedicated view of account/assignment changes and portfolio contributions is deferred. | Review attribution and accountability requirements. |
| Concurrent administration edits | Current admin changes are atomic; an explicit stale-edit comparison workflow is deferred. | Multiple administrators edit the same allocations. |
| Full student history/profile view | Cross-school search and retained annual memberships exist; a dedicated timeline/profile is deferred. | Teachers need to browse prior years routinely. |
| Automatic annual rollover / within-year transfers | Classes remain separate by year; no automatic promotion or separate S1/S2 class allocation. | School confirms promotion/transfer rules. |
| Bulk teacher access removal | Bulk additions keep existing access. Remove access through individual Manage classes. | Repeated staff departures/reallocations justify a bulk flow. |
| Large-school directory pagination | Current prototype targets the small school; larger datasets need pagination beyond backend row limits. | Scale exceeds the prototype's loaded-directory approach. |
| Quick-tour revisions and demo video | Keep existing tour unchanged until explicitly authorised; video is optional if time permits. | Components/flows are settled. |
| Broader icon changes | Clean plus/close icons are the trial; no global icon conversion without approval. | User approves applying the rule elsewhere. |
| Alternative administration layouts B/C | Style A is the current direction. | A demonstrated allocation task benefits from another layout. |
| Canva integration / flexible design editor | Populate structured fields into the chosen report template first; no Canva-like editor in v1. | API feasibility and actual template-editing needs are established. |
| Automatic photo selection/analysis | Photos are assigned explicitly to sections; no inference about children from images. | A validated need, privacy review and separate technical evaluation exist. |
| Classroom recording and syllabus coverage | Potential teacher-reflection direction; outside the portfolio prototype. | Separate discovery/pilot with recording and data governance decisions. |
| Fine-tuning / Hugging Face ML Intern | Potential research direction only; no automatic training on teacher edits. | Curated approved examples, evaluation criteria and data-use decisions exist. |

## Supporting documents

- [Class administration](CLASS_ADMINISTRATION.md): access, archive/restore and allocation decisions.
- [Architecture](ARCHITECTURE.md): implementation boundaries and production considerations.
- [Model improvement roadmap](MODEL_IMPROVEMENT_ROADMAP.md): evaluation/training possibilities.
- [Design direction](DESIGN_DIRECTION.md): visual decisions and pending approvals.

Last updated: 20 October 2026.
