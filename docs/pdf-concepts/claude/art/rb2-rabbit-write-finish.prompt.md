# rb2-rabbit-write-finish

- **Index:** #36, phase 6 app animation frames
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-rabbit-write-finish.png` (this folder)
- **Canvas:** 1536x1024 (same canvas as rb2-rabbit-brush.png)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-rabbit-brush.png` (composition, end state), `rb2-rabbit-write-sheet.png` (clean pose)
- **Used in the app:** AI drafting finish: plays once when the draft arrives, between the writing loop and the ink-speckled end image rb2-rabbit-brush.png.

## Prompt (after the style block and character identity line from `_STYLE.md`)

The finishing moment, in exactly the same composition, scale and positions as rb2-rabbit-brush.png: the rabbit has just completed one bold horizontal stroke 一 on the rice paper and flicks the brush up in triumph. A few small black ink droplets fly through the air, and the first ones are landing on its white fur and cheek. Eyes squeezed shut in a proud grin. This frame sits between the clean writing frames and the ink-speckled rb2-rabbit-brush.png, so its ink speckles should be fewer than in that image and in matching places.

## Must
- Same canvas, composition and positions as rb2-rabbit-brush.png
- Only ONE character on the paper: the stroke 一
- Droplets visibly mid-air

## Avoid
- Any other characters, letters or numbers
- Big ink puddles
- Changing the paper or inkstone position
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  The finishing moment, in exactly the same composition, scale and positions as rb2-rabbit-brush.png: the rabbit has just completed one bold horizontal stroke 一 on the rice paper and flicks the brush up in triumph. A few small black ink droplets fly through the air, and the first ones are landing on its white fur and cheek. Eyes squeezed shut in a proud grin. This frame sits between the clean writing frames and the ink-speckled rb2-rabbit-brush.png, so its ink speckles should be fewer than in that image and in matching places.

  Output exactly 1536x1024 landscape transparent PNG. Use the attached rb2-rabbit-brush.png as the position and scale map: rabbit on the same right-side coordinates, paper and inkstone at the same coordinates, no added scenery. The paper has exactly one horizontal black ink stroke 一 and nothing else written on it. Fewer ink speckles on the fur than the reference; a few droplets are mid-air.
  ```
- References attached: `rb2-rabbit-brush.png`, `rb2-rabbit-write-sheet.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: One horizontal ink stroke; same landscape composition as rabbit brush end image; clean transparent background.
