# Claude review of the first art batch (21 Oct 2026)

Checked every `rb2-*.png` composited on the report paper (#FBF7EE) and on a dark background, plus its alpha mask. I also measured halos: pixels with alpha 12–239 lying more than 4 px outside the solid (alpha ≥ 240) shape. A clean anti-aliased cut-out scores close to 0.

**Most "halo" redos in `_INDEX.md` were false alarms.** Those images measure 0 to 0.04% halo pixels, which is normal edge anti-aliasing. Only three images have a real halo: `rb2-beaver-letters` (5.1%), `rb2-meadow-border` (7.1%) and `rb2-squirrel-numbers` (85%). Automatic cleanup cannot fix those three, because the haze is baked into the colours.

## Verdicts

| File | Verdict | Notes |
|---|---|---|
| rb2-character-sheet | accept | Identity reference. |
| rb2-squirrel-running | accept | Clean (0 halo px). |
| rb2-rabbit-hopping | accept | Clean. |
| rb2-beaver-hanging-willow | accept | |
| rb2-squirrel-hanging-willow | accept | |
| rb2-bear-climbing-vine | accept | 17 halo px, negligible. |
| rb2-squirrel-peeking | accept, Claude trims | Body ends about 13 px above the image bottom; Claude crops at the paw line. |
| rb2-bear-rabbit-sharing | accept | Picnic patch is bigger than asked, but it reads as a self-contained vignette. |
| rb2-beaver-squirrel-waving | accept | Clean. |
| rb2-beaver-letters | **redo** | Extra willow strands on the right, plus a cloud of haze behind the letters. |
| rb2-rabbit-brush | accept | Clean; ink speckles and the 一 stroke are as asked. |
| rb2-squirrel-numbers | **redo** | The whole background is semi-transparent haze; cleaning it leaves a white sticker outline. The 1, 2, 3 blocks are good, so keep the design. |
| rb2-garland-top | accept | |
| rb2-willow-drop | accept | Strands are longer than asked; the layout controls how far down they hang. |
| rb2-vine-edge | accept, Claude trims | Landscape canvas, but the vine is correct; Claude crops to the vine strip. |
| rb2-meadow-border | **redo** | Hazy band above the meadow, and the meadow is too tall. |
| rb2-river-landscape | accept | |
| rb2-river-portrait | accept | |
| rb2-flower-accent | accept | |
| rb2-scene-cover-garden | accept, Claude crops | Crops to A4 landscape, keeping the calm left third. |
| rb2-scene-reading-corner | accept, Claude crops | Crops away the empty left side. |
| rb2-scene-counting-stones | **redo** | Must be a true portrait (1024x1536); both versions are landscape. |
| rb2-scene-garden-planting | accept, Claude crops | |
| rb2-scene-sharing-snack | **redo** | Must be a true square (1024x1024); both versions are wide. |
| rb2-scene-story-circle | accept, Claude crops | |

## Redo instructions (5 files)

Use the same style block, character sheet and references as before.

1. **rb2-beaver-letters** (portrait 1024x1536)
   - Exactly ONE willow strand, dropping from the top edge, with the beaver hanging from it.
   - No other willow strands or plants anywhere.
   - No cloud, mist, haze or soft background shape behind the letters: every pixel outside the beaver, the strand, the two letters and the small bump lines must be fully transparent.
   - Keep the capital A bonking its head and the lowercase a tumbling.
2. **rb2-squirrel-numbers** (landscape 1536x1024)
   - Keep the same design: 1 on its head, 2 hugged, 3 in its tail.
   - The background must be fully transparent: no paper texture, vignette, glow or white sticker outline around the subject.
   - If transparency is impossible, use flat pure white #FFFFFF everywhere outside the subject, with no gradient.
3. **rb2-meadow-border** (landscape 1536x1024)
   - Meadow and stream only in the bottom 30%.
   - Everything above the tops of the grass and flowers must be fully transparent, with no fog band, haze or soft edge.
   - The plants' tops form a clean, varied silhouette.
4. **rb2-scene-counting-stones**
   - A true PORTRAIT canvas, 1024 wide x 1536 tall. Request that size explicitly.
   - Vertical composition: river and reeds across the top quarter, the squirrel placing stones in a line through the middle, the bear kneeling below and to one side.
   - Fill the whole canvas, with no large empty areas.
5. **rb2-scene-sharing-snack**
   - A true SQUARE canvas, 1024x1024. Request that size explicitly.
   - Centred picnic composition that fills the canvas, with no large empty areas.

After each redo, overwrite the file of the same name, fill in its Result section and set its status in `_INDEX.md` to `done`. Set every row this review marks "accept" to `done`, with the note "accepted by Claude review".
