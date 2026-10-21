# rb2-beaver-swing-sheet

- **Index:** #37, phase 6 app animation frames (AI drafting set)
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-beaver-swing-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-beaver-hanging-willow.png` (character on a strand), `ref-sheet-swing.png` (layout)
- **Used in the app:** English drafting animation: loops while the AI drafts the English narrative.

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame swinging loop of the beaver hanging from a single willow strand, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). In every cell the strand starts at exactly the middle of the cell's top edge; the beaver hangs from it with one paw, the other paw free, tail and feet trailing. Frame 1: swung out to the left, body trailing, gleeful face. Frame 2: passing the middle, body straight below the pivot. Frame 3: swung out to the right. Frame 4: passing the middle again on the way back. Pure joy, playing.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Strand starts at the middle of each cell's top edge (follow ref-sheet-swing.png)
- Same beaver, same size in every cell
- One strand only, slender willow like the banner

## Avoid
- Letters or anything falling (that happens in the finish frame)
- Other plants or ground
- Cell borders, numbers or labels
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame swinging loop of the beaver hanging from a single willow strand, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). In every cell the strand starts at exactly the middle of the cell's top edge; the beaver hangs from it with one paw, the other paw free, tail and feet trailing. Frame 1: swung out to the left, body trailing, gleeful face. Frame 2: passing the middle, body straight below the pivot. Frame 3: swung out to the right. Frame 4: passing the middle again on the way back. Pure joy, playing.

  Render on a TRUE SQUARE 1024x1024 transparent canvas as four equal invisible square cells. In each cell, the ONE slender willow strand enters at the exact horizontal centre of the cell's top edge. Same beaver proportions and size in every cell; only the swing angle and body pose change. No letters, ribbon, borders, red pivot dots, labels, guide lines, motion lines, ground or extra plants.
  ```
- References attached: `ref-sheet-swing.png`, `rb2-beaver-hanging-willow.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Four swing poses around matching willow pivots; square canvas and clean transparent background.
