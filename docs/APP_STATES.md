# App states and motion

Implemented states are derived from saved data; persistence is separate from review.

| Surface | States | Behaviour |
|---|---|---|
| Sign in | Ready, invalid credentials, missing staff profile | Real authentication; errors stay beside the form. |
| Classes | Ready, no assignment, load failure | Assigned classes only; empty state gives a next action. |
| Domain content | Not started, In progress, Ready for PDF | Indicator plus narrative saved means ready; photos are optional. Completeness is not formal approval. |
| Save | Saved, unsaved, saving, failed/conflict | Preserve typed text on failure; warn before leaving unsaved work. |
| Access | Signed out, unavailable portfolio, admin only | Existing server checks and database policies remain authoritative. |
| Guidance | Optional, open, dismissed | Replay a short context-specific tour; never auto-start or fill fields. |
| AI drafting | Idle, generating, candidate, stale candidate, failed | Review a candidate, Use draft, edit and save. Failures retain existing text. |
| Photos | Loading/uploading, saved, failed, removal confirmation | Photo operations persist separately from the domain save. |
| PDF | Missing required fields, ready, preparing, failed | Choose orientation and directly download saved content when all domains are ready. |

Future states: Needs review/Reviewed/Edited after review with exact revision tracking. Current readiness does not imply this approval workflow.

Motion uses a short entrance and subtle button feedback. Reduced motion disables movement. There is no blocking onboarding, delayed form availability, or celebratory animation during routine editing. Driver.js is loaded only when requested.

Guidance gives one short walkthrough for My classes, the portfolio and each administration context. Complex forms retain inline help; simple dialogs and sign-in have no tour. See `QUICK_TOURS.md` for the coverage map and verification limits.
