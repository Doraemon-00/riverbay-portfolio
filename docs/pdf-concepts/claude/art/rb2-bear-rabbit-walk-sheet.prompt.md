# rb2-bear-rabbit-walk-sheet

- **Index:** #41, phase 6 app animation frames (AI drafting set)
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-bear-rabbit-walk-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-bear-rabbit-sharing.png` (characters, basket and mat colours), `ref-sheet-grid.png` (layout)
- **Used in the app:** Social-emotional drafting animation: the pair walks across the panel (the app moves them) while the AI drafts.

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame walking loop of the bear and the rabbit walking together side by side, full side view facing RIGHT, the rabbit on the near side. The bear carries a rolled-up peach checked picnic mat under one arm (the same mat as in rb2-bear-rabbit-sharing.png); the rabbit carries the same small woven basket. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frames 1-4 are a calm walk cycle: 1 contact (front feet forward), 2 passing (feet together, bodies slightly up), 3 contact with the other feet, 4 passing again. They glance at each other happily.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Both characters walking in step, feet on the ground line
- Same size and position of the pair in every cell
- Mat and basket match rb2-bear-rabbit-sharing.png

## Avoid
- Ground, grass or scenery
- Moving the pair across the cell (the app does that)
- Cell borders or labels
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame walking loop of the bear and the rabbit walking together side by side, full side view facing RIGHT, the rabbit on the near side. The bear carries a rolled-up peach checked picnic mat under one arm (the same mat as in rb2-bear-rabbit-sharing.png); the rabbit carries the same small woven basket. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frames 1-4 are a calm walk cycle: 1 contact (front feet forward), 2 passing (feet together, bodies slightly up), 3 contact with the other feet, 4 passing again. They glance at each other happily.

  Output a true square 1024x1024 transparent PNG, 2x2 grid of equal invisible cells. Same pair, same individual sizes, same body positions and same props in each cell; only leg positions change. Frame 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right. Full side view both facing RIGHT, bear behind, rabbit near side. No ground, grass, scenery, borders, numbers, guide lines, motion lines, text, haze, glow or sticker outline.
  ```
- References attached: `ref-sheet-grid.png`, `rb2-bear-rabbit-sharing.png`, `rb2-character-sheet.png`, `ref-style-banner.png`
- Edits or notes: Four walk poses with pair and props in stable positions; stray-pixel cleanup verified.
