# rb2-rabbit-write-sheet

- **Index:** #35, phase 6 app animation frames
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-rabbit-write-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-rabbit-brush.png` (composition and pose), `ref-sheet-grid.png` (layout)
- **Used in the app:** AI drafting: while the narrative draft is generating, the app loops these frames and draws the ink strokes on the paper itself.

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame writing loop of the rabbit with a Chinese calligraphy brush (毛笔), using the SAME composition, scale and camera as rb2-rabbit-brush.png: rabbit sitting, small sheet of cream rice paper in front of it, small round inkstone beside the paper, all in the same places in every frame. The rabbit's fur is CLEAN and white: no ink anywhere on it. The paper stays completely BLANK in every frame (the app draws the strokes). Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: brush raised above the paper, rabbit studying the paper, tongue tip out in concentration. Frame 2: brush tip touching the paper at its left end. Frame 3: brush sweeping to the right, body leaning with the stroke. Frame 4: brush lifting at the right end, small satisfied smile.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Paper blank and clean fur in every frame
- Rabbit, paper and inkstone in the same positions in every cell
- Brush clearly a Chinese 毛笔

## Avoid
- Any ink on the paper or the fur
- Any characters, letters or numbers
- Cell borders, numbers or labels
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame writing loop of the rabbit with a Chinese calligraphy brush (毛笔), using the SAME composition, scale and camera as rb2-rabbit-brush.png: rabbit sitting, small sheet of cream rice paper in front of it, small round inkstone beside the paper, all in the same places in every frame. The rabbit's fur is CLEAN and white: no ink anywhere on it. The paper stays completely BLANK in every frame (the app draws the strokes). Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: brush raised above the paper, rabbit studying the paper, tongue tip out in concentration. Frame 2: brush tip touching the paper at its left end. Frame 3: brush sweeping to the right, body leaning with the stroke. Frame 4: brush lifting at the right end, small satisfied smile.

  Critical layout: a true 1024x1024 square sheet divided into four equal invisible 512x512 cells. Scale each complete scene to fit WITHIN its cell, leaving at least 35px transparent margin around the rabbit, entire rectangular paper including all four corners, and inkstone. No object may cross or be cropped by the center axes or outer canvas edge. Rabbit, paper and inkstone must have identical scale and positions in every cell; ONLY the brush/hand pose changes. All four paper surfaces completely blank. The rabbit's cream fur perfectly clean. No text, letters, numbers, stroke, ink splatter, ground, borders, grid marks, labels, motion lines, haze or sticker outline.
  ```
- References attached: `ref-sheet-grid.png`, `rb2-character-sheet.png`, `rb2-rabbit-brush.png`, `ref-style-banner.png`
- Edits or notes: Regenerated with all four papers fully inside equal cells; resized to 1024 square and removed stray pixels. Paper blank, fur clean.
