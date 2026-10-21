"""Writes art/_STYLE.md, art/_INDEX.md and art/rb2-*.prompt.md (python -I tools/write_art_prompts.py art).
Never overwrites an existing prompt file or _INDEX.md (they hold the generator's results and statuses)."""
import sys
from pathlib import Path

ART = Path(sys.argv[1])

STYLE_BLOCK = (
    "Hand-drawn children's picture-book illustration in the exact style of the attached banner "
    "reference (ref-style-banner.png). Thin, even, slightly wobbly warm-brown outlines (#6B4A3A), the "
    "same light weight everywhere. Flat, matte pastel fills with a very light crayon grain; no "
    "gradients, no glossy highlights, no drop shadows, no 3D, no outer glow. Simple rounded shapes, "
    "small dot eyes, tiny blush cheeks, gentle smiles. Calm, warm, playful and uncluttered, with "
    "generous empty space. Palette: cream #FBF7EE, mint #D5EDDF, peach #F6D5C1, powder blue #DCECF2, "
    "butter #F8EDBC, lavender #E9E0F3, sage and forest-green (#2F5C4D) leaves, plus each character's "
    "own colours. No text, letters, numbers or symbols anywhere unless this prompt explicitly names them "
    "(books show only soft scribble lines or tiny pictures). No people, no children, no human hands. No logos or brand marks."
)

CHARACTERS = (
    "Beaver: peach-brown, crosshatched paddle tail, two small front teeth, round ears. "
    "Squirrel: orange-brown, cream belly and face patch, big curled tail. "
    "Bear: butter-yellow, mint-green belly, round ears. "
    "Rabbit: cream-white, pink inner ears, one ear gently bent, pink cheeks."
)

TRANSPARENT = ("Transparent background PNG. If transparency is unavailable, use a flat pure white "
               "(#FFFFFF) background with no ground patch, no shadow and no vignette.")

CHAR_REFS = ["ref-style-banner.png", "rb2-character-sheet.png", "ref-palette.png"]

# (id, phase, canvas, background, attach, used, prompt, must, avoid)
ASSETS = [
    ("rb2-character-sheet", "1 (gate: stop for approval)", "1536x1024", "opaque pure white",
     ["ref-style-banner.png (style)", "ref-identity-characters.png (identity only)", "ref-palette.png"],
     "Reference for every later image. Not placed in the report.",
     "A clean character model sheet of four friends: beaver, squirrel, bear and rabbit, standing in a row "
     "with even spacing. For each animal show two views side by side: front view and three-quarter side view. "
     "All four at a consistent scale (bear tallest, squirrel smallest). Neutral happy expressions, simple poses, "
     "arms relaxed. Plain white background, nothing else on the sheet.",
     ["Same line weight and fill style as the banner beaver and squirrel, not the thicker crayon identity sheet",
      "Each animal clearly recognisable from the identity notes", "No labels or text"],
     ["Thick dark outlines", "Glossy or airbrushed shading", "Props, scenery or ground"]),

    # ---- Characters in action ------------------------------------------------
    ("rb2-squirrel-running", "2 characters", "1024x1024", "TRANSPARENT", CHAR_REFS,
     "Small accent running along the top garland on the cover and some pages (about 25-35 mm wide in print).",
     "The squirrel running happily from left to right in full side view, mid-stride, front paws reaching forward, "
     "big curled tail streaming up behind, a tiny acorn tucked under one arm. Whole body visible, centred, "
     "with empty margin all round.",
     ["Facing right", "Whole body in frame with at least 5% margin", "Readable as running at small size"],
     ["Ground, grass or motion lines", "Cropped tail or ears"]),

    ("rb2-rabbit-hopping", "2 characters", "1024x1024", "TRANSPARENT", CHAR_REFS,
     "Hops along the bottom meadow border or the top garland; small accent (about 25-35 mm wide).",
     "The rabbit mid-hop, full side view facing right, back legs stretched, front paws tucked, ears flowing back, "
     "joyful face. Whole body visible, centred, empty margin all round.",
     ["Facing right", "Both ears fully visible, one gently bent", "Clearly in the air (no ground)"],
     ["Ground or shadow", "Carrot or other props"]),

    ("rb2-beaver-hanging-willow", "2 characters", "1024x1536", "TRANSPARENT",
     ["ref-style-banner.png", "rb2-character-sheet.png", "ref-placement-hanging.png (pose and paw positions)"],
     "Hangs from a willow strand dropping from the top of the page and holds the corner of a teacher photo (about 45-60 mm tall).",
     "The beaver hanging playfully like a little monkey from a single long willow strand (a thin drooping stem "
     "with slender willow leaves, like the willow in the banner). The strand comes straight down from the very top "
     "edge of the image. The beaver's LEFT paw grips the strand above its head; its RIGHT paw reaches down and to "
     "the right, open and slightly curled, as if holding the top-left corner of a picture frame (do NOT draw the "
     "frame). Body hangs between, feet dangling, tail hanging down, cheerful face looking at the viewer.",
     ["Willow strand touches the top edge of the image", "Right paw ends near the lower right of the image, with empty space to its right and below",
      "Follow ref-placement-hanging.png for paw positions"],
     ["Drawing any frame, photo or rectangle", "Strand continuing below the beaver", "A thick jungle vine (it is a slender willow strand)"]),

    ("rb2-squirrel-hanging-willow", "2 characters", "1024x1536", "TRANSPARENT",
     ["ref-style-banner.png", "rb2-character-sheet.png", "ref-placement-tail.png (paw and tail positions)"],
     "Hangs from a willow strand and holds a teacher photo's corner with its tail (about 40-55 mm tall).",
     "The squirrel hanging from a single willow strand that drops from the very top edge of the image. One front "
     "paw grips the strand; the other front paw holds an acorn up proudly. Its big fluffy tail curls down and to "
     "the right and wraps around the top-left corner of a picture frame, as if carrying the frame with its tail "
     "(do NOT draw the frame). Playful, pleased expression, hind legs dangling.",
     ["Strand touches the top edge", "Tail curl ends in the lower right of the image with empty space around it",
      "Follow ref-placement-tail.png"],
     ["Drawing any frame or photo", "A second acorn or other props"]),

    ("rb2-bear-climbing-vine", "2 characters", "1024x1536", "TRANSPARENT", CHAR_REFS,
     "Climbs the edge vine beside the photo column on some pages (about 50-70 mm tall).",
     "The bear climbing up a single tall leafy vine that runs straight up from the bottom edge to the top edge of "
     "the image with gentle curls, both paws and one foot holding the stem, body turned slightly to the viewer, "
     "looking back over its shoulder with a happy face. Small leaves and two tiny daisies on the vine.",
     ["Vine touches both the top and bottom edges and stays mostly vertical", "Bear in the middle third"],
     ["Ground, scenery or a second vine", "A diagonal or sweeping vine"]),

    ("rb2-squirrel-peeking", "2 characters", "1536x1024", "TRANSPARENT",
     ["ref-style-banner.png", "rb2-character-sheet.png", "ref-placement-peeking.png (how it sits on an edge)"],
     "Peeks over the top edge of a photo frame (about 30-40 mm wide).",
     "The squirrel peeking over a straight horizontal edge: only its head, two front paws and the curled tip of "
     "its tail are visible above the bottom edge of the image. Both paws rest exactly on the bottom edge as if "
     "holding on to it. Curious, happy eyes. The bottom edge of the image cuts the squirrel cleanly in a straight "
     "line; nothing is drawn below it.",
     ["Bottom edge is a clean straight cut through the body", "Paws sit on that edge", "Squirrel in the middle third horizontally"],
     ["Drawing the edge, a frame or a wall", "Full body"]),

    ("rb2-bear-rabbit-sharing", "2 characters", "1536x1024", "TRANSPARENT", CHAR_REFS,
     "Social-emotional pages: friends together (about 60-80 mm wide).",
     "The bear and the rabbit sitting side by side on a small patch of clover, sharing a little picnic: the bear "
     "offers a slice of honey bread and the rabbit offers a carrot. They look at each other kindly. A small "
     "daisy or two beside them.",
     ["Both characters whole and clearly interacting", "Only a small clover patch under them, no full scenery"],
     ["Background scenery"]),

    ("rb2-beaver-squirrel-waving", "2 characters", "1536x1024", "TRANSPARENT", CHAR_REFS,
     "Social-emotional pages or the closing page: friends saying hello (about 60-80 mm wide).",
     "The beaver and the squirrel standing together, holding paws, each waving to the viewer with their free paw, "
     "big friendly smiles. The squirrel is smaller and stands slightly on tiptoe.",
     ["Holding paws clearly visible", "Whole bodies in frame"],
     ["Ground, scenery or props"]),

    # ---- Subject mascots (the only assets allowed letters, numbers or ink) ----
    ("rb2-beaver-letters", "2 subject mascots", "1024x1536", "TRANSPARENT", CHAR_REFS + ["ref-placement-hanging.png (strand from the top)"],
     "English pages: subject mascot, playful moment near the heading or beside the story (about 50-65 mm tall).",
     "A funny moment: the beaver is hanging mid-air from a single willow strand that drops from the very top edge "
     "of the image. A big chunky capital letter A (rounded, butter-yellow, like a soft wooden toy letter) has just "
     "fallen and bonked the beaver on the head; it is bouncing off, tilted, just above the head, with two tiny "
     "curved bump lines. A smaller lowercase letter a (mint green, same toy style) is tumbling down beside it. "
     "The beaver is wobbling and almost slipping: holding the strand with only one paw, the other paw and both feet "
     "flailing, eyes squeezed in surprise, but still smiling and still hanging on.",
     ["EXACTLY two letters: one capital A and one lowercase a, correctly shaped", "Strand touches the top edge",
      "Clearly still hanging (not falling)"],
     ["Any other letters, words or numbers", "Stars, swirls or dizzy symbols", "Ground"]),

    ("rb2-rabbit-brush", "2 subject mascots", "1024x1024", "TRANSPARENT", CHAR_REFS,
     "中文 pages: subject mascot (about 45-60 mm).",
     "The rabbit sitting (no ground drawn) holding a big Chinese calligraphy brush (毛笔, bamboo handle, soft black tip) "
     "with both paws, proudly finishing one single bold horizontal ink stroke, the character 一, on a small sheet "
     "of cream rice paper in front of it. A small round inkstone sits beside the paper. Playfully, a few black ink "
     "splashes have landed on the rabbit: small speckles on its white fur, one dot on its cheek and ink on the tip "
     "of a paw, making it look a little messy and very pleased with itself.",
     ["Only ONE character on the paper: the single horizontal stroke 一", "Ink splashes visible on the white fur",
      "Brush clearly a Chinese 毛笔"],
     ["Any other Chinese characters, letters or numbers", "A Western paintbrush or palette", "Big ink puddles"]),

    ("rb2-squirrel-numbers", "2 subject mascots", "1536x1024", "TRANSPARENT", CHAR_REFS,
     "Mathematics pages: subject mascot (about 50-65 mm wide).",
     "The squirrel balancing three chunky rounded toy number blocks shaped like the numbers 1, 2 and 3 (soft "
     "pastel colours: peach 1, mint 2, lavender 3). It hugs the 2 in its arms, the 1 is balanced on its head and "
     "the 3 is curled in its tail. Concentrating, tongue slightly out, a little wobbly but happy.",
     ["EXACTLY the numbers 1, 2 and 3, correctly shaped", "Whole squirrel visible"],
     ["Any other numbers, letters or symbols", "Ground or scenery"]),

    # ---- Plants and river ---------------------------------------------------
    ("rb2-garland-top", "3 plants and river", "1536x1024", "TRANSPARENT", ["ref-style-banner.png (willow and flowers)", "ref-palette.png"],
     "Runs along the top edge of the cover and some pages; animals run along it (spans the page width, about 20-30 mm deep).",
     "A horizontal garland of hanging plants along the very top edge of the image: a gently wavy leafy vine runs "
     "the full width just below the top edge, with small leaves, daisies, tiny lavender and peach wildflowers and "
     "a few clover leaves dangling down a short way. Airy, not dense. Draw it only in the top 30% of the image; "
     "the rest stays empty. The vine should be thick enough for a small animal to run along the top of it.",
     ["Vine touches the left and right edges at about the same height so two copies can sit side by side",
      "Top 30% only"],
     ["Animals (added separately)", "Long hanging strands (that is the willow-drop asset)", "Sky or background"]),

    ("rb2-willow-drop", "3 plants and river", "1536x1024", "TRANSPARENT", ["ref-style-banner.png (see the willow at the top right)", "ref-palette.png"],
     "Willow strands dropping from the top of some pages, like the banner; animals can hang from them (spans 80-150 mm wide).",
     "Seven to nine slender willow strands hanging straight down from the very top edge of the image, exactly in "
     "the style of the willow at the top right of the banner reference: thin drooping stems with small slender "
     "leaves. They have different lengths: the longest reaches about 55% of the image height, the shortest about "
     "20%. Spaced unevenly, a couple of strands slightly swaying. One or two tiny lavender flowers. The bottom 40% "
     "of the image stays completely empty.",
     ["Every strand starts at the top edge", "No strand reaches the bottom 40%", "Matches the banner willow"],
     ["Tree trunk or branch", "Ground", "Animals"]),

    ("rb2-vine-edge", "3 plants and river", "1024x1536", "TRANSPARENT", ["ref-style-banner.png", "ref-placement-vine.png (growth path)", "ref-palette.png"],
     "Climbs the page edge beside a photo, on the same side as the photos (about 120-180 mm tall). Drawn for the left edge, mirrored in code for the right.",
     "A single climbing vine growing straight up near the LEFT edge of the image, from the bottom edge to the top "
     "edge, gently curly along the way (a soft wave, never diagonal). Small leaves alternate along the stem, with "
     "three tiny daisies and a few curly tendrils. Two or three short tendrils reach towards the right, as if "
     "touching a picture beside the vine. Airy and delicate. The vine stays in the left third of the image; only "
     "tendril tips reach towards the middle.",
     ["Touches the bottom and top edges", "Mostly vertical, close to the left edge", "Follow ref-placement-vine.png"],
     ["Diagonal or sweeping growth", "Drawing any frame", "Pot, ground or second plant"]),

    ("rb2-meadow-border", "3 plants and river", "1536x1024", "TRANSPARENT", ["ref-style-banner.png", "ref-palette.png"],
     "Bottom edge of every page, replacing the current border (spans the page width, about 12-18 mm tall).",
     "A low meadow strip along the very bottom edge of the image: a soft powder-blue wavy stream line with grass "
     "tufts, reeds, daisies, clover and tiny peach and lavender flowers growing up from it, spaced out with air "
     "between clumps. Draw it only in the bottom 30% of the image; everything above stays empty.",
     ["Touches the left and right edges at the same height so copies can repeat", "Bottom 30% only"],
     ["Animals", "Sky, hills or trees"]),

    ("rb2-river-landscape", "3 plants and river", "1536x1024", "TRANSPARENT", ["ref-style-banner.png (river style)", "ref-river-path.png (path)", "ref-palette.png"],
     "Background layer on some landscape pages: photos, animals and plants sit in front of it. It never runs behind body text.",
     "A gentle winding river seen from above, as a long ribbon: it enters at the TOP-RIGHT edge of the image, "
     "sweeps left across the upper part, turns back in a soft S curve through the middle to the right, then curves "
     "down and leaves at the BOTTOM-LEFT edge, exactly following ref-river-path.png. Soft powder-blue water with a "
     "thin outline, a few light ripple lines, and a narrow mint-green bank edge on both sides. Two or three small "
     "grey river stones and one or two tufts of reeds on the banks. Everything outside the river ribbon is empty.",
     ["Enters top-right and exits bottom-left", "River width about 8-12% of the image height, even along its length",
      "Pale and calm so photos can sit on top"],
     ["Fields, sky or landscape around the river", "Animals or boats", "Dark or saturated blue"]),

    ("rb2-river-portrait", "3 plants and river", "1024x1536", "TRANSPARENT", ["ref-style-banner.png (river style)", "ref-river-path.png (path, adapt to tall)", "ref-palette.png"],
     "Background layer on some portrait pages, as above.",
     "The same gentle river ribbon as rb2-river-landscape, adapted to a tall image: it enters at the TOP-RIGHT "
     "edge, makes a wide C/S curve to the left and back to the right, and leaves at the BOTTOM-LEFT edge. Soft "
     "powder-blue water, thin outline, light ripples, narrow mint bank edges, two small stones and one reed tuft. "
     "Everything outside the river ribbon is empty.",
     ["Enters top-right and exits bottom-left", "Even width, pale and calm"],
     ["Landscape around the river", "Animals or boats"]),

    ("rb2-flower-accent", "3 plants and river", "1024x1024", "TRANSPARENT", ["ref-style-banner.png", "ref-palette.png"],
     "Tiny accent beside headings (about 6-10 mm).",
     "A tiny posy: one daisy, one sprig of clover and one small lavender flower tied together, upright, centred.",
     ["Simple and readable at 8 mm"], ["Ribbon text", "Pot or vase"]),

    # ---- Sample scenes (stand-ins for teacher photos) --------------------------
    ("rb2-scene-cover-garden", "4 sample scenes", "1536x1024", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for the full-bleed cover photo (a real teacher photo replaces it). The left third is covered by a cream panel with the child's name.",
     "A wide riverbank garden scene on a sunny morning: a winding powder-blue river, soft mint banks, willow "
     "strands, reeds and wildflowers. On the right, the beaver and the squirrel fly a small peach kite together; "
     "the bear and the rabbit sit by the river watching and smiling. Keep the LEFT THIRD calm and simple (just "
     "grass, sky and soft river), with the action in the right two-thirds.",
     ["Left third calm, no characters", "Fills the whole canvas edge to edge"],
     ["Busy left side"]),

    ("rb2-scene-reading-corner", "4 sample scenes", "1536x1024", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for a landscape teacher photo (3:2).",
     "A cosy reading corner under a willow tree: the beaver and the rabbit sit on a soft mint blanket looking at "
     "a big open picture book together, a small basket of books beside them, a few daisies in the grass.",
     ["Fills the canvas", "Characters in the central area"], ["Letters on the books"]),

    ("rb2-scene-counting-stones", "4 sample scenes", "1024x1536", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for a portrait teacher photo (2:3).",
     "By the riverbank, the squirrel arranges smooth river stones in a line from small to large while the bear "
     "watches closely, kneeling beside it. Reeds and a strip of river at the top of the picture.",
     ["Portrait composition", "Stones in a clear line"], ["Numbers on the stones"]),

    ("rb2-scene-garden-planting", "4 sample scenes", "1536x1024", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for a wide teacher photo (landscape).",
     "A small vegetable garden: the rabbit waters seedlings with a little peach watering can while the beaver "
     "digs a hole with a tiny spade and the squirrel carries a seed packet with a picture of a flower on it.",
     ["Fills the canvas", "Three characters busy together"], ["Text on the seed packet"]),

    ("rb2-scene-sharing-snack", "4 sample scenes", "1024x1024", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for a square teacher photo; suits Social-emotional.",
     "On a picnic blanket, the bear pours pretend tea for the rabbit and the squirrel from a small butter-yellow "
     "teapot; everyone is smiling and passing biscuits to each other.",
     ["Square composition", "Clearly sharing"], ["Text"]),

    ("rb2-scene-story-circle", "4 sample scenes", "1536x1024", "opaque, full scene", CHAR_REFS,
     "SAMPLE stand-in for a landscape teacher photo of group time.",
     "Story circle on the grass: the four friends sit in a small circle; the beaver holds up a picture book and "
     "points at a picture of a duck while the others lean in to look.",
     ["All four characters", "Fills the canvas"], ["Letters on the book"]),

    # ---- Photo pages (added 21 Oct 2026): animals taking and pinning up photos ----------
    ("rb2-beaver-camera", "5 photo pages", "1024x1024", "TRANSPARENT", CHAR_REFS,
     "Photo-only pages (no story text): the beaver 'took' the photos on the page. Sits near a page corner (about 45-60 mm tall).",
     "The beaver crouching on one knee, holding a chunky retro camera up to its eye with both paws, aiming to the "
     "RIGHT, tongue slightly out in concentration, tail curled behind. The camera is rounded and toy-like, "
     "butter-yellow with a mint lens ring and a brown strap around the beaver's neck. Two or three tiny curved "
     "'click' lines beside the camera top.",
     ["Camera points to the right", "Whole body visible", "Camera has no brand name, logo or lettering"],
     ["Flash bursts, stars or sparkle symbols", "Ground or scenery", "Any text"]),

    ("rb2-squirrel-tripod", "5 photo pages", "1024x1536", "TRANSPARENT", CHAR_REFS,
     "Photo-only pages: stands beside the photos, as if it set up the shot (about 55-70 mm tall).",
     "The squirrel standing on tiptoe behind an old-fashioned wooden tripod camera with a small soft peach cloth "
     "hood, its head half under the cloth and its big curled tail sticking out happily behind. One paw squeezes a "
     "small round rubber bulb on a cord. The camera faces LEFT. Tripod legs are thin wood, standing on nothing.",
     ["Camera faces left", "Whole tripod and squirrel visible", "No text or logo on the camera"],
     ["Ground, shadow or scenery", "Flash bursts or symbols"]),

    ("rb2-rabbit-snapshots", "5 photo pages", "1024x1024", "TRANSPARENT", CHAR_REFS,
     "Photo-only pages: the rabbit proudly showing freshly printed snapshots (about 45-55 mm).",
     "The rabbit sitting and holding up a small fan of three blank instant-photo cards in one paw (cream cards "
     "with a thicker bottom border and a plain pale mint or peach square where the picture would be, completely "
     "empty), while a fourth card flutters down beside it. Delighted face, ears up.",
     ["The picture areas on the cards are EMPTY plain pastel squares", "Whole rabbit visible"],
     ["Pictures, faces or scenes inside the cards", "Text on the cards", "Ground"]),

    ("rb2-photo-line", "5 photo pages", "1536x1024", "TRANSPARENT", ["ref-style-banner.png", "ref-palette.png"],
     "Photo-only pages: a twine washing line across the top of the page; the template pins photos below it with the "
     "separate peg asset (spans the page width).",
     "A single length of natural brown twine hanging across the image from the TOP-LEFT corner to the TOP-RIGHT "
     "corner, sagging gently in the middle so its lowest point is at about 30% of the image height. A few small "
     "leaves and two or three tiny daisies are twisted around the twine at irregular places. Nothing hangs from the "
     "twine. Everything below the twine is empty.",
     ["Twine touches the left and right edges near the top", "Smooth, even sag (a simple curve)", "Nothing hangs from it"],
     ["Pegs, photos, cards or bunting", "Background"]),

    ("rb2-peg", "5 photo pages", "1024x1024", "TRANSPARENT", ["ref-style-banner.png", "ref-palette.png"],
     "Pinned to the top edge of each photo on photo-only pages (about 9-12 mm tall in print).",
     "One small wooden clothes peg, upright, seen from the front, light honey wood with a thin brown outline and a "
     "tiny metal spring line in the middle, with one small mint leaf tucked behind it. Centred, generous empty "
     "margin all round.",
     ["Upright, front view", "Readable when printed 10 mm tall"],
     ["Twine, photo or card attached", "Shadow"]),

    ("rb2-peg-front", "5 photo pages", "1024x1024", "TRANSPARENT", ["ref-style-banner.png", "ref-palette.png", "rb2-peg.png (colour and style only; NOT its side view)"],
     "Replaces rb2-peg on the washing line. Seen straight on: the twine passes behind its upper third and the photo's top edge sits behind its lower third; the peg is drawn on top of both (about 12 mm tall in print).",
     "One wooden clothes peg seen exactly from the FRONT, as you would see it clipped on a washing line facing you: a "
     "single flat upright strip of light honey wood, about one third as wide as it is tall, with softly rounded ends "
     "and two or three faint wood-grain lines. A small grey metal spring coil shows across the strip about one third "
     "from the top. One small mint leaf is tucked behind the top left corner. Flat and simple, no perspective. "
     "Centred with generous empty margin.",
     ["Pure front view: one flat strip, NO gap between jaws, NO second jaw visible", "Readable when printed 12 mm tall"],
     ["Side or three-quarter view", "Twine, photo or card attached", "Shadow"]),
]

ASSETS = [(a[0], a[1], a[2], TRANSPARENT if a[3] == "TRANSPARENT" else a[3], *a[4:]) for a in ASSETS]

STYLE_MD = f"""# Riverbay art brief (shared by every prompt file)

## Context
Riverbay is a **fictional** preschool. Its theme is a Riverbank Garden with four friendly animals: beaver (mascot), squirrel, bear and rabbit. These images go into a parent-facing semester **portfolio PDF** (A4, portrait and landscape) that teachers create for each child. The art is decoration and sample imagery: it must feel playful, cute and warm, but stay calm and readable. Real children never appear in generated art; teachers add real photos separately.

The style to match is **`ref-style-banner.png`**: thinner, even outlines, flat matte pastel fills and animals doing something. The older cut-outs in `ref-identity-characters.png` only tell you who each character is. **Do not copy their thicker crayon style.**

## Motifs the pages are built from
- **Willow strands dropping from the top**, like the willow at the top right of the banner. They hang partway down, never to the bottom. Animals hang from them and hold photos: the beaver with a paw, the squirrel with its tail.
- **An edge vine** climbing straight up the page edge on the same side as the photos, gently curly, never diagonal.
- **A winding river** entering at the top right and leaving at the bottom left, as a pale background layer. Photos, animals and plants sit in front of it.
- **A top garland and a bottom meadow**, which small animals run and hop along.
- **Subject mascots with a playful moment:** English, the beaver bonked by a falling letter A; 中文, the rabbit with a 毛笔 and ink-speckled fur; Mathematics, the squirrel juggling number blocks 1, 2 and 3; Social-emotional, animals together.

## Style block (prepend to every image prompt, word for word)

> {STYLE_BLOCK}

## Characters (identity)

> {CHARACTERS}

After `rb2-character-sheet.png` is approved, attach it to every later prompt as the identity reference, so all images show the same four characters.

## Technical rules
- **Transparent assets:** {TRANSPARENT}
- Keep a clean empty margin, unless a prompt file says the subject must touch an edge (willow, vines, garland, border, river, peeking squirrel).
- **Canvas:** use the size given in each prompt file, or the closest size the tool supports. The proportions of the drawing matter; Claude trims empty space afterwards.
- **Scenes** (`rb2-scene-*`) are opaque and fill the canvas. They stand in for teacher photos in sample reports and are always labelled as illustrations.

## Hard no
Text, letters, numbers, Chinese characters, symbols, logos, watermarks, signatures, people, children, human hands, photorealism, 3D, glossy or airbrushed shading, drop shadows, gradients, neon or saturated colours, dense clutter.

**The only exceptions** are the three subject mascots, and only exactly what their prompt files name:
- `rb2-beaver-letters`: one capital A and one lowercase a.
- `rb2-squirrel-numbers`: the number blocks 1, 2 and 3.
- `rb2-rabbit-brush`: the single ink stroke 一.

## Files and workflow (all in this one folder, no subfolders)
1. Work through `_INDEX.md` in order. **Generate #1 (`rb2-character-sheet`) first, then stop** until the user approves it.
2. For each asset, read its `rb2-<name>.prompt.md`. The final image prompt is the style block above, then the character identity line (for images with animals), then the prompt text in that file.
3. Attach the reference images listed in the prompt file. They are all in this folder.
4. Save the result in this folder as exactly `rb2-<name>.png`. Save alternatives as `rb2-<name>.alt1.png`, `rb2-<name>.alt2.png`, and so on; Claude uses only the exact name.
5. Fill in the **Result** section of that prompt file: tool and model, date, final prompt used, references attached and any edits.
6. Update the status in `_INDEX.md`: `pending`, `done`, `redo` (with a reason) or `skipped` (with a reason).
7. Do not edit, move or delete any file outside this folder, or any `ref-*.png`.
"""


def attach_label(x):
    name, _, note = x.partition(" ")
    return f"`{name}`" + (f" {note}" if note else "")


def prompt_md(a, n):
    aid, phase, canvas, bg, attach, used, prompt, must, avoid = a
    is_animal = phase.startswith(("1", "2")) or aid.startswith("rb2-scene") or any(a in aid for a in ("beaver", "squirrel", "rabbit", "bear"))
    lines = [
        f"# {aid}",
        "",
        f"- **Index:** #{n}, phase {phase}",
        "- **Status:** see `_INDEX.md`",
        f"- **Save as:** `{aid}.png` (this folder)",
        f"- **Canvas:** {canvas} (or closest supported)",
        f"- **Background:** {bg}",
        "- **Attach:** " + ", ".join(attach_label(x) for x in attach),
        f"- **Used in the report:** {used}",
        "",
        "## Prompt (after the style block" + (" and character identity line" if is_animal else "") + " from `_STYLE.md`)",
        "",
        prompt,
        "",
        "## Must",
        *[f"- {m}" for m in must],
        "",
        "## Avoid",
        *[f"- {m}" for m in avoid],
        "- Everything in the Hard no list in `_STYLE.md`",
        "",
        "## Result (filled in by the generator)",
        "",
        "- Tool and model:",
        "- Date:",
        "- Final prompt used:",
        "- References attached:",
        "- Edits or notes:",
        "",
    ]
    return "\n".join(lines)


def main():
    ART.mkdir(parents=True, exist_ok=True)
    (ART / "_STYLE.md").write_text(STYLE_MD, encoding="utf-8", newline="\n")
    rows = ["| # | File | Phase | Canvas | Status | Notes |", "|---|---|---|---|---|---|"]
    for n, a in enumerate(ASSETS, 1):
        p = ART / f"{a[0]}.prompt.md"
        if p.exists():
            print("kept existing", p.name)
        else:
            p.write_text(prompt_md(a, n), encoding="utf-8", newline="\n")
        rows.append(f"| {n} | `{a[0]}.png` | {a[1]} | {a[2]} | pending | |")
    index = (
        "# Art index\n\n"
        "Generate in this order. Read `_STYLE.md` first. **Stop after #1 for user approval.**\n"
        "Status values: `pending`, `done`, `redo` (give a reason), `skipped` (give a reason).\n"
        "Claude reads this table to find finished files: only rows marked `done`, at the exact file name.\n\n"
        + "\n".join(rows) + "\n\n"
        "## References in this folder (do not edit)\n\n"
        "| File | Use |\n|---|---|\n"
        "| `ref-style-banner.png` | **Style** to match (line weight, fills, mood) |\n"
        "| `ref-identity-characters.png` | **Identity only** (who each animal is), not style |\n"
        "| `ref-palette.png` | Brand colours |\n"
        "| `ref-placement-hanging.png` | Willow strand and paw positions (hanging beaver, beaver with letters) |\n"
        "| `ref-placement-tail.png` | Squirrel holding a frame corner with its tail |\n"
        "| `ref-placement-peeking.png` | Edge placement for the peeking squirrel |\n"
        "| `ref-placement-vine.png` | Growth path for the edge vine |\n"
        "| `ref-river-path.png` | Path for both river assets |\n"
    )
    if (ART / "_INDEX.md").exists():
        # Keep existing rows (they hold statuses); append rows for assets added since.
        idx = (ART / "_INDEX.md").read_text(encoding="utf-8")
        new_rows = [r for r in rows[2:] if f"`{r.split('`')[1]}`" not in idx]
        if new_rows:
            lines = idx.split("\n")
            last = max(i for i, line in enumerate(lines) if line.startswith("| ") and line.split("|")[1].strip().isdigit())
            lines[last + 1:last + 1] = new_rows
            (ART / "_INDEX.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")
            print(f"appended {len(new_rows)} rows to _INDEX.md")
        else:
            print("kept existing _INDEX.md (it holds generation statuses)")
    else:
        (ART / "_INDEX.md").write_text(index, encoding="utf-8", newline="\n")
    print(len(ASSETS), "assets")


main()
