# Riverbay portfolio PDF: Claude concept (template v2)

Status: **template v2 finalised for this concept stage**, 21 October 2026, after the user's reviews. Fictional demonstration identity and data only. The app export adapter is now connected locally (22 October); only fictional photos/data are used. School approval of Chinese labels and any further report-layout review remain pending. Generated out/ and compare/*.pdf files are local build artifacts and are not committed; the links below describe reproducible concept outputs.

This is a reusable, deterministic A4 template and renderer for the parent-facing semester portfolio. It produces **landscape and portrait** from the same source. It covers the cover, the English domain and the Chinese (中文) domain from [PORTFOLIO_PDF_BASELINE.md](../../PORTFOLIO_PDF_BASELINE.md). Mathematics and Social-emotional are configured but not reviewed.

v2 replaces the first portrait design (v1) after the review on 21 October 2026. The changes:

- A ring indicator beside the subject title.
- Four automatic page layouts.
- Personal headings.
- A full-bleed cover.
- New banner-style art with playful placements.
- An export block for unassessed indicators.

**Full report for Avery (all four learning areas, 5 pages):** [`out/avery-lim-2026-s2-full.landscape.pdf`](out/avery-lim-2026-s2-full.landscape.pdf) and [`out/avery-lim-2026-s2-full.portrait.pdf`](out/avery-lim-2026-s2-full.portrait.pdf). It is a **preview**: Avery's saved Mathematics and Social-emotional entries have narratives but no indicator, so those pages show the dashed "Not assessed" ring and a real export would be blocked until a teacher sets one. See [Full report](#full-report-avery).

**Layout matrix (every area with 1 to 6 photos):** [`out/layout-matrix.landscape.pdf`](out/layout-matrix.landscape.pdf) and [`out/layout-matrix.portrait.pdf`](out/layout-matrix.portrait.pdf), each page labelled with its photo count, area and layout; overviews in `out/previews/layout-matrix.<orientation>.png`. See [Photo arrangements](#photo-arrangements-and-the-layout-matrix).

**Start here:**

- [`out/avery-lim-2026-s2.landscape.pdf`](out/avery-lim-2026-s2.landscape.pdf) and [`out/avery-lim-2026-s2.portrait.pdf`](out/avery-lim-2026-s2.portrait.pdf).
- The fictional second child: [`out/fictional-ellis-chong-2026-s2.landscape.pdf`](out/fictional-ellis-chong-2026-s2.landscape.pdf) and [`.portrait.pdf`](out/fictional-ellis-chong-2026-s2.portrait.pdf).
- Page images: [`out/previews/`](out/previews/), for example `avery-lim-2026-s2.landscape-all.png`.

## Deliverables

| # | Deliverable | Where |
|---|---|---|
| 1 | Template source | [`template/`](template/): `theme.json` (page geometry, layout rules, decoration plan per subject), `strings.json` (labels and headings, en and zh-Hans), `components.mjs` (pure HTML components), `layout.mjs` (deterministic layout engine and checks), `portfolio.css` |
| 1 | Renderer | [`tools/render.mjs`](tools/render.mjs), [`tools/chrome.mjs`](tools/chrome.mjs), [`tools/validate.mjs`](tools/validate.mjs) |
| 2 | Sample data | [`data/avery-lim-2026-s2.json`](data/avery-lim-2026-s2.json) (saved sample content), [`data/fictional-ellis-chong-2026-s2.json`](data/fictional-ellis-chong-2026-s2.json), stress tests in [`data/tests/`](data/tests/) |
| 2 | Data contract | [`schema/portfolio-report.schema.json`](schema/portfolio-report.schema.json) |
| 3 | PDFs and previews | `out/<case>.<orientation>.pdf`, `out/previews/`, layout logs `out/*.layout.json` |
| 4 | Reproduction | [Reproduce](#reproduce) |
| 5 | Asset manifest | [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md), hashes in [`assets/manifest.generated.json`](assets/manifest.generated.json) |
| 5 | Art brief and intake | [`art/`](art/): `_STYLE.md`, `_INDEX.md`, one `rb2-*.prompt.md` per asset with the generator's recorded prompt, `_REVIEW.md` |
| 6 | Rationale | [Design rationale](#design-rationale) |
| 7 | Verification | [`VERIFICATION.md`](VERIFICATION.md), raw results in `out/VERIFICATION.json` |
| 8 | Integration notes | [Integration](#integration-how-riverbay-would-supply-a-child) |

## Reproduce

Requirements (nothing installed project-wide; no `npm install`; no lockfile changes):

- **Node.js 22** or later, for its built-in `WebSocket`. Tested with 22.11.0.
- **A Chromium-based browser.** The renderer finds Chrome, then Edge, at their standard paths; `CHROME_PATH` overrides it. Tested with Chrome 155.0.8059.84.
- **Python 3.11** or later with Pillow and PyMuPDF, for verification and previews. Rebuilding fonts or art also needs fontTools and brotli. Tested with Python 3.13.

From `docs/pdf-concepts/claude`:

```bash
node tools/render.mjs
```

```bash
python -I tools/verify.py
```

That renders every case in [`tools/cases.json`](tools/cases.json) in both orientations, checks every PDF and writes previews. One child, one orientation:

```bash
node tools/render.mjs --data data/fictional-ellis-chong-2026-s2.json --out out/ellis.pdf --orientation portrait
```

Add `--preview` to allow an unset indicator, for a teacher's draft view only. Rebuild steps are only needed when their inputs change; all are deterministic, offline and use no AI:

```bash
python -I tools/build_fonts.py
```

```bash
python -I tools/build_assets.py
```

```bash
python -I tools/build_art_assets.py
```

```bash
node tools/extract_avery.mjs
```

`build_art_assets.py` reads only the rows marked `done` in `art/_INDEX.md`, at their exact file names. It trims, crops, mirrors and downsizes those images into `assets/art/` and records the grip points of the hanging animals in `assets/art/anchors.json`.

The renderer serves everything from `127.0.0.1`. Any other request is a failure. When any layout check fails, no PDF is written.

## Architecture: four separate layers

1. **Template** (`template/`). It holds no child-specific values. `theme.json` sets, for each subject:
   - its tint colour
   - its mascot
   - the lane art beside the photos
   - the top art (willow strands or a garland)
   - whether a river runs behind the photos
   - the small animal that runs along the meadow

   `strings.json` holds every fixed label and the heading pairs.
2. **Content** (`data/*.json`). Explicit fields: `domains.<id>.rating`, `previous`, `<id>_feedback` and `<id>_photos[]` (`{src, kind, caption, alt, focus}`), plus an optional `cover_photo`.
3. **Assets** (`assets/`). Brand rings, logo and tokens are byte copies of the canonical files. New art is processed from `art/` into `assets/art/`. Photo paths resolve relative to the data file.
4. **Rendering** (`tools/`): validate, serve locally, lay out in headless Chrome, check, then print to PDF.

The output is deterministic: two runs give identical page rasters (checked in both orientations). PDF bytes differ only in Chrome's timestamp.

## Design rationale

### Indicator next to the subject

The title row reads "English", then the Semester 1 ring, an arrow, and the Semester 2 ring:

- The hole of each ring shows the semester ("SEM 1", or "第1学期" on Chinese pages).
- The level name sits under the ring. Chinese pages show it in Chinese with the English name in small type ("发展中 Developing").
- The rings are the canonical SVGs on transparent backgrounds, set straight on the page with no card.
- With no Semester 1 rating, or for a Semester 1 report, only the current ring shows. There's no scale key.

### Four layouts, chosen deterministically

The renderer tries the layouts in a fixed order and keeps the first that fits. The order and limits are in `theme.json`.

- **Split** (landscape): the story column beside the photo column, with up to 4 photos. Subjects alternate sides by position (English photos on the right, 中文 photos on the left), so the pages mirror each other.
- **Stack**: the story on top in balanced columns, with the photos below. This is the portrait default.
- **Pages**: a story page in two columns (with continuation pages as needed), then photo pages. Long stories or many photos end up here. It always succeeds. When a short story leaves room on its last page, the first photos move up under it, side by side in one row, so the page isn't half empty. A group never leaves a single photo stranded on the next page.
- **Story only**: the pages layout with no photo page, used when a subject has no photos. The mascot is drawn larger.

A teacher or admin can pin a layout per subject with the `layouts` field in a render job; the content itself is never changed. Very short narratives use a single column of normal width, so they are never spread thinly over two columns.

### Headings

Each subject has its own heading pair, shown once on its first page: Growing with words / Little moments, 成长的足迹 / 小小瞬间, Exploring and discovering / Moments of discovery, Growing together / Moments together.

Continuation and photo pages carry only a small subject tab and the page number. Following the review, the headings avoid "with us" phrasing so the child stays at the centre; the school appears only through the logo on the cover. The child's name, class and semester appear once, on the cover.

### Cover

- **Bottom border on the cover and closing page (review, 21 Oct 2026):** on the landscape cover it runs only under the name panel, matching the garland at the top; the closing page has none, because the river and friends reach the page edge. The closing logo is 17 mm tall.
- **With a landscape cover photo:** the photo fills the page and a cream panel with a hand-drawn wavy edge holds the logo, name, "K1 Willow · 2026 · Semester 2" and "A semester of growing". A garland sits along the top, the hedge border along the bottom, and a running squirrel on the border.
- **Wide illustrations** with a calm side can set `cover_photo.fit: "width"`. The whole image is shown across the page width, bottom-aligned, with the cream paper continuing above it, so nothing important is cropped. Avery's sample cover uses this, so all four animals and the kite are visible. Real photos keep the default `cover`, which fills the area and crops around `focus`.
- **In portrait:** the photo fills the upper 60% and the panel sits below.
- **Without a cover photo** (Ellis), an illustrated fallback appears instead: the river plus the beaver and squirrel waving.

### Decoration: playful, used where a page is sparse

Following the second review, decoration is a budget rather than a checklist:

- **The budget:** each page takes at most 2 pieces, or 3 when text and photos cover less than 42% of the page body.
- **Priority order:** pieces are taken in each subject's order in `theme.json`. English: hanging beaver, mascot, willow, peeking squirrel, runner. 中文: river, mascot, vine, garland, peeking squirrel, runner.
- **Busy pages stay calm.** The layout log records what was left out (for example "left out top (page budget of 2 reached)").
- **The vine must be connected.** It is rooted in the meadow and climbs to the top edge of the page, using copies stacked so each stem base meets the stem tip below (positions measured in `theme.json`). If text is in the way, the vine is left out entirely, so it never starts or ends in mid-air. In practice this means it appears beside a photo column next to the page edge (split and photo pages), never under a story. Hanging animals already connect, because their strand drops from the top edge.
- **The bottom border** is the new top garland flipped upside down, so leaves and flowers grow up from a vine (13 mm tall), in the same style as the top. It is cut at the column where the vine returns to its starting height and slope, then repeated across the page with no visible jog. The cut point is found by `tools/build_art_assets.py`. The v1 border and the busier `rb2-meadow-border` are no longer used.
- **The vine hugs the page edge.** Its lane runs out to the paper edge, so there is no strip of empty paper beside it, and it meets the top garland and the bottom border at the corners.
- **The river must stay visible.** It is drawn behind the photos only when at least 35% of it shows around them; otherwise it is left out (stray blue fragments look like mistakes) and the slot goes to the next piece.

The details below describe what each subject can use when the budget allows.

The new art is in the banner style the user preferred. It is placed relative to measured geometry:

- **English:** the beaver hangs from a willow strand dropping from the top edge, gripping the top corner of the outermost photo. It is mirrored when the photos sit on the other side. The mascot under the story is the beaver being bonked by a falling "A" with an "a" tumbling past.
- **中文:** a garland along the top, a vine climbing the page edge on the photo side, the river winding behind the photos, the rabbit with a 毛笔 and ink-speckled fur under the story, and a small rabbit hopping on the meadow.
- **Mathematics and Social-emotional** (configured): the squirrel holding a photo with its tail, the bear climbing the vine, and the squirrel with number blocks or animals sharing.

Every piece is optional. The engine drops any piece that would touch text, leave the page or cover more than 3% of a photo, and logs why in `out/*.layout.json`. The checks after layout fail the render if art touches text or text overlaps text. A hanging animal falls back to the vine when its strand would be too long (for example on a portrait stack page).

### Photos

- **Rows:** justified rows of equal height, keeping each photo's shape. Photos between 9:16 and 16:9 are never cropped; outside that range they are cropped around `focus`.
- **Two photos** share one row (left and right). They stack only when both are landscape and the column is narrower than 150 mm.
- **Three photos** go one wide on top and two below, side by side. Avery's 中文 sample now uses that arrangement instead of a landscape stacked over a portrait.
- **Frames:** white mats with paper tape and a slight tilt. Captions are printed exactly; a photo without a caption has no caption line.
- **Labels:** sample imagery carries a "Sample illustration" / "示例插图" chip.
- **Overflow:** photos keep the teacher's order and are re-planned when they move to a new page. There are at most 6 per subject.

### Overflow strategy (unchanged in principle from v1)

- Type never shrinks and text never clips.
- Narratives split only at word boundaries in English, or at segmenter boundaries in Chinese, with line-start and line-end rules for punctuation.
- Orphan and widow control keeps at least two lines together.
- Continuation pages use the same two-column measure.
- After layout, the fragments must join back to the exact source, and every fragment is found again in the PDF text.

### Typography

Unchanged families, embedded as static instances (Chrome embeds variable fonts as Type 3):

- Nunito ExtraBold for titles (34 pt) and headings.
- DM Sans at 12 pt/1.68 for body text, 10 pt for captions.
- Noto Sans SC at 11.5 pt/1.95, justified with strict line breaking; all 101 subsets, including the Latin subset for SC-style quotes.

## Integration: how Riverbay would supply a child

1. **Select child and semester.** Read the enrolment's `domain_entries` at their **reviewed** revisions, and map:
   - `rating` to `rating`.
   - `narrative` to `<domain>_feedback`.
   - The Semester 1 ratings function's result to `previous`.
   - The entry's `photos` rows, ordered by `position`, to `<domain>_photos`, with `caption` and `kind: "photo"`.
   - An optional teacher-chosen cover photo to `cover_photo`.

   Leave out observations, comments, revisions, statuses and generation runs. `validate.mjs` rejects them.
2. **Block export when an indicator is unset.** The renderer already refuses `rating: null`. The app's download button should do the same, as a pre-check with a clear message. `--preview` shows a dashed "Not assessed" ring for drafts.
3. **Photos.** Download the private objects into a per-job temporary folder and point `src` at those files. The renderer needs no credentials or network access.
4. **Preview, then download.** The renderer builds an ordinary HTML page from the same template and engine, so a preview route can show exactly what the PDF will contain. Run the renderer in a Node process with a pinned Chromium build. Orientation is a per-job option, so the school can offer either.
5. **Another child** is just another JSON file.

## Closing page

Option 1 (user decision, 21 Oct 2026): a last page with no child-specific content. The thank-you line "Thank you for growing with us this semester" is centred under the top garland with the Riverbay logo, and the beaver and squirrel wave by the winding river above the bottom border. The page has no page number. A render job turns it on with `"closing": true`; Avery's full report uses it. The river is cropped at its top, so a paper-coloured gradient veil lets it ease in. A CSS mask was tried first, but it left a 1 px line in Chrome's PDF output. The text is English only; a Chinese line would need an approved translation.

## Photo arrangements, photo pages and the layout matrix

Updated after the matrix review (21 Oct 2026). **At most 4 photos per subject**; validation rejects more, and more can be designed later.

**Minimum photo size.** No photo beside a story, or on a photo page, prints with a shortest side under 30 mm (`theme.json` `photos.minPhotoMm`). The rejected thumbnails measured about 22 mm, and the 2+2 grid you liked has a bottom row of about 32 mm. When an arrangement would go below the minimum, photos move to a photos-only page instead of shrinking.

**Beside the story (landscape):**
- 1 photo: one large photo.
- 2 photos: a **staggered pair**, scrapbook style. One photo sits high on one side and the other low on the other side, tilted a little in opposite directions. The height split between them is chosen so the smaller photo is as large as possible.
- 3 photos: one wide plus two, or two plus one, whichever gives the photos more room.
- 4 photos: the **2+2 grid** when every photo stays at 30 mm or more. Otherwise the seed picks **1+3** (one beside the story, three on a photo page) or **2+2** (two beside, two on a photo page).

**Portrait** is unchanged (story above photos). The same minimum applies, and when it can't be met the photos continue on a photos-only page.

**Photos-only pages** use no grid. Two styles:
- **Washing line:** twine across the page, each photo hanging from one front-facing wooden peg (`rb2-peg-front`, fixed 13 mm; no paper tape). Each photo pivots on its top centre and tilts to the twine's slope there, capped at 7 degrees, so its top edge runs nearly parallel to the twine; where the cap leaves the twine close to a far corner, the photo hangs a little lower. Layers: photo, then twine, then peg, so the peg visibly clips both. The twine's curve is measured from the art by `tools/build_art_assets.py`. If the page is still sparse, a camera animal sits in a free corner.
- **Camera animal:** a scattered arrangement (1 photo centred; 2 high-low or low-high; 3 zigzag or feature; 4 scattered), with the beaver, the squirrel at the tripod or the rabbit with snapshots in a free corner. The arrangements are slot templates in `theme.json` `photos.collage`; portrait swaps the axes.

**Seeded variety (the easter egg).** Every choice with alternatives uses a seed made from the child's code, year and semester. Choices include the 4-photo split, the pair's top side, the photo-page style, the arrangement and the camera animal. Different children get slightly different booklets, while the same report always renders identically, so the preview matches the PDF. Each time an option is used, its weight is multiplied by 0.35. The alternatives become likelier but never certain: a second 4-photo subject, for example, faces odds of 74% / 26%. Every choice and its odds are listed in `out/*.layout.json` under `choices`.

**Layout matrix.** `tools/build_matrix.py` writes a fictional child, "Mira Tan (matrix test)", with 1 to 4 photos in every area, using mixed shapes and every second photo captioned. `tools/build_matrix_review.py` combines the renders into `out/layout-matrix.<orientation>.pdf`, labelling each page with its count, area and layout. Current results:

| Photos per area | Landscape | Portrait |
|---|---|---|
| 1 to 3 | beside the story, one page per area (2 as a staggered pair) | story above photos, one page per area |
| 4 | 2+2 grid beside the story when it stays at 30 mm or more; otherwise 1+3 or 2+2 with a photos-only page (seeded) | story above a 2+2 grid |

## Full report (Avery)

`data/avery-lim-2026-s2-full.json` is written by `tools/extract_avery.mjs` from the same read-only capture, now including all four learning areas:

| Page | Area | Indicator (Semester 1 to 2) | Narrative | Photos (fictional illustrations, no captions) | Landscape | Portrait |
|---|---|---|---|---|---|---|
| 1 | Cover | | | cover garden scene (`fit: "width"`) | cover | cover |
| 2 | English | Beginning to Developing | 92 words, revision 5 | reading corner, story circle | split, photos right | stack, side by side |
| 3 | 中文 | 起步 to 发展中 | 232 characters, revision 6 | garden planting | split, photos left | stack |
| 4 | Mathematics | Beginning to **not assessed** | 103 words, revision 3 | counting stones | split, photos right | stack, mascot beside the photo |
| 5 | Social-emotional | Beginning to **not assessed** | 85 words, revision 3 | sharing snack | split, photos left | stack |

- **No invented content.** The capture has `rating: null` for Mathematics and Social-emotional. The renderer never infers a rating, so the case renders with `preview: true`, and exporting it without preview fails with "choose a learning indicator before creating the PDF". Semester 1 (Beginning) comes from the seed as before.
- **Photo allocation.** There are five distinct new-style scenes besides the cover, so each appears once, matched to its area by theme. That gives 6 images in total, below the baseline's 10-photo demo assumption. The layouts handle 1 to 6 photos per area, as the stress tests show.
- **Page count:** 5 (cover plus one page per area), in both orientations. The baseline's 10-page plan assumes two-page spreads and a page 2 "at a glance", which this template does not use.
- **Decoration per area** (budget of 2 per page): English has the hanging beaver and the falling-letter beaver; 中文 has the vine and the ink rabbit; Mathematics has the squirrel hanging from the willow (landscape) or the willow strands (portrait), plus the number-block squirrel; Social-emotional has the vine (landscape) or the river (portrait), plus the bear and rabbit sharing.
- **The original two-area sample** (`data/avery-lim-2026-s2.json`) is unchanged, so earlier reviews still match.
- **Preview arrow:** a Semester 1 ring pointing to a dashed "Not assessed" ring can read like a step backwards. This appears only in previews, because export is blocked for unassessed areas.

## App integration (built 21 Oct 2026)

The app now exports through this renderer:
- **Panel:** a "Portfolio PDF" panel on each portfolio page with one **Create PDF** button.
- **Dialog:** lists each area's indicator, story and last save, then offers Landscape/Portrait with **Preview** or **Download for parents**.
- **Pipeline** (`src/lib/pdf/export.ts`, route `src/app/api/portfolio/[id]/pdf`):
  - It reads saved records under the viewer's own session (row-level security applies).
  - It downloads the area photos, writes this folder's JSON contract and runs `tools/render.mjs`.
  - It stores the PDF in the private `portfolio-exports` bucket (migration `202610210001_pdf_exports.sql`), keeping only the newest per child, and returns a 10-minute signed link.
- **Export rule (user decision):** a parent copy needs an indicator and a story in every area, plus one confirmation in the dialog. There is no per-area review step. Preview allows missing indicators, which print as dashed rings.
- **Historical local seeding:** an uncommitted `tools/seed_avery_app.mjs` helper populated Avery's local demo records for comparison. It replaces existing sample photos, so it is excluded from this source checkpoint and is not a setup step. Its illustrative indicators followed those sample narratives; no monotonic-progress rule is imposed on real teacher assessment. Baseline sizes are in `compare/README.md`.

## Decisions and document conflicts

These follow the user's review decisions of 21 October 2026, unless marked as open.

1. **No Semester 1 rating, or a Semester 1 report:** only the current ring. This departs from the baseline's "Not recorded".
2. **Not assessed:** export is blocked. This departs from DESIGN_DIRECTION's "Not assessed this semester" print rule; a blocker in the app UI is still to come.
3. **No scale explanation.** The baseline's page 2 ("Learning at a glance") is not built, so subjects start on page 2.
4. **Previous rating on a different scale:** treated like a missing rating, so no comparison ring.
5. **Orientation:** both are supported from one source; the v1 portrait design is retired.
6. **Chinese level labels** (起步, 发展中, 稳定表现, 未评估): my proposed translations, still to be approved. The English canonical name is always printed under them.
7. **Print parity:** landscape pages are complete on their own. In portrait, a subject can take 1 to 3 or more pages, so booklet spreads can shift.

## Content provenance (Avery)

- **Narratives** are copied byte-for-byte by `tools/extract_avery.mjs` from the existing read-only capture `benchmarks/live-classroom/historical-reference.json` (20 Oct 2026). This involved no database access, credentials, AI calls or record changes. They are Draft sample text, not teacher-approved.
- **Semester 1 ratings** and the class come from the `scripts/setup-local.mjs` seed.
- **Every image** in Avery's report, including the cover, is a labelled fictional illustration with no caption. None of them is evidence of an event in Avery's observations.

## Limitations

- **Scope:** only the cover, English and 中文 are reviewed. Mathematics and Social-emotional are configured but have not been rendered with real data.
- **Generated art:** the art is concept art. Codex used OpenAI's image tool, which did not expose its model name; prompts are recorded per file. The scenes are 1926 × 817 px, so the full-page cover prints soft (about 100 to 120 dpi); fine for a sample, but real covers need a sharp photo.
- **Cover crop:** a 2.36:1 illustration cannot fit a 1.41:1 page, so the cover scene loses its right-hand squirrel. Real photos crop around their `focus` point.
- **File size:** PDFs are 2.5 to 6 MB, mostly the transparent river and character PNGs. Palette-quantised PNGs would shrink this if needed.
- **Pinned browser:** Chrome's line breaking decides the layout, so pin the browser build in production.
- **Not audited:** PDF/UA (tagged PDF is on). Real teacher photos, paper printing and a native reader's review of the Chinese pages are still unchecked.
