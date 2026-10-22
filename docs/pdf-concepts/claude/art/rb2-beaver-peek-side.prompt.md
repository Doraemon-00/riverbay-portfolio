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
 
- Revision 2 (2026-10-22): OpenAI imagegen (model identifier not exposed). Third edit pass selected. Kept the head and face composition; moved both paws into complete rounded outlines in front of the cropped body, with finger marks touching the left edge. Cleaned only stray alpha-1 pixels outside the drawing; preserved normal antialiasing. Canvas verified at 1024x1536 RGBA. Previous result preserved as `rb2-beaver-peek-side.rev1.png`.
- Revision 2 references attached: `rb2-beaver-peek-side.rev1.png`, `ref-placement-peeking-side.png`, `ref-style-banner.png`, `rb2-character-sheet.png`
- Revision 2 final prompt used:
  ```text
  Revise FIRST attached beaver picture as a near-identical edit. Preserve every pixel of the HEAD and FACE as closely as possible: ears, eyes, nose, smile, exactly two white teeth, blush, head size and position, peach-brown colour, hand-drawn grain and brown outline. The 1024x1536 transparent portrait canvas and beaver's cropped body stay unchanged. Edit only the paws in two small regions to the left of the face and chest.
  
  The old image has two paws sliced in half at the left boundary. Remove those old half-paws. Draw two NEW COMPLETE paws farther RIGHT in the picture, fully on the visible side. Think of each as a whole little peach-brown mitten/circle, diameter about 125 pixels, CENTER at x=75 pixels: the complete oval begins at x=10 and ends around x=140. Every part of its enclosing outline MUST BE VISIBLE. NOT even one millimeter of a paw may go beyond the left image edge. Put upper complete paw around y=700 and lower complete paw around y=885. They overlap the visible beaver's own face/shoulder slightly. Inside each paw place three tiny curved brown finger crease marks pointing toward the left edge. Add a very short slender peach-brown gripping fingertip from the left side of each whole paw to x=0 so it touches the actual canvas edge. This fingertip is not a separate paw. Compare the RIGHT diagram in ref-placement-peeking-side.png: whole round paws visible in front, NEVER cut half-paws as in WRONG diagram. The body and head behind the paws remain cut by x=0.
  
  Style as ref-style-banner.png: thin warm-brown even outline #6B4A3A, flat matte peach-brown pastel fill, very light crayon grain, no gradients. KEEP ORIGINAL FACE EXACTLY. Keep all other pixels far from the animal truly transparent with alpha zero, especially the right side. No background, glow, brown fog, shadow, haze, halo, sticker outline, wall, vertical line, scenery, text, letters, logos, people or children.
  ```

## Revision 2 (Claude review, 22 October 2026)

**Why:** in the first result the paws are half-circles sliced off by the left edge, so they look hidden behind the wall instead of holding on to it. Seen in the app at about 56 px tall, the beaver looks like a floating head.

**Change only the paws; keep the head, face, colours and style of the first result.**

- Draw both front paws **in front of the edge and fully visible**: each a complete rounded paw shape whose left side touches x=0, with two or three short finger lines curling round the edge, like hands holding a door frame. Nothing of the paw is cut off.
- One paw at cheek height, the other lower, near the chest. The paws overlap the beaver's own body a little, as if it is pulling itself round the corner.
- Paws large and simple enough to read at about 56 px tall.
- The body behind the paws is still cut by the straight left edge.
- See the RIGHT and WRONG examples in the updated `ref-placement-peeking-side.png`.

**Files:** rename the current `rb2-beaver-peek-side.png` to `rb2-beaver-peek-side.rev1.png` first, then save the new result as `rb2-beaver-peek-side.png`. Add a Revision 2 note under Result.

## Claude review of Revision 2 (22 October 2026)

- Revision 2 rejected: a large soft semi-transparent halo surrounds the beaver, and the paws are cut by the edge again.
- Accepted instead (user's choice): an earlier generation supplied by the user, saved as `rb2-beaver-peek-side.png`. The body is cut on a clean vertical line at x=15 and both paws are whole, with fingers reaching x=0, so they wrap round in front of the edge. Transparent, no halo.
- In the app, the body's cut line is aligned with the logo's right edge; the fingers overlap the logo by about 1 px at display size.
- Clean-up: the rejected files `rb2-beaver-peek-side.rev1.png` (paws sliced by the edge) and `rb2-beaver-peek-side.rev2.png` (halo) were removed from this folder; both remain in git history at commit 1b2d8a3. Only the accepted `rb2-beaver-peek-side.png` is kept, and the app uses `public/assets/riverbay/motion/beaver-peek.webp` made from it.
