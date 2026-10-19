# App states and motion — foundation checkpoint

Implemented states are derived from saved data; persistence is separate from review.

| Surface | States | Behaviour |
|---|---|---|
| Sign in | Ready, invalid credentials, missing staff profile | Real authentication; errors stay beside the form. |
| Classes | Ready, no assignment, load failure | Assigned classes only; empty state gives a next action. |
| Domain content | Not started, In progress, Draft | Ratings/notes count as progress; a narrative is a draft, not approval. |
| Save | Saved, unsaved, saving, failed/conflict | Preserve typed text on failure; warn before leaving unsaved work. |
| Access | Signed out, unavailable portfolio, admin only | Existing server checks and database policies remain authoritative. |
| Guidance | Optional, open, dismissed | Replay a short context-specific tour; never auto-start or fill fields. |

Future states: AI generating/failed; uploads pending/failed; Needs review/Reviewed/Edited after review with exact revision tracking; PDF preparing/ready/failed. These actions are not simulated in this checkpoint.

Motion uses a short entrance and subtle button feedback. Reduced motion disables movement. There is no blocking onboarding, delayed form availability, or celebratory animation during routine editing. Driver.js is loaded only when requested.

Next checkpoint: agree on a report preview and content layout before wiring PDF generation.
