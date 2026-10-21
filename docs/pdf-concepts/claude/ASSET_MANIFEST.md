# Asset manifest (template v2)

Every file the template or the sample data uses. Paths are relative to this concept folder. Byte sizes, pixel sizes and SHA-256 hashes for every file under `assets/` are in [`assets/manifest.generated.json`](assets/manifest.generated.json), written by `tools/build_assets.py`. Pixel sizes and crop boxes for the new art are in [`assets/art/build-report.json`](assets/art/build-report.json).

No image is a photograph, and no image shows a real child or person.

Classification:

- **Decorative:** template art, the same for every child.
- **Indicator:** a canonical learning ring, always printed with a text label.
- **Illustrative (fictional):** a stand-in for a teacher photo in sample data. The page prints a "Sample illustration" / "示例插图" chip on it, and it is not evidence of any event in Avery's observations.

## 1. Canonical brand files (byte copies, `tools/build_assets.py`)

| Stable path | Source (`../../design-assets/riverbay/`) | Used on | Class |
|---|---|---|---|
| `assets/brand/rings/ring-beginning.svg` | `rings/ring-beginning.svg` | Ring for level 1 (current or Semester 1) | Indicator |
| `assets/brand/rings/ring-developing.svg` | `rings/ring-developing.svg` | Ring for level 2 | Indicator |
| `assets/brand/rings/ring-consistently-shown.svg` | `rings/ring-consistently-shown.svg` | Ring for level 3 | Indicator |
| `assets/brand/rings/ring-unassessed.svg` | `rings/ring-unassessed.svg` | Dashed ring, `--preview` drafts only (export is blocked) | Indicator |
| `assets/brand/mark/riverbay-logo.svg` | `mark/riverbay-logo.svg` | Cover | Decorative |
| `assets/brand/tokens/riverbay-tokens.css` | `tokens/riverbay-tokens.css` | All pages (colour tokens) | Tokens |

The v1 cut-out copies (characters, botanicals, decor, props) are no longer used and were removed from the build.

## 2. New banner-style art (`rb2-*`)

**Generation.** Codex generated these on 21 Oct 2026 with OpenAI's image tool (`image_gen`). The tool did not expose a model name.

- **Brief:** [`art/_STYLE.md`](art/_STYLE.md) (style block, character identities, rules).
- **Per-asset prompt files:** `art/rb2-<name>.prompt.md`. Each "Result" section records the final prompt used, the references attached and any notes.
- **References:** `art/ref-*.png`, built by `tools/build_art_refs.py` from canonical Riverbay art. That covers a style reference (a copy of `source/banner-riverbank.png`), an identity sheet, the palette and placement diagrams.
- **Review:** Claude's review is [`art/_REVIEW.md`](art/_REVIEW.md). Five assets were regenerated after it.

**Processing** (`tools/build_art_assets.py`, deterministic):

- Trim to the visible subject (alpha > 12).
- Crop opaque scenes: an empty left band is detected by a column profile.
- Resize to about 240 dpi at the largest printed size, never upscaling.
- Mirror where listed.
- Only rows marked `done` in `art/_INDEX.md` are processed.

| Processed file(s) in `assets/art/` | Source `art/…` | Edits | Used on | Class |
|---|---|---|---|---|
| `rb2-beaver-hanging-willow.png`, `.mirrored.png` | `rb2-beaver-hanging-willow.png` | trim, 372×898, mirror; grip point in `anchors.json` | English lane: holds the outer photo corner | Decorative |
| `rb2-squirrel-hanging-willow.png`, `.mirrored.png` | same name | trim, mirror, grip | Mathematics lane (configured) | Decorative |
| `rb2-vine-edge.png`, `.mirrored.png` | same name | trim to vine strip, mirror; stacked copies from the meadow to the top edge (stem at 18.1% of the width at the bottom, 37.4% at the top) | 中文 lane when the budget allows; fallback lane | Decorative |
| `rb2-bear-climbing-vine.png`, `.mirrored.png` | same name | trim, mirror | Social-emotional lane (configured) | Decorative |
| `rb2-willow-drop.png` | same name | trim | Top of English and Mathematics pages | Decorative |
| `rb2-garland-top.png` | same name | trim | Top of 中文 pages, both covers | Decorative |
| `rb2-garland-bottom.png` | derived from `rb2-garland-top.png` | flipped vertically; cut at x = 1527 where the vine returns to its starting height (error 5 px) so it repeats seamlessly; 1527×288 | Bottom border on every page (13 mm, repeated) | Decorative |
| `rb2-meadow-border.png` | same name (regenerated) | trim | Not used (too busy as a border); kept for reference | Decorative |
| `rb2-river-landscape.png`, `rb2-river-portrait.png` | same names | none | Behind the 中文 photos; illustrated cover | Decorative (background, never behind text) |
| `rb2-beaver-letters.png` | same name (regenerated) | trim | English mascot under the story | Decorative |
| `rb2-rabbit-brush.png` | same name | trim | 中文 mascot | Decorative |
| `rb2-squirrel-numbers.png` | same name (regenerated) | trim | Mathematics mascot (configured) | Decorative |
| `rb2-bear-rabbit-sharing.png` | same name | trim | Social-emotional mascot (configured) | Decorative |
| `rb2-beaver-squirrel-waving.png` | same name | trim | Illustrated cover fallback (no cover photo) | Decorative |
| `rb2-squirrel-running.png`, `rb2-rabbit-hopping.png` | same names | trim | Small runners on the meadow (cover, 中文) | Decorative |
| `rb2-squirrel-peeking.png` | same name | trim (straight cut at the paw line) | Stack layouts, on a photo's top edge, when space allows | Decorative |
| `rb2-flower-accent.png` | same name | trim | Icon beside headings | Decorative |
| `rb2-scene-cover-garden.jpg` | same name | none; shown whole with `fit: "width"` | Avery's cover photo slot | Illustrative (fictional) |
| `rb2-scene-reading-corner.jpg`, `.mirrored.jpg` | same name | crop empty left (1112×817), mirror | Avery English photo 1; Ellis English photo 1 (mirrored) | Illustrative (fictional) |
| `rb2-scene-story-circle.jpg`, `.mirrored.jpg` | same name | crop empty left, mirror | Avery English photo 2; Ellis English photo 4 (mirrored) | Illustrative (fictional) |
| `rb2-scene-garden-planting.jpg`, `.mirrored.jpg` | same name | crop empty left, mirror | Avery 中文 photo 1; Ellis English photo 3 (mirrored) | Illustrative (fictional) |
| `rb2-scene-counting-stones.jpg` | same name (regenerated, portrait) | none | Avery 中文 photo 2; Ellis 中文 photo 1 | Illustrative (fictional) |
| `rb2-scene-sharing-snack.jpg` | same name (regenerated, square) | none | Avery 中文 photo 3; Ellis English photo 2 | Illustrative (fictional) |

| `rb2-beaver-camera.png` | same name | trim | Photos-only pages: camera animal (aims right, prefers the left side) | Decorative |
| `rb2-squirrel-tripod.png` | same name | trim | Photos-only pages: camera animal (faces left, prefers the right side) | Decorative |
| `rb2-rabbit-snapshots.png` | same name | trim | Photos-only pages: camera animal (blank snapshot cards) | Decorative |
| `rb2-photo-line.png` | same name | trim; twine centre line measured into `anchors.json` (21 samples) | Photos-only pages: washing line across the page | Decorative |
| `rb2-peg.png` | same name | trim | Not used since the front-facing peg arrived (side view); kept for reference | Decorative |
| `rb2-peg-front.png` | same name | trim | One front-facing peg per photo on the washing line, 13 mm, rotated with the photo | Decorative |

The photo-page assets (#26 to #30, and #31 `rb2-peg-front` requested after review) were generated by Codex on 21 Oct 2026 from the prompt files written by `tools/write_art_prompts.py`, and measured clean (0% halo). `tools/render.mjs` switches each photo-page style on only when its files exist.

`art/rb2-character-sheet.png` is the identity reference only, and is not placed in the report. Files named `art/*.alt*.png` are unused alternatives.

## 3. v1 fictional crops kept for stress tests (`assets/illustrations/`)

`tools/build_assets.py` builds these from `source/signin-scrapbook-concept-v1.png` and `source/banner-riverbank.png` (fixed crop boxes) and from v1 cut-outs (fixed composites); the details are in that script. Only `data/tests/long-content.json` and `data/tests/semester1-crops.json` use them, chosen for their extreme aspect ratios: `scene-willow-tall.jpg` is 0.51:1, while `scene-scrapbook-pages.jpg` and `scene-river-stones.jpg` are panoramas. All are fictional illustrations, and `semester1-crops` labels one of them as a `placeholder`.

## 4. Photo and caption slots in the sample data

| Data file | Slot | Asset | Caption |
|---|---|---|---|
| Avery (`data/avery-lim-2026-s2.json`) | `cover_photo` | rb2-scene-cover-garden | n/a |
| | `english_photos[0..1]` | reading-corner, story-circle | none (no teacher captions exist; none invented) |
| | `chinese_photos[0..2]` | garden-planting, counting-stones, sharing-snack (wide on top, two below) | none |
| Ellis (fictional) | `cover_photo` | none: the illustrated fallback is tested on purpose | n/a |
| | `english_photos[0..3]` | reading-corner (mirrored), sharing-snack, garden-planting (mirrored), story-circle (mirrored) | 3 of 4, fixture text |
| | `chinese_photos[0]` | counting-stones | fixture text |

Captions for Ellis and the test children describe fictional children only.

## 5. Fonts (embedded in every PDF)

| Path | Source | Licence | Transformation |
|---|---|---|---|
| `assets/fonts/static/nunito-{700,800}-*.woff2` | `@fontsource-variable/nunito` 5.3.0 (installed app dependency) | OFL-1.1 | `tools/build_fonts.py`: static instances, names set to Nunito Bold/ExtraBold |
| `assets/fonts/static/noto-sans-sc-{400,700}/*.woff2` | `@fontsource-variable/noto-sans-sc` 5.3.1 | OFL-1.1 | static instances of all 101 unicode-range subsets |
| `assets/fonts/dm-sans/dm-sans-{400,600}.woff2` | `public/assets/` (app runtime copy) | OFL-1.1 | copied |
| `assets/fonts/fonts.css` | generated | n/a | local `@font-face` rules only |

Neither OFL licence declares a Reserved Font Name, and the licence files travel with the fonts.
