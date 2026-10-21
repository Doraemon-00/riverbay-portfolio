# rb2-beaver-swing-finish

- **Index:** #38, phase 6 app animation frames (AI drafting set)
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-beaver-swing-finish.png` (this folder)
- **Canvas:** 1024x1536 (same canvas as rb2-beaver-letters.png)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-beaver-letters.png` (end state and composition), `rb2-beaver-swing-sheet.png` (swinging pose)
- **Used in the app:** English drafting finish: plays once when the draft arrives, then hands over to rb2-beaver-letters.png (the letter bonks its head).

## Prompt (after the style block and character identity line from `_STYLE.md`)

The accident, in exactly the same canvas and layout as rb2-beaver-letters.png: the beaver, still hanging from the same single willow strand, has swung too far and its free paw has snagged a thin ribbon dangling from the top edge of the image. The ribbon has just come loose: a big chunky capital letter A (rounded, butter-yellow, soft toy style) is dropping from the top, above the beaver's head but not touching it yet, and a smaller lowercase letter a (mint green, same style) is starting to tumble beside it. The beaver looks up, eyes wide, mouth in a little 'oh!'. The next moment (rb2-beaver-letters.png) the A bonks its head.

## Must
- Same canvas and strand position as rb2-beaver-letters.png
- EXACTLY one capital A and one lowercase a
- The A clearly above the head, not touching it yet
- The loose ribbon visible near the top

## Avoid
- Any other letters, words or numbers
- Stars or dizzy symbols
- A second strand or other plants
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  The accident, in exactly the same canvas and layout as rb2-beaver-letters.png: the beaver, still hanging from the same single willow strand, has swung too far and its free paw has snagged a thin ribbon dangling from the top edge of the image. The ribbon has just come loose: a big chunky capital letter A (rounded, butter-yellow, soft toy style) is dropping from the top, above the beaver's head but not touching it yet, and a smaller lowercase letter a (mint green, same style) is starting to tumble beside it. The beaver looks up, eyes wide, mouth in a little 'oh!'. The next moment (rb2-beaver-letters.png) the A bonks its head.

  Output exactly 1024x1536 portrait transparent PNG. Match rb2-beaver-letters.png as a coordinate map: one willow strand at the same left-side x position, the beaver at the same lower-middle size and position, the capital A above the beaver and the smaller lowercase a to its right. In this prior moment the A has not touched the head yet. Exactly those two letters and no other text or symbols.

  Follow-up edit prompt:
  Make a minimal edit to the first attached draft image. Add ONLY a thin peach ribbon visibly dangling from the top edge near the falling capital A. Its lower end has just come loose from the beaver's free paw. Keep the beaver, single willow, capital A, lowercase a, every position, size, colour, and expression unchanged. Preserve the exact 1024x1536 portrait transparent canvas, clean transparency, and picture-book style. No other marks or text.
  ```
- References attached: `rb2-beaver-letters.png`, `rb2-beaver-swing-sheet.png`, `rb2-character-sheet.png`, `ref-style-banner.png`; follow-up edit also attached the new draft `rb2-beaver-swing-finish.png`
- Edits or notes: A and a placed above/beside the beaver; a minimal imagegen follow-up added a loose ribbon. Exact portrait canvas and transparent cleanup verified.
