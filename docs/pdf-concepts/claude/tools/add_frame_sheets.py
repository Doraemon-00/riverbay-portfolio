"""Add animation frame-sheet prompts to the concept art folder.

    python -I add_frame_sheets.py <art folder>

Adds (never overwrites existing files or rows):
  ref-sheet-grid.png, ref-sheet-swim.png        layout diagrams for 2x2 frame sheets
  rb2-*-sheet.prompt.md, rb2-rabbit-write-finish.prompt.md
  rows 32-36 in _INDEX.md, two reference rows, and a frame-sheet section in _STYLE.md
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path(sys.argv[1])
FONT = ART.parent / "assets/fonts/static/nunito-800-latin.woff2"
INK, MUTED, ACCENT, PAPER, LINE = (43, 54, 49), (91, 104, 98), (161, 57, 44), (251, 247, 238), (190, 185, 172)
WATER = (150, 196, 222)


def font(n):
    try:
        return ImageFont.truetype(str(FONT), n)
    except OSError:
        return ImageFont.load_default()


def grid_diagram(path, title, line_label, swim=False):
    img = Image.new("RGB", (1200, 1300), PAPER)
    d = ImageDraw.Draw(img)
    d.text((40, 24), title, fill=ACCENT, font=font(30))
    d.text((40, 66), "One image, 2 x 2 equal cells. Numbers and lines here are for you only: draw none of them.", fill=INK, font=font(24))
    x0, y0, cell = 100, 130, 500
    order = {(0, 0): 1, (1, 0): 2, (0, 1): 3, (1, 1): 4}
    for (cx, cy), n in order.items():
        bx, by = x0 + cx * cell, y0 + cy * cell
        d.rectangle((bx, by, bx + cell, by + cell), outline=LINE, width=4)
        d.text((bx + 16, by + 12), f"frame {n}", fill=ACCENT, font=font(28))
        mid = bx + cell // 2
        for yy in range(by + 50, by + cell - 10, 24):  # vertical centre line (dashed)
            d.line((mid, yy, mid, yy + 12), fill=MUTED, width=3)
        base = by + int(cell * (0.62 if swim else 0.86))
        if swim:
            d.rectangle((bx + 4, base, bx + cell - 4, by + cell - 4), fill=(225, 238, 245))
        for xx in range(bx + 10, bx + cell - 10, 28):  # baseline / waterline (dashed)
            d.line((xx, base, xx + 16, base), fill=WATER if swim else (120, 160, 120), width=5)
        d.text((bx + 16, base + 8), line_label, fill=INK, font=font(22))
    foot = y0 + 2 * cell + 24
    d.text((40, foot), "Same character, same size and same position in every cell; only the pose changes.", fill=INK, font=font(24))
    d.text((40, foot + 36), "Centre the body on the dashed vertical line. Transparent background, no cell borders.", fill=INK, font=font(24))
    img.save(path, optimize=True)


TRANSPARENT = ("Transparent background PNG. If transparency is unavailable, use a flat pure white "
               "(#FFFFFF) background with no ground patch, no shadow and no vignette.")
SHEET_REFS = ["ref-style-banner.png", "rb2-character-sheet.png", "ref-sheet-grid.png (layout)"]

# (id, canvas, background, attach, used, prompt, must, avoid)
ASSETS = [
    ("rb2-squirrel-run-sheet", "1024x1024 (2 x 2 frames)", TRANSPARENT,
     SHEET_REFS + ["rb2-squirrel-running.png (pose and acorn)"],
     "Loading animation and the logo run: the app flips through the 4 frames while moving the squirrel along the meadow (about 40-60 mm wide on screen).",
     "A 4-frame running cycle of the squirrel, full side view facing RIGHT, the same character and acorn as "
     "rb2-squirrel-running.png, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, "
     "bottom-right 4). Frame 1 contact: front paws reach forward and touch the ground line, hind legs stretched back, tail "
     "streaming up. Frame 2 gather: body compressed and round, all four paws bunched under the body, tail curling high. "
     "Frame 3 push-off: hind legs extended back pushing off, front paws tucked, body stretched forward. Frame 4 flight: all "
     "paws off the ground (just above the line), body long, tail streaming back. The acorn stays tucked under the same arm "
     "in every frame.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Same squirrel, same size, same body position in every cell",
      "Feet on the same baseline in frames 1-3 (follow ref-sheet-grid.png)", "Facing right in every frame"],
     ["Cell borders, numbers or labels", "Ground, grass, motion lines or dust", "Changing size or drifting position between frames"]),

    ("rb2-rabbit-hop-sheet", "1024x1024 (2 x 2 frames)", TRANSPARENT,
     SHEET_REFS + ["rb2-rabbit-hopping.png (pose)"],
     "Loading animation: the rabbit hops behind the squirrel (about 40-60 mm wide on screen).",
     "A 4-frame hop cycle of the rabbit, full side view facing RIGHT, the same character as rb2-rabbit-hopping.png, laid "
     "out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1 crouch: "
     "body low and round, legs folded, ears tipped back a little. Frame 2 push-off: hind legs extending, body angled up and "
     "forward, ears flowing back. Frame 3 airborne: body fully stretched, front paws reaching forward, hind legs straight "
     "back, ears streaming back, feet slightly above the line. Frame 4 landing: front paws touching down, hind legs swinging "
     "forward under the body, ears bouncing forward.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Same rabbit, same size, centred in every cell",
      "Both ears visible in every frame, one gently bent", "Do not lift the rabbit high in frame 3: the app adds the jump height"],
     ["Cell borders, numbers or labels", "Ground, grass, motion lines or dust", "Carrot or other props"]),

    ("rb2-beaver-swim-sheet", "1024x1024 (2 x 2 frames)", TRANSPARENT,
     ["ref-style-banner.png", "rb2-character-sheet.png", "ref-sheet-swim.png (waterline layout)"],
     "Logo easter egg: the beaver swims along the stream under the top bar (about 30-45 mm wide on screen).",
     "A 4-frame swimming cycle of the beaver seen from the side, facing RIGHT, as if swimming in a stream: only the part "
     "above the water is drawn, and every frame is cut by the same perfectly straight horizontal waterline (nothing below "
     "it). Show the head, the top of the back and, behind, the flat crosshatched tail. Laid out as a 2 x 2 grid of equal "
     "cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: head up, nose raised, eyes bright. "
     "Frame 2: head dipping slightly forward, a tiny splash at the nose. Frame 3: head lowest, cheeks puffed, tail tip lifting "
     "out of the water behind. Frame 4: rising again, tail giving a light slap with two or three small powder-blue droplets. "
     "Two short powder-blue ripple marks sit on the waterline at the front and back of the body.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Same straight waterline height in every cell (follow ref-sheet-swim.png)",
      "Nothing drawn below the waterline", "Same beaver, same size, same position in every cell"],
     ["Drawing the water body, a river bank or background", "Legs or underwater parts", "Cell borders, numbers or labels"]),

    ("rb2-rabbit-write-sheet", "1024x1024 (2 x 2 frames)", TRANSPARENT,
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-rabbit-brush.png (composition and pose)", "ref-sheet-grid.png (layout)"],
     "AI drafting: while the narrative draft is generating, the app loops these frames and draws the ink strokes on the paper itself.",
     "A 4-frame writing loop of the rabbit with a Chinese calligraphy brush (毛笔), using the SAME composition, scale and "
     "camera as rb2-rabbit-brush.png: rabbit sitting, small sheet of cream rice paper in front of it, small round inkstone "
     "beside the paper, all in the same places in every frame. The rabbit's fur is CLEAN and white: no ink anywhere on it. "
     "The paper stays completely BLANK in every frame (the app draws the strokes). Laid out as a 2 x 2 grid of equal cells "
     "(order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: brush raised above the paper, rabbit "
     "studying the paper, tongue tip out in concentration. Frame 2: brush tip touching the paper at its left end. Frame 3: "
     "brush sweeping to the right, body leaning with the stroke. Frame 4: brush lifting at the right end, small satisfied "
     "smile.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Paper blank and clean fur in every frame",
      "Rabbit, paper and inkstone in the same positions in every cell", "Brush clearly a Chinese 毛笔"],
     ["Any ink on the paper or the fur", "Any characters, letters or numbers", "Cell borders, numbers or labels"]),

    ("rb2-rabbit-write-finish", "1536x1024 (same canvas as rb2-rabbit-brush.png)", TRANSPARENT,
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-rabbit-brush.png (composition, end state)", "rb2-rabbit-write-sheet.png (clean pose)"],
     "AI drafting finish: plays once when the draft arrives, between the writing loop and the ink-speckled end image rb2-rabbit-brush.png.",
     "The finishing moment, in exactly the same composition, scale and positions as rb2-rabbit-brush.png: the rabbit has "
     "just completed one bold horizontal stroke 一 on the rice paper and flicks the brush up in triumph. A few small black "
     "ink droplets fly through the air, and the first ones are landing on its white fur and cheek. Eyes squeezed shut in a "
     "proud grin. This frame sits between the clean writing frames and the ink-speckled rb2-rabbit-brush.png, so its ink "
     "speckles should be fewer than in that image and in matching places.",
     ["Same canvas, composition and positions as rb2-rabbit-brush.png", "Only ONE character on the paper: the stroke 一",
      "Droplets visibly mid-air"],
     ["Any other characters, letters or numbers", "Big ink puddles", "Changing the paper or inkstone position"]),
]


def prompt_md(n, a):
    aid, canvas, bg, attach, used, prompt, must, avoid = a
    label = lambda x: f"`{x.split(' ')[0]}`" + (" " + x.split(" ", 1)[1] if " " in x else "")
    return "\n".join([
        f"# {aid}", "",
        f"- **Index:** #{n}, phase 6 app animation frames",
        "- **Status:** see `_INDEX.md`",
        f"- **Save as:** `{aid}.png` (this folder)",
        f"- **Canvas:** {canvas}",
        f"- **Background:** {bg}",
        "- **Attach:** " + ", ".join(label(x) for x in attach),
        f"- **Used in the app:** {used}",
        "", "## Prompt (after the style block and character identity line from `_STYLE.md`)", "", prompt, "",
        "## Must", *[f"- {m}" for m in must], "",
        "## Avoid", *[f"- {m}" for m in avoid], "- Everything in the Hard no list in `_STYLE.md`", "",
        "## Result (filled in by the generator)", "",
        "- Tool and model:", "- Date:", "- Final prompt used:", "- References attached:", "- Edits or notes:", "",
    ])


STYLE_SECTION = """
## Animation frame sheets (phase 6)
The app flips through these frames like a flipbook, so consistency matters more than anything else.
- **One image per sheet:** draw all frames in a single generation, not as separate images, so the character stays identical.
- **Layout:** 2 x 2 equal cells, read left to right, top to bottom (frame 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right). Follow `ref-sheet-grid.png`, or `ref-sheet-swim.png` for the swimming beaver.
- **Same everything except the pose:** same character, size and line weight, body centred on the same spot in every cell, feet (or the waterline) at the same height.
- **No helpers drawn:** no cell borders, frame numbers, guide lines, motion lines or ground.
- **Movement across the screen is done by the app:** draw the character in place; do not move it around the cell or raise it high for jumps.
- Transparent background as for every other asset.
"""


def main():
    grid_diagram(ART / "ref-sheet-grid.png", "Frame sheet layout (run, hop, writing)", "ground line: feet rest here")
    grid_diagram(ART / "ref-sheet-swim.png", "Frame sheet layout (beaver swimming)", "waterline: straight cut, nothing below", swim=True)
    start = 32
    rows = []
    for i, a in enumerate(ASSETS):
        n = start + i
        p = ART / f"{a[0]}.prompt.md"
        if p.exists():
            print("kept existing", p.name)
        else:
            p.write_text(prompt_md(n, a), encoding="utf-8", newline="\n")
        rows.append(f"| {n} | `{a[0]}.png` | 6 app animation frames | {a[1].split(' ')[0]} | pending | |")

    idx = ART / "_INDEX.md"
    s = idx.read_text(encoding="utf-8")
    if "rb2-squirrel-run-sheet" not in s:
        anchor = "\n\n## References in this folder (do not edit)"
        assert anchor in s
        s = s.replace(anchor, "\n" + "\n".join(rows) + anchor, 1)
        s = s.rstrip("\n") + "\n| `ref-sheet-grid.png` | 2 x 2 frame-sheet layout with ground line (#32, #33, #35) |\n| `ref-sheet-swim.png` | 2 x 2 frame-sheet layout with waterline (#34) |\n"
        idx.write_text(s, encoding="utf-8", newline="\n")

    st = ART / "_STYLE.md"
    s = st.read_text(encoding="utf-8")
    if "## Animation frame sheets" not in s:
        old = "- `rb2-rabbit-brush`: the single ink stroke 一."
        assert old in s
        s = s.replace(old, old + "\n- `rb2-rabbit-write-finish`: the same single ink stroke 一 (the writing sheet's paper stays blank).")
        anchor = "\n## Files and workflow"
        assert anchor in s
        s = s.replace(anchor, STYLE_SECTION + anchor, 1)
        st.write_text(s, encoding="utf-8", newline="\n")
    print("done")


main()
