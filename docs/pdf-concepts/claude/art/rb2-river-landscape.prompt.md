# rb2-river-landscape

- **Index:** #17, phase 3 plants and river
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-river-landscape.png` (this folder)
- **Canvas:** 1536x1024 (or closest supported)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png` (river style), `ref-river-path.png` (path), `ref-palette.png`
- **Used in the report:** Background layer on some landscape pages: photos, animals and plants sit in front of it. It never runs behind body text.

## Prompt (after the style block from `_STYLE.md`)

A gentle winding river seen from above, as a long ribbon: it enters at the TOP-RIGHT edge of the image, sweeps left across the upper part, turns back in a soft S curve through the middle to the right, then curves down and leaves at the BOTTOM-LEFT edge, exactly following ref-river-path.png. Soft powder-blue water with a thin outline, a few light ripple lines, and a narrow mint-green bank edge on both sides. Two or three small grey river stones and one or two tufts of reeds on the banks. Everything outside the river ribbon is empty.

## Must
- Enters top-right and exits bottom-left
- River width about 8-12% of the image height, even along its length
- Pale and calm so photos can sit on top

## Avoid
- Fields, sky or landscape around the river
- Animals or boats
- Dark or saturated blue
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI image_gen (model name not exposed by tool)
- Date: 2026-10-21 (Asia/Singapore)
- Final prompt used:

    Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

    A gentle winding river seen from above, as a long ribbon: it enters at the TOP-RIGHT edge of the image, sweeps left across the upper part, turns back in a soft S curve through the middle to the right, then curves down and leaves at the BOTTOM-LEFT edge, exactly following ref-river-path.png. Soft powder-blue water with a thin outline, a few light ripple lines, and a narrow mint-green bank edge on both sides. Two or three small grey river stones and one or two tufts of reeds on the banks. Everything outside the river ribbon is empty.

- References attached: `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-river-path.png`, `ref-palette.png`
- Edits or notes: No image edits. Saved as `rb2-river-landscape.png`; output 1536x1024,corner-alpha=0. QA: River follows the path, but a large translucent green halo fills space outside the ribbon.
