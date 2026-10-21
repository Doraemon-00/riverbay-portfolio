# rb2-squirrel-count-finish

- **Index:** #40, phase 6 app animation frames (AI drafting set)
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-squirrel-count-finish.png` (this folder)
- **Canvas:** 1536x1024 (same canvas as rb2-squirrel-numbers.png)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-squirrel-numbers.png` (end state and composition), `rb2-squirrel-count-sheet.png` (counting pose)
- **Used in the app:** Mathematics drafting finish: plays once when the draft arrives, then hands over to rb2-squirrel-numbers.png.

## Prompt (after the style block and character identity line from `_STYLE.md`)

The 'got it!' moment, with the squirrel at the same size and position as in rb2-squirrel-numbers.png: it jumps up with both paws in the air, tail fanned out, overjoyed. The three acorns are bouncing up into the air around it, each one surrounded by a small soft puff, as if they are about to turn into the number blocks of the next image (rb2-squirrel-numbers.png). Place the three acorns roughly where the 1 (above the head), the 2 (in front of its chest) and the 3 (on the tail) are in that image.

## Must
- Same canvas, size and position as rb2-squirrel-numbers.png
- Three acorns placed where the 1, 2 and 3 blocks will be
- Small soft puffs, not explosions

## Avoid
- Any numbers or symbols
- Sparkles that look like stars
- Ground or scenery
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  The 'got it!' moment, with the squirrel at the same size and position as in rb2-squirrel-numbers.png: it jumps up with both paws in the air, tail fanned out, overjoyed. The three acorns are bouncing up into the air around it, each one surrounded by a small soft puff, as if they are about to turn into the number blocks of the next image (rb2-squirrel-numbers.png). Place the three acorns roughly where the 1 (above the head), the 2 (in front of its chest) and the 3 (on the tail) are in that image.

  Output exactly 1536x1024 landscape transparent PNG. Match the squirrel's scale and location to rb2-squirrel-numbers.png as a coordinate map. There must be exactly three acorns: one above head, one at chest, one on the OUTER curl of the tail. Absolutely no numbers, number blocks, digits, letters, symbols, motion lines, haze, glow, shadow, ground or grass.
  ```
- References attached: `rb2-squirrel-numbers.png`, `rb2-squirrel-count-sheet.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Three airborne acorns at transition positions; no digits; cleaned transparent background.
