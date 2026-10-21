# rb2-rabbit-hop-sheet

- **Index:** #33, phase 6 app animation frames
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-rabbit-hop-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-sheet-grid.png` (layout), `rb2-rabbit-hopping.png` (pose)
- **Used in the app:** Loading animation: the rabbit hops behind the squirrel (about 40-60 mm wide on screen).

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame hop cycle of the rabbit, full side view facing RIGHT, the same character as rb2-rabbit-hopping.png, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1 crouch: body low and round, legs folded, ears tipped back a little. Frame 2 push-off: hind legs extending, body angled up and forward, ears flowing back. Frame 3 airborne: body fully stretched, front paws reaching forward, hind legs straight back, ears streaming back, feet slightly above the line. Frame 4 landing: front paws touching down, hind legs swinging forward under the body, ears bouncing forward.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Same rabbit, same size, centred in every cell
- Both ears visible in every frame, one gently bent
- Do not lift the rabbit high in frame 3: the app adds the jump height

## Avoid
- Cell borders, numbers or labels
- Ground, grass, motion lines or dust
- Carrot or other props
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame hop cycle of the rabbit, full side view facing RIGHT, the same character as rb2-rabbit-hopping.png, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1 crouch: body low and round, legs folded, ears tipped back a little. Frame 2 push-off: hind legs extending, body angled up and forward, ears flowing back. Frame 3 airborne: body fully stretched, front paws reaching forward, hind legs straight back, ears streaming back, feet slightly above the line. Frame 4 landing: front paws touching down, hind legs swinging forward under the body, ears bouncing forward.

  Render on a TRUE SQUARE 1024x1024 transparent canvas as four equal invisible square cells. Keep the rabbit's head and torso at the same scale and centred on the same spot in every cell; only ears, legs and body pose change. Keep the feet near one shared baseline, with frame 3 only slightly airborne. Draw no cell borders, labels, guide lines, ground, dust or motion lines.
  ```
- References attached: `ref-sheet-grid.png`, `rb2-rabbit-hopping.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Four-frame square sheet; lower row aligned; transparent edge and stray-pixel cleanup verified.
