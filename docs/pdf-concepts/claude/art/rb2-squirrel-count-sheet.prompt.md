# rb2-squirrel-count-sheet

- **Index:** #39, phase 6 app animation frames (AI drafting set)
- **Status:** see `_INDEX.md`
- **Save as:** `rb2-squirrel-count-sheet.png` (this folder)
- **Canvas:** 1024x1024 (2 x 2 frames)
- **Background:** Transparent background PNG. If transparency is unavailable, use a flat pure white (#FFFFFF) background with no ground patch, no shadow and no vignette.
- **Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-squirrel-numbers.png` (character), `ref-sheet-grid.png` (layout)
- **Used in the app:** Mathematics drafting animation: loops while the AI drafts; the app shows 1, 2, 3 in speech bubbles as the squirrel points.

## Prompt (after the style block and character identity line from `_STYLE.md`)

A 4-frame counting loop: the squirrel sits on the ground line facing slightly right, with three acorns in a neat row in front of it. The three acorns stay in exactly the same places in every frame. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: looking at the acorns, one paw on its chin, thinking. Frame 2: pointing at the first acorn (left), eyes on it. Frame 3: pointing at the second acorn (middle). Frame 4: pointing at the third acorn (right), tail curling up with excitement.

## Must
- Exactly 4 frames in a 2 x 2 grid, in the stated order
- Three acorns in the same places in every frame
- The pointing paw clearly over the correct acorn
- Same squirrel, same size and position in every cell

## Avoid
- Any numbers, number blocks or symbols (the app draws the counting)
- Ground or grass
- Cell borders or labels
- Everything in the Hard no list in `_STYLE.md`

## Result (filled in by the generator)

- Tool and model: OpenAI imagegen (model identifier not exposed)
- Date: 2026-10-21
- Final prompt used:
  ```text
  Hand-drawn children's picture-book illustration in the exact style of the attached banner reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them (books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks.

  Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. Squirrel: orange-brown, cream belly and face patch, big curled tail. Bear: butter-yellow, mint-green belly, round ears. Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks.

  A 4-frame counting loop: the squirrel sits on the ground line facing slightly right, with three acorns in a neat row in front of it. The three acorns stay in exactly the same places in every frame. Laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: looking at the acorns, one paw on its chin, thinking. Frame 2: pointing at the first acorn (left), eyes on it. Frame 3: pointing at the second acorn (middle). Frame 4: pointing at the third acorn (right), tail curling up with excitement.

  Output a true square 1024x1024 transparent PNG. Four equal invisible quadrants with one full identical-sized squirrel in the same location per quadrant. Exactly three acorns in each quadrant, same positions. Point toward acorns left, middle, right in frames 2, 3, 4. Absolutely no digits, letters, symbols, number blocks, borders, labels, guide lines, motion lines, grass or ground. Keep transparent outside drawn characters and acorns.

  Critical correction: frame 4 (bottom-right) extended forepaw MUST point to the RIGHTMOST of its three acorns, not the middle; point tip directly above rightmost acorn. Frame 3 bottom-left forepaw points to MIDDLE acorn. Frame 2 top-right points to LEFTMOST. Remove ALL radiating excitement marks or motion lines. Place all three acorns at identical relative x positions across cells. Same squirrel scale in all four.

  Follow-up edit prompt:
  Edit the FIRST attached four-frame counting sheet ONLY in its bottom-right quadrant. Keep all four squirrels, all twelve acorns, spacing, sizes, transparency, colours and poses otherwise pixel-matched. In the bottom-right frame, extend the squirrel's right forearm farther toward the far-right acorn, so its pointing paw is directly above that THIRD/rightmost acorn. The bottom-left paw must remain above the middle acorn; the top-right paw remains above the first/leftmost acorn. No motion lines, digits, symbols, text, borders, ground, haze or glow. Square transparent four-frame sheet.
  ```
- References attached: `ref-sheet-grid.png`, `rb2-character-sheet.png`, `rb2-squirrel-numbers.png`, `ref-style-banner.png`; follow-up edit also attached the new draft `rb2-squirrel-count-sheet.png`
- Edits or notes: Three attempts plus a targeted edit; frame 4 forepaw still lands between middle and rightmost acorns. Saved draft, status redo.

## Revision 2 (Claude review, replaces the prompt above)

The first version drew the acorns, and after three attempts the paw in frame 4 still missed the third acorn. New approach: **draw no acorns at all.** The app places the three acorns under the paw, so only the squirrel's reach has to be right.

**Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-squirrel-numbers.png` (character), `ref-sheet-count.png` (reach targets)

**Prompt:** A 4-frame counting loop of the squirrel, sitting on the ground line in the LEFT part of each cell, facing right, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). There are NO acorns or other objects: the squirrel points at empty ground. Frame 1: thinking, one paw on its chin, looking down to the right. Frame 2: arm stretched out pointing down at the NEAR spot just in front of it. Frame 3: arm stretched further, leaning a little, pointing at the MIDDLE spot. Frame 4: leaning forward as far as it can, arm fully out, pointing at the FAR spot, tail curling up with excitement. Follow `ref-sheet-count.png` exactly: in frames 2, 3 and 4 the paw tip ends right above the marked dot.

**Must**
- No acorns, numbers or objects anywhere
- Squirrel body in the same place and size in every frame; only the arm, lean and face change
- Paw tip right above the target dot in frames 2, 3 and 4 (near, middle, far)
- Exactly 4 frames in a 2 x 2 grid, transparent background, no borders or labels
