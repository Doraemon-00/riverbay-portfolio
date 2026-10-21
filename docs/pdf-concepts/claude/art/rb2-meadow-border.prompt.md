# rb2-meadow-border

- **Index:** #16, phase 3 plants and river
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-meadow-border.png` (this folder)
- **Canvas:** 1536x1024 (or closest supported)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `ref-palette.png`
- **Used in the report:** Bottom edge of every page, replacing the current border (spans the page width, about 12-18 mm tall).

## Prompt (after the style block from `_STYLE.md`)

A low meadow strip along the very bottom edge of the image: a soft powder-blue wavy stream line with grass tufts, reeds, daisies, clover and tiny peach and lavender flowers growing up from it, spaced out with air between clumps. Draw it only in the bottom 30% of the image; everything above stays empty.

## Must
- Touches the left and right edges at the same height so copies can repeat
- Bottom 30% only

## Avoid
- Animals
- Sky, hills or trees
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI image_gen (model name not exposed by tool)
- Date: 2026-10-21 (Asia/Singapore)
- Final prompt used:

    Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

    A low meadow strip along the very bottom edge of the image: a soft powder-blue wavy stream line with grass tufts, reeds, daisies, clover and tiny peach and lavender flowers growing up from it, spaced out with air between clumps. Draw it only in the bottom 30% of the image; everything above stays empty.

    Redo requirements: Output a true landscape canvas exactly 1536 pixels wide by 1024 pixels tall. Confine the meadow and stream to the bottom 30% of the image. Everything above the tops of grass and flowers must be fully transparent. The plants' tops form a clean, varied silhouette, with no fog band, haze, glow, soft edge, sticker outline, sky, hills, trees or animals.

    Critical river-bank correction from the user: the powder-blue river is a continuous clear water ribbon along the bottom edge. Place EVERY grass tuft, reed, clover, daisy, peach flower and lavender flower entirely on the mint-green bankside GARDEN ABOVE the river's warm-brown bank outline. No plant, leaf, stem, flower or grass blade may cross that outline or appear inside the blue water. Do not draw a foreground bank at the bottom; keep the water unobstructed to the bottom edge. Slightly exceeding 30% in the highest plants is acceptable. Keep the boundary between garden and river crisp, with no haze.

- References attached: `rb2-meadow-border.png (prior draft)`, `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-palette.png`
- Edits or notes: Generated final image edit and saved at 1536x1024. The garden plants stay on the bank above a continuous blue river. Highest nontransparent artwork starts at y=689 (about 32.7% of canvas height used). Removed low-alpha glow pixels and semi-transparent pixels more than 4 px from solid artwork; retained normal anti-aliased edges.
