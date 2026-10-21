# rb2-vine-edge

- **Index:** #15, phase 3 plants and river
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-vine-edge.png` (this folder)
- **Canvas:** 1024x1536 (or closest supported)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `ref-placement-vine.png` (growth path), `ref-palette.png`
- **Used in the report:** Climbs the page edge beside a photo, on the same side as the photos (about 120-180 mm tall). Drawn for the left edge, mirrored in code for the right.

## Prompt (after the style block from `_STYLE.md`)

A single climbing vine growing straight up near the LEFT edge of the image, from the bottom edge to the top edge, gently curly along the way (a soft wave, never diagonal). Small leaves alternate along the stem, with three tiny daisies and a few curly tendrils. Two or three short tendrils reach towards the right, as if touching a picture beside the vine. Airy and delicate. The vine stays in the left third of the image; only tendril tips reach towards the middle.

## Must
- Touches the bottom and top edges
- Mostly vertical, close to the left edge
- Follow ref-placement-vine.png

## Avoid
- Diagonal or sweeping growth
- Drawing any frame
- Pot, ground or second plant
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI image_gen (model name not exposed by tool)
- Date: 2026-10-21 (Asia/Singapore)
- Final prompt used:

    Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

    A single climbing vine growing straight up near the LEFT edge of the image, from the bottom edge to the top edge, gently curly along the way (a soft wave, never diagonal). Small leaves alternate along the stem, with three tiny daisies and a few curly tendrils. Two or three short tendrils reach towards the right, as if touching a picture beside the vine. Airy and delicate. The vine stays in the left third of the image; only tendril tips reach towards the middle.

- References attached: `ref-style-banner.png`, `rb2-character-sheet.png`, `ref-placement-vine.png`, `ref-palette.png`
- Edits or notes: No image edits. Saved as `rb2-vine-edge.png`; output 1536x1024,corner-alpha=0. QA: Broad green alpha halo outside the edge vine violates the no-glow requirement.
