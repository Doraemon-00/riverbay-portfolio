# rb2-beaver-peek-side

- **Index:** #43, phase 7 app easter egg
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-beaver-peek-side.png` (this folder)
- **Canvas:** 1024x1536 (portrait, or closest supported)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-placement-peeking-side.png` (where the cut edge is), `rb2-squirrel-peeking.png` (the same kind of peek, rotated to a side edge)
- **Used in the app:** Slides out sideways from behind the Riverbay logo in the top bar when the pointer rests on the logo. Shown about 44 px tall, so the shapes must stay readable when small.

## Prompt (after the style block and character identity line from `_STYLE.md`)

The beaver peeking out sideways from behind a straight vertical edge on the LEFT side of the image, upright (not lying down or tilted over). Only part of it is visible: its head, turned so its face looks at the viewer with curious, happy eyes and its two small front teeth showing in a little grin, and both front paws curled around the left edge as if holding on to it. The tip of its crosshatched paddle tail may peek out lower down. The left edge of the image cuts the beaver cleanly in one straight vertical line; nothing is drawn left of it, as if the rest of its body is hidden behind a wall. Keep the beaver in the upper two thirds of the canvas, with the paws touching the left edge.

## Must
- Left edge is a clean straight vertical cut through the body
- Both front paws grip that left edge
- Beaver upright, head and eyes level, face turned to the viewer
- Same beaver as the character sheet: peach-brown, round ears, two small front teeth, crosshatched paddle tail
- Simple, bold shapes that still read at about 44 px tall

## Avoid
- Drawing the edge, a wall, a logo, letters or a frame
- Full body, ground, water or scenery
- Rotating a top-edge peek on its side
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-22
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.
  
  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.
  
  The beaver peeking out sideways from behind a straight vertical edge on the LEFT side of the image, upright (not lying down or tilted over). Only part of it is visible: its head, turned so its face looks at the viewer with curious, happy eyes and its two small front teeth showing in a little grin, and both front paws curled around the left edge as if holding on to it. The tip of its crosshatched paddle tail may peek out lower down. The left edge of the image cuts the beaver cleanly in one straight vertical line; nothing is drawn left of it, as if the rest of its body is hidden behind a wall. Keep the beaver in the upper two thirds of the canvas, with the paws touching the left edge.
  
  Output a 1024x1536 portrait transparent PNG. Must: left edge is a clean straight vertical cut through the body; both front paws grip that left edge; beaver upright, head and eyes level, face turned to viewer; same peach-brown round-eared beaver with two teeth and crosshatched paddle tail as character sheet; bold readable shapes at 44 px tall. Avoid drawing any edge line, wall, logo, letters, frame, full body, ground, water, scenery or any Hard no item.
  
  Critical correction: the straight cut is the ACTUAL image boundary at x=0, not an inset line. Cropped beaver artwork must physically touch x=0 from head down through both gripping paws; there is no gap or transparent strip before it. Put one front paw hooked around x=0 near the cheek and the second front paw hooked around x=0 just below it. Show ONLY the front-facing head, these two paws and a hint of shoulder; OMIT belly, leg, foot and tail entirely. Show exactly TWO distinct small white upper incisors side by side. The face, ears and eyes remain upright and level. The right two thirds of the portrait canvas stays empty and transparent. No wall, logo, edge line, frame, shadow, haze, glow or ground.
  ```
- References attached: `ref-placement-peeking-side.png`, `rb2-character-sheet.png`, `ref-style-banner.png`, `rb2-squirrel-peeking.png`
- Edits or notes: Second generation selected. Trimmed 30 transparent/inset pixels from the left and padded the right to keep 1024x1536; removed distant semi-transparent haze. Verified two teeth, both front paws at the clean left cut, upright face, transparent background, and no wall or logo.
