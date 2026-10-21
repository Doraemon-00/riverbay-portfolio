# rb2-squirrel-run-sheet

- **Index:** #32, phase 6 app animation frames
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-squirrel-run-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-sheet-grid.png` (layout), `rb2-squirrel-running.png` (pose and acorn)
- **Used in the app:** Loading animation and the logo run: the app flips through the 4 frames while moving the squirrel along the meadow (about 40-60 mm wide on screen).

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame running cycle of the squirrel, full side view facing RIGHT, the same character and acorn as rb2-squirrel-running.png, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1 contact: front paws reach forward and touch the ground line, hind legs stretched back, tail streaming up. Frame 2 gather: body compressed and round, all four paws bunched under the body, tail curling high. Frame 3 push-off: hind legs extended back pushing off, front paws tucked, body stretched forward. Frame 4 flight: all paws off the ground (just above the line), body long, tail streaming back. The acorn stays tucked under the same arm in every frame.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Same squirrel, same size, same body position in every cell
- Feet on the same baseline in frames 1-3 (follow ref-sheet-grid.png)
- Facing right in every frame

## Avoid
- Cell borders, numbers or labels
- Ground, grass, motion lines or dust
- Changing size or drifting position between frames
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame running cycle of the squirrel, full side view facing RIGHT, the same character and acorn as rb2-squirrel-running.png, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1 contact: front paws reach forward and touch the ground line, hind legs stretched back, tail streaming up. Frame 2 gather: body compressed and round, all four paws bunched under the body, tail curling high. Frame 3 push-off: hind legs extended back pushing off, front paws tucked, body stretched forward. Frame 4 flight: all paws off the ground (just above the line), body long, tail streaming back. The acorn stays tucked under the same arm in every frame.

  Render on a TRUE SQUARE 1024x1024 transparent canvas: four equal 512x512 invisible cells, one pose in each cell, with identical head and torso size and matching body centre and foot baseline. The four cells must contain no borders, labels, guide lines, ground or motion lines.
  ```
- References attached: `ref-sheet-grid.png`, `rb2-squirrel-running.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Four-frame square sheet; lower row aligned; transparent edge and stray-pixel cleanup verified.
