# Riverbay art brief (shared by every prompt file)

## Context
Riverbay is a **fictional** preschool. Its theme is a Riverbank Garden with four friendly animals: beaver (mascot), squirrel, bear and rabbit. These images go into a parent-facing semester **portfolio PDF** (A4, portrait and landscape) that teachers create for each child. The art is decoration and sample imagery: it must feel playful, cute and warm, but stay calm and readable. Real children never appear in generated art; teachers add real photos separately.

The style to match is **`ref-style-banner.png`**: thinner, even outlines, flat matte pastel fills and animals doing something. The older cut-outs in `ref-identity-characters.png` only tell you who each character is. **Do not copy their thicker crayon style.**

## Motifs the pages are built from
- **Willow strands dropping from the top**, like the willow at the top right of the banner. They hang partway down, never to the bottom. Animals hang from them and hold photos: the beaver with a paw, the squirrel with its tail.
- **An edge vine** climbing straight up the page edge on the same side as the photos, gently curly, never diagonal.
- **A winding river** entering at the top right and leaving at the bottom left, as a pale background layer. Photos, animals and plants sit in front of it.
- **A top garland and a bottom meadow**, which small animals run and hop along.
- **Subject mascots with a playful moment:** English, the beaver bonked by a falling letter A; 中文, the rabbit with a 毛笔 and ink-speckled fur; Mathematics, the squirrel juggling number blocks 1, 2 and 3; Social-emotional, animals together.

## Style block (prepend to every image prompt, word for word)

> Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

## Characters (identity)

> Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

After `rb2-character-sheet.png` is approved, attach it to every later prompt as the identity reference, so all images show the same four characters.

## Technical rules
- **Transparent assets:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- Keep a clean empty margin, unless a prompt file says the subject must touch an edge (willow, vines, garland, border, river, peeking squirrel).
- **Canvas:** use the size given in each prompt file, or the closest size the tool supports. The proportions of the drawing matter; Claude trims empty space afterwards.
- **Scenes** (`rb2-scene-*`) are opaque and fill the canvas. They stand in for teacher photos in sample reports and are always labelled as illustrations.

## Hard no
Text, letters, numbers, Chinese characters, symbols, logos, watermarks, signatures, people, children, human hands, photorealism, 3D, glossy or airbrushed shading, drop shadows, gradients, neon or saturated colours, dense clutter.

**The only exceptions** are the subject mascots and their animation frames, and only exactly what is listed here:
- `rb2-beaver-letters`: one capital A and one lowercase a.
- `rb2-squirrel-numbers`: the number blocks 1, 2 and 3.
- `rb2-rabbit-brush`: the single ink stroke 一.
- `rb2-rabbit-write-finish`: the same single ink stroke 一 (the writing sheet's paper stays blank).
- `rb2-beaver-swing-finish`: one capital A and one lowercase a (the swinging sheet has no letters).
- The counting squirrel (`rb2-squirrel-count-sheet`, `rb2-squirrel-count-finish`) has NO numbers: the app draws the counting.

## Animation frame sheets (phase 6)
The app flips through these frames like a flipbook, so consistency matters more than anything else.
- **One image per sheet:** draw all frames in a single generation, not as separate images, so the character stays identical.
- **Layout:** 2 x 2 equal cells, read left to right, top to bottom (frame 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right). Follow `ref-sheet-grid.png`, or `ref-sheet-swim.png` for the swimming beaver.
- **Same everything except the pose:** same character, size and line weight, body centred on the same spot in every cell, feet (or the waterline) at the same height.
- **No helpers drawn:** no cell borders, frame numbers, guide lines, motion lines or ground.
- **Movement across the screen is done by the app:** draw the character in place; do not move it around the cell or raise it high for jumps.
- Transparent background as for every other asset.

**AI drafting sets.** Each subject has a loop sheet that plays while the AI drafts and a finish frame that hands over to that subject's existing image, so the story ends where the art already is:

| Subject | Loop (while drafting) | Finish (once, when the draft arrives) | Ends on (existing) |
|---|---|---|---|
| English | `rb2-beaver-swing-sheet` | `rb2-beaver-swing-finish` | `rb2-beaver-letters` |
| 中文 | `rb2-rabbit-write-sheet` | `rb2-rabbit-write-finish` | `rb2-rabbit-brush` |
| Mathematics | `rb2-squirrel-count-sheet` | `rb2-squirrel-count-finish` | `rb2-squirrel-numbers` |
| Social-emotional | `rb2-bear-rabbit-walk-sheet` | `rb2-bear-rabbit-mat-finish` | `rb2-bear-rabbit-sharing` |

A finish frame must use the same canvas, scale and positions as its end image, so the hand-over looks continuous.

## Files and workflow (all in this one folder, no subfolders)
1. Work through `_INDEX.md` in order. **Generate #1 (`rb2-character-sheet`) first, then stop** until the user approves it.
2. For each asset, read its `rb2-<name>.prompt.md`. The final image prompt is the style block above, then the character identity line (for images with animals), then the prompt text in that file.
3. Attach the reference images listed in the prompt file. They are all in this folder.
4. Save the result in this folder as exactly `rb2-<name>.png`. Save alternatives as `rb2-<name>.alt1.png`, `rb2-<name>.alt2.png`, and so on; Claude uses only the exact name.
5. Fill in the **Result** section of that prompt file: tool and model, date, final prompt used, references attached and any edits.
6. Update the status in `_INDEX.md`: `pending`, `done`, `redo` (with a reason) or `skipped` (with a reason).
7. Do not edit, move or delete any file outside this folder, or any `ref-*.png`.
