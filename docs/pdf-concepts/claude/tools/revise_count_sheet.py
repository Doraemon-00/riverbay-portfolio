"""Revise #39 rb2-squirrel-count-sheet after review: squirrel without acorns, three reach poses.

    python -I revise_count.py <art folder>

Writes ref-sheet-count.png and appends a 'Revision 2' section to the prompt file
(the earlier prompt and Codex's Result notes are kept). Updates the #39 index note.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path(sys.argv[1])
FONT = ART.parent / "assets/fonts/static/nunito-800-latin.woff2"
INK, MUTED, ACCENT, PAPER, LINE = (43, 54, 49), (91, 104, 98), (161, 57, 44), (251, 247, 238), (190, 185, 172)


def font(n):
    try:
        return ImageFont.truetype(str(FONT), n)
    except OSError:
        return ImageFont.load_default()


def diagram(path):
    img = Image.new("RGB", (1200, 1330), PAPER)
    d = ImageDraw.Draw(img)
    d.text((40, 24), "Counting squirrel: where the pointing paw goes (no acorns drawn)", fill=ACCENT, font=font(30))
    d.text((40, 66), "One image, 2 x 2 equal cells. Dots, numbers and lines are for you only: draw none of them.", fill=INK, font=font(24))
    x0, y0, cell = 100, 130, 500
    targets = [0.56, 0.71, 0.86]          # fraction of cell width: near, middle, far
    notes = {1: "thinking, paw on chin", 2: "points at the NEAR dot", 3: "points at the MIDDLE dot", 4: "points at the FAR dot"}
    for n, (cx, cy) in zip(range(1, 5), [(0, 0), (1, 0), (0, 1), (1, 1)]):
        bx, by = x0 + cx * cell, y0 + cy * cell
        d.rectangle((bx, by, bx + cell, by + cell), outline=LINE, width=4)
        ground = by + int(cell * 0.86)
        for xx in range(bx + 10, bx + cell - 10, 28):
            d.line((xx, ground, xx + 16, ground), fill=(120, 160, 120), width=5)
        d.ellipse((bx + 60, ground - 230, bx + 230, ground), outline=MUTED, width=4)   # squirrel body zone
        d.text((bx + 95, ground - 130), "squirrel", fill=MUTED, font=font(22))
        for i, t in enumerate(targets, 1):
            px = bx + int(cell * t)
            hit = (n - 1) == i
            r = 16 if hit else 10
            d.ellipse((px - r, ground - 30 - r, px + r, ground - 30 + r), fill=ACCENT if hit else LINE)
            if hit:
                d.line((bx + 200, ground - 140, px, ground - 30), fill=ACCENT, width=6)
        d.text((bx + 16, by + 12), f"frame {n}: {notes[n]}", fill=ACCENT, font=font(24))
    foot = y0 + 2 * cell + 24
    d.text((40, foot), "The squirrel sits in the same place in every frame (left part of the cell). Only the arm, lean and face change.", fill=INK, font=font(22))
    d.text((40, foot + 34), "The app puts three acorns exactly under the three dots, so the paw tip must end right above its dot.", fill=INK, font=font(22))
    img.save(path, optimize=True)


REVISION = """
## Revision 2 (Claude review, replaces the prompt above)

The first version drew the acorns, and after three attempts the paw in frame 4 still missed the third acorn. New approach: **draw no acorns at all.** The app places the three acorns under the paw, so only the squirrel's reach has to be right.

**Attach:** `ref-style-banner.png`, `rb2-character-sheet.png`, `rb2-squirrel-numbers.png` (character), `ref-sheet-count.png` (reach targets)

**Prompt:** A 4-frame counting loop of the squirrel, sitting on the ground line in the LEFT part of each cell, facing right, laid out as a 2 x 2 grid of equal cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). There are NO acorns or other objects: the squirrel points at empty ground. Frame 1: thinking, one paw on its chin, looking down to the right. Frame 2: arm stretched out pointing down at the NEAR spot just in front of it. Frame 3: arm stretched further, leaning a little, pointing at the MIDDLE spot. Frame 4: leaning forward as far as it can, arm fully out, pointing at the FAR spot, tail curling up with excitement. Follow `ref-sheet-count.png` exactly: in frames 2, 3 and 4 the paw tip ends right above the marked dot.

**Must**
- No acorns, numbers or objects anywhere
- Squirrel body in the same place and size in every frame; only the arm, lean and face change
- Paw tip right above the target dot in frames 2, 3 and 4 (near, middle, far)
- Exactly 4 frames in a 2 x 2 grid, transparent background, no borders or labels
"""


def main():
    diagram(ART / "ref-sheet-count.png")
    p = ART / "rb2-squirrel-count-sheet.prompt.md"
    s = p.read_text(encoding="utf-8")
    if "## Revision 2" not in s:
        p.write_text(s.rstrip("\n") + "\n" + REVISION, encoding="utf-8", newline="\n")
    idx = ART / "_INDEX.md"
    s = idx.read_text(encoding="utf-8")
    old = "| 39 | `rb2-squirrel-count-sheet.png` | 6 app animation frames | 1024x1024 | redo | frame 4 paw misses rightmost acorn after three attempts |"
    if old in s:
        s = s.replace(old, "| 39 | `rb2-squirrel-count-sheet.png` | 6 app animation frames | 1024x1024 | redo | Claude review: use Revision 2 in the prompt file (no acorns; paw reaches the dots in ref-sheet-count.png). Earlier note: frame 4 paw missed the rightmost acorn after three attempts. |")
        if "ref-sheet-count.png" not in s.split("## References")[1]:
            s = s.rstrip("\n") + "\n| `ref-sheet-count.png` | Reach targets for the counting squirrel (#39, Revision 2) |\n"
        idx.write_text(s, encoding="utf-8", newline="\n")
    print("done")


main()
