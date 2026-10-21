# Riverbay brand and asset direction

Status: starting template, 18 October 2026; logo combination selected 19 October 2026. Selected visual foundation applied locally 19 October 2026; remaining proposals stay open.

- Figma file: https://www.figma.com/design/sWzU2qGTd9poSxQzuC6z4E
  - The "Brand board" page holds the frame "Riverbay — Brand & Asset Direction", with sections 01 to 07.
  - The "Components" page holds the components.
  - The variable collection is "Riverbay tokens".
  - An older copy (`pVGxVNMDSrP1fVBdZJhDwl`) is out of date.
- Exported assets, cut-outs, mark SVGs and token files: [design-assets/riverbay/](design-assets/riverbay/README.md).

Approved and unchanged:
- Riverbay Preschool (fictional; name availability not checked).
- Riverbank Garden theme.
- Beaver mascot, with squirrel, stacked-beehive-holding bear and carrot-holding rabbit (friends selected 19 October 2026). Deer is retained as a reserve candidate.
- Willow, reed, daisy, wildflower, clover and sprig botanicals.
- Pastel marker doodle style and Phosphor duotone icons.
- A single-colour ring with three separate rounded segments, filling one, two and three at a time, plus a dashed unassessed state (reference selected 19 October 2026).

## Identity (selected 19 October 2026)

- Mark: "Tail & ripple". It puts a beaver tail and a river ripple on a wobbly butter blob. It is a vector with single-colour and reversed versions, plus a variant without hatching for 24px and below. Risk: on its own, the tail can read as a leaf, so launch it beside the wordmark.
- Wordmark: "Riverbay" in Nunito ExtraBold with a small daisy replacing the dot above the i (Option C), paired with the Tail & ripple mark (Option B). The flower echoes the botanical theme. At small sizes where the flower loses detail, retain legible lettering and use the separate small mark.
- Generated light/dark wordmarks and combined logos live in `design-assets/riverbay/mark/`. Lettering is outlined for consistent rendering. Subline placement remains a separate layout choice.
- Not recommended as the logo:
  - The beaver badge is a raster and blurs below 24px. It can still serve as an avatar or welcome sticker.
  - The daisy-dot wordmark alone has no square mark; the selected combination uses Tail & ripple for square placements.

## Tokens

| Token | Value | Role |
|---|---|---|
| neutral/paper | #FBF7EE | Page canvas |
| neutral/surface | #FFFFFF | Cards, fields |
| neutral/line | #E4E2D8 | Decorative dividers |
| neutral/field-border | #8F978F | Input borders, 3:1 on white |
| text/ink | #2B3631 | All text; 12.5:1 on white |
| text/muted | #5B6862 | Hints, 13px minimum; 5.8:1 on white |
| action/primary | #2F5C4D | Buttons, links, focus; white text 7.6:1 |
| action/primary-tint | #E3F1E8 | Selected/hover fills |
| status/success on -bg | #2E6B4E on #E3F1E8 | Saved, Reviewed (5.4:1) |
| status/attention on -bg | #7A5300 on #FBF0C9 | Unsaved, Needs review (6.0:1) |
| status/danger on -bg | #A1392C on #FBE4DE | Failed save, destructive (5.5:1) |
| status/info on -bg | #2D5C78 on #E1EEF5 | In progress, concept labels (6.1:1) |
| ring/fill, ring/track | #8467C4, #ECE7F4 | Ring arc (4.45:1 on white) and track |
| decor/mint, peach, powder-blue, butter, lavender | #D5EDDF, #F6D5C1, #DCECF2, #F8EDBC, #E9E0F3 | Fills only (English, Chinese, Mathematics, Social-emotional tints; ring support). Never text colour. |

These are computed WCAG 2.x contrast ratios, not a full accessibility audit.

## Typography

- Display: Nunito ExtraBold/Bold (OFL 1.1, Fontsource), for the wordmark, page titles and report headings at 20px and above. It replaces Georgia, which reads as institutional next to marker art and cannot be bundled under an open licence for the PDF.
- Interface: DM Sans 400/600 (already shipped). UI body is 15/1.55, labels 14, and hints no smaller than 13. Raise the current 10–12px labels (demo strip, account, brand subline).
- Chinese: Noto Sans SC 400/700 (OFL 1.1), body 15/1.75, subset-embedded in the PDF. This must be proven in a real export.

## Illustration use

- Standalone object illustrations: daisy, stacked beehive, carrot and acorn, matching the characters' props (19 October 2026). Transparent exports in `cutouts/props/`. Decorative use only; do not replace Phosphor action icons. App adoption remains pending.
- Daisy and beehive colouring revised to matte, visibly textured marker/crayon strokes with small pigment gaps; avoid glossy highlights and smooth gradient shading. Shape and palette retained. The beehive held by the full-body bear uses the same matte treatment; the rest of the bear retains its existing colouring.

- Face badges: beaver, bear, squirrel and rabbit on butter-yellow blobs (19 October 2026). Original exports remain in `cutouts/badges/`. On 22 October the user approved separating the faces into `cutouts/stamp-faces/` for saved-content readiness inside domain tabs: mint circle = indicator saved; animal = narrative saved; both = ready for PDF; empty = neither. These do not change the logo or replace action icons. A saved narrative is not a formal review or quality endorsement.

- **Expressive** (banner, cover, welcome, "class complete"):
  - The mascot plus at most two botanicals.
  - Art covers at most 45% of the area and stays on its own side of the text.
  - The mascot is at least 96px.
- **Light** (empty states, login, cover section openers): one animal or one corner cluster at 64–160px, beside one line of guidance.
- **None** (domain editor, roster, notes and narrative fields, dialogs): no illustration and Phosphor icons only. Pastels appear only as domain badges and selected fills.
- Animals never replace action icons. The approved exception to the no-editor-art rule is the small readiness stamp in each domain tab. Each animal keeps its original colours; the independent mint circle and animal layers represent saved fields. Hover and keyboard focus explain missing fields; accessible descriptions provide the same explanation. No illustration is added inside form fields, roster rows or dialogs.
- Original artwork is concept art generated in Figma on 18 Oct 2026 (Figma AI, gemini-3.1-flash-image, original prompts). The individual bear holding a rounded stacked beehive and rabbit holding a carrot were generated with the built-in image tool on 19 October using the original characters as references. Source PNG alpha is preserved by the build. No new art is applied to the app. Before production:
  - Split the sheets into single items with transparent backgrounds.
  - First-pass transparent cut-outs (PNG and WebP) are already in `docs/design-assets/riverbay/cutouts/`. Decide the final sizes once the direction is approved.
  - Check that the banner beaver matches the mascot sheet.

## Interface language (board section 05)

Components: Learning ring, Ring option, Domain workflow status, Button, Save feedback, Domain tab.

- **Learning indicator**
  - Selected style: three thick segments with lightly rounded corners and flatter radial ends, matching `riverbay-ring-preview.png`; the fully rounded cap experiment was superseded at the user's request. Segments fill cumulatively across Beginning, Developing and Consistently shown (a sample scale): upper-left, upper-right, then bottom. Pale lavender indicates unfilled segments; the same purple indicates all filled segments. Small gaps remain visible at level 3. Flat fill, no glossy highlights.
  - Reference SVG assets are generated in `design-assets/riverbay/rings/`. The app now uses these generated assets with visible level labels; these are categorical levels, not numerical percentage scores.
  - "Not yet assessed" is an explicit option, shown as a dashed ring.
  - A selected option shows a border, a tint, a check icon and the word "Selected".
  - It is never calculated from notes or suggestions.
- **History**
  - S1 and S2 are labelled separately.
  - A missing S1 rating shows "Not assessed".
  - If S1 used a different scale version, show its own label and do not compare.
- **Workflow status per domain**
  - Not started.
  - In progress: notes or an indicator exist, but no narrative.
  - Needs review: a narrative exists and has not been reviewed.
  - Edited after review: any change to inputs, photos or narrative clears the review.
  - Reviewed: the teacher marked this exact saved revision as reviewed.
- **Export rule** (decided 21 October 2026; replaces the earlier "all four domains Reviewed" recommendation)
  - "Download for parents" needs an indicator and a learning story in every domain. There is no per-domain review step.
  - Prototype override (21 October 2026): Landscape / Portrait sit immediately to the left of Create PDF. Clicking Create PDF generates the saved content and starts a direct download, with inline loading/error feedback and no extra confirmation or blank tab.
  - The prototype button requires an indicator and a learning story in each domain. The backend retains the same completeness/access checks. The internal preview API remains available, but there is no separate preview action in this simplified UI. A parent copy cannot show "Not assessed". This shortcut is not a formal teacher-review assertion; any production approval workflow remains a later decision.
  - No admin approval chain.
  - The PDF is rendered from the saved records at the moment of export; nothing is rewritten or added.
- **Save feedback** covers persistence only:
  - Saved.
  - Unsaved.
  - Saving.
  - Failed: the text stays on screen and Retry is offered.
  - Conflict: compare versions before saving.
- **Actions**
  - One primary action per surface (Save draft, Mark reviewed).
  - Draft from notes is a secondary action (pending build).
  - Next child is a quiet action and keeps the current domain.
  - Remove photo is an outlined destructive action with confirm or undo.

## Surfaces (board section 06)

- **Teacher editor crop** (quiet):
  - Child and semester header, domain tabs with a status chip on each, ring options, the observations field, the narrative field and a sticky save bar.
  - No illustration.
- **Report cover fragment** (expressive):
  - Mark plus wordmark, the child's name, class and semester shown once, the beaver and a corner cluster, and the bottom border.
  - A child-image cover remains a future option and is not in scope.


## Implementation checkpoint — 19 October 2026

Applied to the local app: selected logo, Nunito display + DM Sans UI + locally bundled Noto Sans SC, canonical colour tokens, the four segmented ring states, and the existing beaver on login. Roster and editor remain illustration-free. Responsive forms, a sticky save bar, brief reduced-motion-aware Motion transitions and an optional contextual Driver.js tour are now wired. See APP_STATES.md for implemented versus future states.

The current narrative status is Draft, not Reviewed: the exact-revision review action, AI, photo upload, translation and PDF generation remain pending. No export rule has been enforced prematurely. No report layout or remaining asset proposal is locked by this checkpoint.


### Sign-in artwork trial — 19 October 2026

The welcome side now previews an animal-made scrapbook in a riverbank garden, using `source/signin-scrapbook-concept-v1.png`. It replaces the isolated beaver placement; the heading and form remain HTML. Desktop uses a wider illustration column beside the form; mobile stacks a shorter landscape frame above the form. This is a preview for visual feedback, not a final asset decision. The quick tour is frozen until further instruction.


### Full-window sign-in trial — 19 October 2026

At the user's request, the same scrapbook artwork now forms the page backdrop. A right-aligned warm-paper sign-in panel uses the existing colour tokens, visible labels, 16px input text and the forest-green primary action. Branding and the heading sit above the scene. Desktop contains the full image within the background area to preserve the main subjects; the cream page colour blends with the image edges. A right-side cream scrim reduces detail behind the panel. Mobile uses a centred foreground form over a softer cropped backdrop, with ordinary document scrolling on short screens. This supersedes the earlier side-by-side image frame for preview; it is not a final locked direction. Quick tour unchanged.


### Rounded split sign-in trial — 19 October 2026

The user's Lumina screenshot is a composition reference only: a single large rounded surface with sign-in on the left and an illustration on the right. The new Riverbay trial adopts that structure with existing Riverbay branding, cream/white/mint tokens, Phosphor action icon and the scrapbook garden source. It supersedes the full-window backdrop for the current preview. The visible email/password labels and real server action remain. Desktop uses a portrait crop focused on the beaver and scrapbook; the small squirrel is outside this crop. Mobile places the form first and the garden below, hiding the secondary art headline to avoid covering the illustration. No new art or authentication feature was added. Quick tour unchanged.


### Selected sign-in layout and concise copy

The user selected the earlier open two-column landscape layout from signin-scrapbook-desktop.png: illustration and welcome story on the left, a separate white sign-in panel on the right. The line below Welcome back is now "Your class portfolios, one story at a time." It uses 14px UI text and normal wrapping rather than forced nowrap or truncation. Earlier full-backdrop and shared-frame trials are superseded. Quick tour unchanged.


### Simplified welcome copy

The left column keeps the Riverbay logo and "Little moments. Growing stories." above the scrapbook illustration. The uppercase tagline and explanatory paragraph are removed to reduce competing text. The sign-in card subtitle is unchanged.


### Sign-in subtitle approved

The line below Welcome back is now "A home for every child’s story." This replaces the class-portfolios subtitle. The left column remains the logo, headline and illustration, without extra supporting copy.


### Latest approved sign-in subtitle

"Every little observation, part of their story." replaces the previous subtitle below Welcome back. Keep normal wrapping for accessibility; target a single line at desktop and 390px.


## Class administration — selected Style A implemented

Open class directory on the cream page, with a faint mint navigation area, fine dividers and inline bulk actions. Students, Teachers and Settings share the selected class/year context. Mobile uses a class picker above the detail area. B (full-width index) and C (allocation board) remain future options, not current screens. No illustration in administration and no quick-tour source changes.

## Administration navigation — school-wide directories

Classes / Students / Teachers are persistent navigation inside Administration, using Style A's open cream surfaces, fine dividers, Phosphor icons and mint selection toolbar. No separate card landing page. Classes retain their existing annual directory and contextual Students / Teachers / Settings navigation. Students and Teachers clearly say All students / All teachers. Names/IDs and actions remain visible at 390px; auxiliary status and class columns become a summary under the name. Existing focus/dropdown and spacing refinements are retained. Quick-tour content remains unchanged pending explicit approval.

## Administration polish — 20 October 2026

Plus and close now use their clean foreground Phosphor paths without tinted square layers. This is a trial for those two symbols only; extending the rule to the other icons awaits user approval. Other sprite symbols are unchanged.

Administration notifications float at the upper right (inset at mobile width), so success feedback does not move controls or tables. Success expires after five seconds with hover/focus pause and an explicit dismiss action. Errors persist or stay in their form dialog. Status changes preserve the current filter; View active / View archived / View inactive are explicit shortcuts. Creating a student/teacher intentionally shows that record in Active. Add teacher follows the existing form/dialog style, with optional class selection collapsed initially and initial credentials shown once after creation. Quick tour remains untouched.

### Demo account lifecycle — 20 October 2026

Teachers and students use **Archive / Restore** and **Active / Archived** in the interface. Teacher archive confirmations explain that sign-in and class access are blocked while assignments and contributions are retained. Internal teacher access flags and RPC identifiers remain unchanged. All fictional demo staff accounts, including newly added teachers, use the shared password `teach2LEARN`. Production invitations and recovery remain future work.

## Saved-content readiness and softer controls — 22 October 2026

The PDF panel shows a brief thank-you message. Readiness is conveyed by domain stamps; the redundant overall count was removed at the user's request. Orientation appears only once every domain has a saved indicator and a nonblank saved narrative; Create PDF remains visible and disabled beforehand. Export still validates completeness on the server. Stamps and the panel share the same readiness helper; unsaved edits do not change readiness. Saving a narrative does not mark it formally reviewed.

Calendar month/year controls and PDF orientation choices use borderless idle states, the existing mint fill and forest text on hover/selection, and visible keyboard focus. Selected calendar days keep the established forest fill. The selected domain underline remains distinct from the readiness stamp.


### Mint readiness-stamp trial — 22 October 2026

Following the honey / purple / forest / mint comparison, the user requested mint in the app. The base uses the existing decor/mint #D5EDDF token. Desktop: 38px base with 27px face; mobile: 32px base with 23px face. The wider rim helps separate the indicator layer from the animal. Original badges and colour tokens are unchanged. This is a visual trial; saved-field semantics stay the same.

### Readiness text removed — 22 October 2026

At the user's request, remove the overall 'N of 4 areas ready' / 'All areas ready' line: domain stamps already communicate completeness. Keep the warm heading and thank-you message, per-domain accessible explanations, and existing export enablement/orientation conditions. Removed the unused readiness CSS and button description reference. Verified ready desktop and incomplete 390px views; Create PDF remains disabled for incomplete portfolios. Lint/typecheck/build passed (seven existing PDF concept lint warnings). Screenshots: verification/pdf-clean-status-desktop.png and verification/pdf-clean-status-mobile.png. No commit or deployment.
