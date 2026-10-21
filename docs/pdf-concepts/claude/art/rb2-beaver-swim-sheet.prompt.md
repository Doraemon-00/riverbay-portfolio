# rb2-beaver-swim-sheet

- **Index:** #34, phase 6 app animation frames
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-beaver-swim-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-sheet-swim.png` (waterline layout)
- **Used in the app:** Logo easter egg: the beaver swims along the stream under the top bar (about 30-45 mm wide on screen).

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame swimming cycle of the beaver seen from the side, facing RIGHT, as if swimming in a stream: only the part above the water is drawn, and every frame is cut by the same perfectly straight horizontal waterline (nothing below it). Show the head, the top of the back and, behind, the flat crosshatched tail. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: head up, nose raised, eyes bright. Frame 2: head dipping slightly forward, a tiny splash at the nose. Frame 3: head lowest, cheeks puffed, tail tip lifting out of the water behind. Frame 4: rising again, tail giving a light slap with two or three small powder-blue droplets. Two short powder-blue ripple marks sit on the waterline at the front and back of the body.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Same straight waterline height in every cell (follow ref-sheet-swim.png)
- Nothing drawn below the waterline
- Same beaver, same size, same position in every cell

## Avoid
- Drawing the water body, a river bank or background
- Legs or underwater parts
- Cell borders, numbers or labels
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame swimming cycle of the beaver seen from the side, facing RIGHT, as if swimming in a stream: only the part above the water is drawn, and every frame is cut by the same perfectly straight horizontal waterline (nothing below it). Show the head, the top of the back and, behind, the flat crosshatched tail. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: head up, nose raised, eyes bright. Frame 2: head dipping slightly forward, a tiny splash at the nose. Frame 3: head lowest, cheeks puffed, tail tip lifting out of the water behind. Frame 4: rising again, tail giving a light slap with two or three small powder-blue droplets. Two short powder-blue ripple marks sit on the waterline at the front and back of the body.

  Correct the attached draft: each of the four 512x512 cells must have exactly the SAME perfectly straight horizontal lower cut at the same relative y-coordinate (about 72% down each cell). Remove all wavy blue water curves, splashes or marks that hang below that cut. There must be ZERO drawing below the straight cut in every cell: fully transparent empty pixels only. Keep the head, upper back, crosshatched tail and the small permitted splash or droplets ABOVE the cut. Match the beaver's scale and horizontal location in every cell. No guides, borders or labels. Keep a true square canvas.
  ```
- References attached: `rb2-beaver-swim-sheet.png`, `ref-sheet-swim.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Four swim poses; aligned 2x2 square cells; shared straight waterline and transparent cutoff beneath it.
