# Verification (template v2)

Run on 21 October 2026, Windows 11, with Node 22.11.0, Chrome 155.0.8059.84, Python 3.13 and PyMuPDF 1.27.2. The commands were `node tools/render.mjs` and then `python -I tools/verify.py`, starting from an empty `out/`. Raw results are in `out/VERIFICATION.json`. Each render's decisions (layout chosen, decoration placed or skipped and why, photo crops) are in `out/<case>.<orientation>.layout.json`.

**Result: all 13 jobs pass.** That is 11 PDFs (6 cases, 5 of them in both orientations) plus 2 invalid inputs correctly refused.

## Cases

| Case | Exercises | Landscape | Portrait |
|---|---|---|---|
| `avery-lim-2026-s2` | Saved sample narratives; Semester 1 to 2 rings (Beginning to Developing); 2 uncaptioned illustrations per subject; illustration as cover photo | cover + split (photos right) + split (photos left), 3 pages | cover + stack + stack, 3 pages |
| `fictional-ellis-chong-2026-s2` | Second child, same template. English 178 words in 2 paragraphs, Developing to Consistently shown, 4 photos (3 captioned); 中文 63 characters with no Semester 1 rating (single ring); illustrated cover fallback | cover + split (2×2 photos, beaver holds the outer photo) + split, 3 pages | cover + pages (story page, then photo page with hanging beaver) + stack, 4 pages |
| `test-long-content` | English 331 words, 6 photos; 中文 516 characters, 3 photos | 4 pages, two-column continuation, re-planned photo pages | 4 pages |
| `test-sparse-no-photos` | One-sentence English, 16-character 中文, no photos, earlier-scale Semester 1 rating (hidden) | story-only pages, larger mascot | same |
| `test-semester1-crops` | Semester 1 report (one ring); 9:16-beyond tall image, panoramas, a placeholder, a portrait pair | split + split | stack + stack |
| `test-unassessed-preview` | `--preview`: unset indicator drawn as a dashed "Not assessed" ring | 2 pages | (landscape only) |
| `test-unassessed-blocked` | The same data without `--preview` | refused: "domains.english.rating is not set: choose a learning indicator before creating the PDF" | |
| `test-invalid-leak` | `observations`, `status`, `translation_preview`, rating 4, empty narrative, missing photo file | refused, 7 errors, no PDF | |

## Automatic checks

**In the renderer, after layout** (any failure means no PDF):

- **Exact text:** the narrative fragments join back to the exact source string, and the DOM text equals the placed fragments.
- **No clipping:** no text block is clipped, in one or two columns. No header, tab or photo-heading region overflows.
- **Inside the page:** every text element stays inside the page, and story text stays inside its own region.
- **No text overlaps:** no two pieces of text from different regions overlap. This check was added in v2 after it caught the 中文 header problem described below.
- **Decoration never touches text,** never leaves the page, and covers at most 3% of any photo. Backgrounds are exempt from the photo rule but not the text rule.
- **Photos stay above the meadow strip.**
- **Local requests only:** nothing outside `127.0.0.1`, and no console errors.

**In `tools/verify.py`, on the PDF files:**

- **Page size:** A4 in the job's orientation on every page.
- **Fonts:** every font embedded as TrueType (no Type 3): DM Sans 9pt Regular/SemiBold, Nunito Bold/ExtraBold, Noto Sans SC Regular/Bold.
- **Text:** every narrative fragment and every caption appears verbatim in the PDF text, and Chinese punctuation is present.
- **Chinese glyphs:** every CJK character, and every quote or ellipsis in Chinese text, is drawn with Noto Sans SC. That covered 262 glyphs for Avery, 88 for Ellis and 527 for the long test, per orientation.
- **No workspace terms** in the PDF text.
- **Child's name:** exactly once, on the cover, and never on the subject pages outside the narratives.

## One-off checks

- **Determinism:** Avery was rendered again in both orientations into a temporary folder. Page rasters at 90 dpi were identical.
- **Art intake:** `tools/build_art_assets.py` processed 24 assets, all of them `done` in `art/_INDEX.md`. The halo measurement and visual review are recorded in `art/_REVIEW.md`; all five regenerated assets measured 0% halo.
- **Schema:** the data files match `schema/portfolio-report.schema.json`. The v1 negative tests (single-word and single-comma edits are caught) still apply, since the fragment check is unchanged.
- **Visual review:** every preview page in both orientations, with zoomed crops of the ring row, the Chinese header and the decoration placements.

## Defects found and fixed while building v2

1. **中文 header:** "中文 Chinese" plus two rings didn't fit the 118 mm story column. The rings wrapped below the title and overlapped the section heading. The header height is now measured instead of assumed, and the text-overlap and region-overflow checks were added.
2. **Cover river:** on the illustrated cover, the river background slid 4 mm under the name panel. The new decoration check caught it; the river now starts at the panel edge.
3. **Cover meadow:** the meadow strip was layered under the full-bleed cover photo. Fixed.
4. **Beaver grip:** with a 2×2 photo grid, the hanging beaver gripped the inner photo and would have covered its neighbour, so it was rejected. It now grips the outer photo in the top row.
5. **Stale data:** Avery's data was being overwritten by a stale working copy during my sync step. The sync now carries the freshly extracted file.
6. **Short narratives:** these were balanced into two columns of one or two lines. Text of four lines or fewer per column now uses a single column of normal width.
7. **Over-wide text boxes:** headings and tabs were full-width blocks, so decoration checks treated empty space as text. They now hug their words.

## Second review round (v2.1)

Changes from the user's review:

- **Softer meadow:** back to the v1 border; landscape uses a seamless tiled version.
- **Connected vine:** rooted in the meadow and reaching the top edge, or not drawn at all.
- **Decoration budget:** 2 pieces per page, 3 on sparse pages.
- **Photos pulled up:** the first photos move up under a short story, side by side.

Re-run from an empty `out/`: all 13 jobs pass the same checks as above. Layout changes:

- **Ellis portrait English:** the story plus 2 photos side by side on page 2, then 2 photos on page 3.
- **Long-content portrait:** the 中文 photos now sit under the story, so the booklet is 3 pages instead of 4.
- **Seam check:** I zoomed in on the landscape border join (300 px around it, scaled 3x); no step or cap is visible.

## Third review round (v2.2)

Changes:

- **Bottom border:** the flipped top garland, repeated without a seam.
- **Vine:** hugs the page edge.
- **Avery's cover:** shown whole (`fit: "width"`) in both orientations.
- **Photo arrangement:** two photos share a row except two landscapes in a narrow column; Avery's 中文 page is now wide on top with two below.
- **River:** left out when less than 35% of it would show. On Avery's landscape 中文 page only 23% would show, so the vine took the slot.

Re-run from an empty `out/`: all 13 jobs pass every check, and Avery's pages render identically on a second run in both orientations.

## Full Avery report (four areas)

- **Checks:** `avery-lim-2026-s2-full` (preview) renders 5 pages in each orientation and passes every check: all four narratives verbatim, 258 CJK glyphs drawn in Noto Sans SC, the name only on the cover, no text overlaps and no decoration on text. Re-rendering gives identical page rasters in both orientations.
- **Portrait fix:** a single photo used to grow so tall that the mascot had no room. Stack layouts now keep the mascot's height free under the photos when the photos still get at least 38% of the page body. When there is no room below (Mathematics, with a tall portrait photo), the mascot sits beside a narrow photo block instead.
- **Regression:** all 15 jobs pass (13 PDFs plus 2 refusals).

## Closing page, layout matrix and photo fitting

- **Closing page** in Avery's full report, both orientations: the line, logo, garland, river, waving friends and runner all pass the checks (no decoration touches the text). A 200 dpi zoom of the river's top edge shows a smooth fade with no line.
- **Layout matrix:** 6 photo counts × 4 areas × 2 orientations, 12 PDFs (56 pages), all passing every check: text verbatim, Chinese glyphs in Noto Sans SC, no overlaps, no decoration on text or over photos.
- **Before the fitting fix,** the matrix showed portrait reports with 4 to 6 photos and landscape with 3 to 4 falling back to two pages, photo pages with small photos at the top, and some arrangements squeezed into a tiny single row. All of these are fixed by the best-fit arrangement, ceiling shrinking and the 75% reserve rule.
- **Regression:** all 27 jobs pass (25 PDFs plus 2 refusals). Avery's full report re-renders identically.
- **Avery's arrangements are unchanged.** Her portrait 中文 page now drops the rabbit mascot, because reserving space for it would cost the photo more than a quarter of its area.
- **New `rb2-squirrel-numbers.png`** (21 Oct, 16:01): clean, with 0% halo, and the 3 now sits on the tail. Its prompt file's Result section still describes the earlier version.

## Photo pages, minimum size and seeded variety

- **Matrix:** 4 photo counts × 4 areas × 2 orientations, all passing.
  - Landscape: 1 to 3 photos stay beside the story, with a staggered pair for 2.
  - 4 photos use the 2+2 grid when it stays at 30 mm or more (English and Social-emotional in the matrix). Otherwise they split 1+3 or 2+2 with a photos-only page (中文 and Mathematics).
  - Portrait keeps every area on one page.
- **Both photo-page styles render and pass every check:** the washing line, with its pegs and an extra camera animal on a sparse page, and the scattered arrangement with a camera animal. Decoration never touches text and covers at most 3% of any photo.
- **Seeded choices are recorded with their odds.** For example, 1+3 was picked again for a second 4-photo subject at 26% odds, so a choice becomes less likely after use but is never ruled out.
- **Minimum size calibrated on the review:** 40 mm and 34 mm both rejected the 2+2 grid you preferred (bottom row about 32 mm), so it is set at 30 mm. That still rejects the thumbnails you flagged, which were about 22 mm.
- **Staggered pair:** with a fixed 50/50 height split, a portrait photo became too narrow. The split is now searched between 30% and 70% for the largest smaller photo.
- **Photo limit:** `long-content.json` trimmed to 4 English photos, and the matrix trimmed to 1 to 4.
- **Regression:** all 23 jobs pass (21 PDFs plus 2 refusals).

## Cover, closing page and washing line (review fixes)

- Landscape cover: bottom border only under the name panel; closing page: no bottom border or runner, logo 10 to 17 mm.
- Washing line: tape removed under pegs; twine layered above the photos; each photo hung below the twine's lowest point over its own width (logged offsets were up to 4 mm before the fix, so the twine had crossed the side photos); pegs stretch to reach from the twine to the photo edge.
- Regression after these fixes: all 23 jobs pass.

## Final build (template v2, 21 Oct 2026)

- Front-facing peg (`rb2-peg-front`, 0% halo) built in at a fixed 13 mm; photos on the washing line tilt to the twine (capped at 7 degrees) and never touch it.
- Full clean build from an empty `out/`: all 23 jobs pass (21 PDFs, 2 correctly refused); `tools/verify.py` reports no problems; every valid data file matches the schema; Avery's full report renders identically on a second run in both orientations.
- Layout matrix rebuilt: `out/layout-matrix.landscape.pdf` (18 pages) and `out/layout-matrix.portrait.pdf` (16 pages).

## Not verified

- Printing on paper and colour proofing.
- Real teacher photos.
- Mathematics and Social-emotional with real data.
- Other Chrome versions or operating systems.
- A PDF/UA audit.
- A native-reader review of the Chinese pages and of the proposed Chinese level labels.
