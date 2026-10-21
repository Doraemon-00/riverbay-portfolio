"""Add the per-subject AI-drafting animation sets (loop sheet + finish frame) to the art folder.

    python -I add_drafting_sets.py <art folder>

Each subject: a 4-frame loop that plays while the AI drafts, then one finish frame that hands
over to that subject's existing end image:
  English          beaver swings, accidentally pulls a ribbon -> rb2-beaver-letters
  Chinese          rabbit writes (rows #35-#36, added earlier) -> rb2-rabbit-brush
  Mathematics      squirrel counts three acorns              -> rb2-squirrel-numbers
  Social-emotional bear and rabbit walk, lay the picnic mat  -> rb2-bear-rabbit-sharing
Never overwrites existing prompt files; appends index rows only once.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ART = Path(sys.argv[1])
FONT = ART.parent / "assets/fonts/static/nunito-800-latin.woff2"
INK, MUTED, ACCENT, PAPER, LINE = (43, 54, 49), (91, 104, 98), (161, 57, 44), (251, 247, 238), (190, 185, 172)
LEAF = (120, 160, 120)


def font(n):
    try:
        return ImageFont.truetype(str(FONT), n)
    except OSError:
        return ImageFont.load_default()


def swing_diagram(path):
    img = Image.new("RGB", (1200, 1300), PAPER)
    d = ImageDraw.Draw(img)
    d.text((40, 24), "Frame sheet layout (beaver swinging on a willow strand)", fill=ACCENT, font=font(30))
    d.text((40, 66), "One image, 2 x 2 equal cells. Numbers and lines here are for you only: draw none of them.", fill=INK, font=font(24))
    x0, y0, cell = 100, 130, 500
    angles = {1: -22, 2: 0, 3: 22, 4: 0}
    notes = {1: "swung left", 2: "passing the middle", 3: "swung right", 4: "passing back"}
    for n, (cx, cy) in zip(range(1, 5), [(0, 0), (1, 0), (0, 1), (1, 1)]):
        bx, by = x0 + cx * cell, y0 + cy * cell
        d.rectangle((bx, by, bx + cell, by + cell), outline=LINE, width=4)
        d.text((bx + 16, by + cell - 44), f"frame {n}: {notes[n]}", fill=ACCENT, font=font(26))
        px, py = bx + cell // 2, by
        a = math.radians(angles[n])
        ex, ey = px + 330 * math.sin(a), py + 330 * math.cos(a)
        d.line((px, py, ex, ey), fill=LEAF, width=10)
        d.ellipse((px - 10, py - 4, px + 10, py + 16), fill=ACCENT)
        d.ellipse((ex - 55, ey - 10, ex + 55, ey + 110), outline=MUTED, width=4)
        d.text((ex - 40, ey + 30), "beaver", fill=MUTED, font=font(22))
    foot = y0 + 2 * cell + 24
    d.text((40, foot), "The strand always starts at the SAME point: the middle of the cell's top edge (red dot).", fill=INK, font=font(24))
    d.text((40, foot + 36), "Same beaver, same size; only the swing angle and pose change. Transparent background.", fill=INK, font=font(24))
    img.save(path, optimize=True)


TRANSPARENT = ("Transparent background PNG. If transparency is unavailable, use a flat pure white "
               "(#FFFFFF) background with no ground patch, no shadow and no vignette.")
GRID = "ref-sheet-grid.png (layout)"

# (id, canvas, attach, used, prompt, must, avoid)
ASSETS = [
    ("rb2-beaver-swing-sheet", "1024x1024 (2 x 2 frames)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-beaver-hanging-willow.png (character on a strand)", "ref-sheet-swing.png (layout)"],
     "English drafting animation: loops while the AI drafts the English narrative.",
     "A 4-frame swinging loop of the beaver hanging from a single willow strand, laid out as a 2 x 2 grid of equal cells "
     "(order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). In every cell the strand starts at exactly the "
     "middle of the cell's top edge; the beaver hangs from it with one paw, the other paw free, tail and feet trailing. "
     "Frame 1: swung out to the left, body trailing, gleeful face. Frame 2: passing the middle, body straight below the "
     "pivot. Frame 3: swung out to the right. Frame 4: passing the middle again on the way back. Pure joy, playing.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Strand starts at the middle of each cell's top edge (follow ref-sheet-swing.png)",
      "Same beaver, same size in every cell", "One strand only, slender willow like the banner"],
     ["Letters or anything falling (that happens in the finish frame)", "Other plants or ground", "Cell borders, numbers or labels"]),

    ("rb2-beaver-swing-finish", "1024x1536 (same canvas as rb2-beaver-letters.png)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-beaver-letters.png (end state and composition)", "rb2-beaver-swing-sheet.png (swinging pose)"],
     "English drafting finish: plays once when the draft arrives, then hands over to rb2-beaver-letters.png (the letter bonks its head).",
     "The accident, in exactly the same canvas and layout as rb2-beaver-letters.png: the beaver, still hanging from the "
     "same single willow strand, has swung too far and its free paw has snagged a thin ribbon dangling from the top edge of "
     "the image. The ribbon has just come loose: a big chunky capital letter A (rounded, butter-yellow, soft toy style) "
     "is dropping from the top, above the beaver's head but not touching it yet, and a smaller lowercase letter a "
     "(mint green, same style) is starting to tumble beside it. The beaver looks up, eyes wide, mouth in a little 'oh!'. "
     "The next moment (rb2-beaver-letters.png) the A bonks its head.",
     ["Same canvas and strand position as rb2-beaver-letters.png", "EXACTLY one capital A and one lowercase a",
      "The A clearly above the head, not touching it yet", "The loose ribbon visible near the top"],
     ["Any other letters, words or numbers", "Stars or dizzy symbols", "A second strand or other plants"]),

    ("rb2-squirrel-count-sheet", "1024x1024 (2 x 2 frames)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-squirrel-numbers.png (character)", GRID],
     "Mathematics drafting animation: loops while the AI drafts; the app shows 1, 2, 3 in speech bubbles as the squirrel points.",
     "A 4-frame counting loop: the squirrel sits on the ground line facing slightly right, with three acorns in a neat row "
     "in front of it. The three acorns stay in exactly the same places in every frame. Laid out as a 2 x 2 grid of equal "
     "cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frame 1: looking at the acorns, one paw on "
     "its chin, thinking. Frame 2: pointing at the first acorn (left), eyes on it. Frame 3: pointing at the second acorn "
     "(middle). Frame 4: pointing at the third acorn (right), tail curling up with excitement.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Three acorns in the same places in every frame",
      "The pointing paw clearly over the correct acorn", "Same squirrel, same size and position in every cell"],
     ["Any numbers, number blocks or symbols (the app draws the counting)", "Ground or grass", "Cell borders or labels"]),

    ("rb2-squirrel-count-finish", "1536x1024 (same canvas as rb2-squirrel-numbers.png)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-squirrel-numbers.png (end state and composition)", "rb2-squirrel-count-sheet.png (counting pose)"],
     "Mathematics drafting finish: plays once when the draft arrives, then hands over to rb2-squirrel-numbers.png.",
     "The 'got it!' moment, with the squirrel at the same size and position as in rb2-squirrel-numbers.png: it jumps up "
     "with both paws in the air, tail fanned out, overjoyed. The three acorns are bouncing up into the air around it, "
     "each one surrounded by a small soft puff, as if they are about to turn into the number blocks of the next image "
     "(rb2-squirrel-numbers.png). Place the three acorns roughly where the 1 (above the head), the 2 (in front of its "
     "chest) and the 3 (on the tail) are in that image.",
     ["Same canvas, size and position as rb2-squirrel-numbers.png", "Three acorns placed where the 1, 2 and 3 blocks will be",
      "Small soft puffs, not explosions"],
     ["Any numbers or symbols", "Sparkles that look like stars", "Ground or scenery"]),

    ("rb2-bear-rabbit-walk-sheet", "1024x1024 (2 x 2 frames)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-bear-rabbit-sharing.png (characters, basket and mat colours)", GRID],
     "Social-emotional drafting animation: the pair walks across the panel (the app moves them) while the AI drafts.",
     "A 4-frame walking loop of the bear and the rabbit walking together side by side, full side view facing RIGHT, the "
     "rabbit on the near side. The bear carries a rolled-up peach checked picnic mat under one arm (the same mat as in "
     "rb2-bear-rabbit-sharing.png); the rabbit carries the same small woven basket. Laid out as a 2 x 2 grid of equal "
     "cells (order: top-left 1, top-right 2, bottom-left 3, bottom-right 4). Frames 1-4 are a calm walk cycle: 1 contact "
     "(front feet forward), 2 passing (feet together, bodies slightly up), 3 contact with the other feet, 4 passing again. "
     "They glance at each other happily.",
     ["Exactly 4 frames in a 2 x 2 grid, in the stated order", "Both characters walking in step, feet on the ground line",
      "Same size and position of the pair in every cell", "Mat and basket match rb2-bear-rabbit-sharing.png"],
     ["Ground, grass or scenery", "Moving the pair across the cell (the app does that)", "Cell borders or labels"]),

    ("rb2-bear-rabbit-mat-finish", "1926x817 (same canvas as rb2-bear-rabbit-sharing.png)",
     ["ref-style-banner.png", "rb2-character-sheet.png", "rb2-bear-rabbit-sharing.png (end state and composition)", "rb2-bear-rabbit-walk-sheet.png (walking pair)"],
     "Social-emotional drafting finish: plays once when the draft arrives, then hands over to rb2-bear-rabbit-sharing.png.",
     "Laying down the picnic, in exactly the same canvas, positions and scale as rb2-bear-rabbit-sharing.png: the bear "
     "and the rabbit each hold two corners of the peach checked picnic mat and are spreading it out together; the mat is "
     "mid-air, billowing gently, just about to settle on the same clover patch. The basket already sits on the grass "
     "where it is in the next image. Both are smiling at each other.",
     ["Same canvas, positions and scale as rb2-bear-rabbit-sharing.png", "Mat billowing mid-air, held by both",
      "Basket and clover patch where they are in the end image"],
     ["Food already served (that is the next image)", "Background scenery beyond the clover patch", "Text"]),
]


def prompt_md(n, a):
    aid, canvas, attach, used, prompt, must, avoid = a
    label = lambda x: f"`{x.split(' ')[0]}`" + (" " + x.split(" ", 1)[1] if " " in x else "")
    return "\n".join([
        f"# {aid}", "",
        f"- **Index:** #{n}, phase 6 app animation frames (AI drafting set)",
        "- **Status:** see `_INDEX.md`",
        f"- **Save as:** `{aid}.png` (this folder)",
        f"- **Canvas:** {canvas}",
        f"- **Background:** {TRANSPARENT}",
        "- **Attach:** " + ", ".join(label(x) for x in attach),
        f"- **Used in the app:** {used}",
        "", "## Prompt (after the style block and character identity line from `_STYLE.md`)", "", prompt, "",
        "## Must", *[f"- {m}" for m in must], "",
        "## Avoid", *[f"- {m}" for m in avoid], "- Everything in the Hard no list in `_STYLE.md`", "",
        "## Result (filled in by the generator)", "",
        "- Tool and model:", "- Date:", "- Final prompt used:", "- References attached:", "- Edits or notes:", "",
    ])


DRAFTING_NOTE = """
**AI drafting sets.** Each subject has a loop sheet that plays while the AI drafts and a finish frame that hands over to that subject's existing image, so the story ends where the art already is:

| Subject | Loop (while drafting) | Finish (once, when the draft arrives) | Ends on (existing) |
|---|---|---|---|
| English | `rb2-beaver-swing-sheet` | `rb2-beaver-swing-finish` | `rb2-beaver-letters` |
| 中文 | `rb2-rabbit-write-sheet` | `rb2-rabbit-write-finish` | `rb2-rabbit-brush` |
| Mathematics | `rb2-squirrel-count-sheet` | `rb2-squirrel-count-finish` | `rb2-squirrel-numbers` |
| Social-emotional | `rb2-bear-rabbit-walk-sheet` | `rb2-bear-rabbit-mat-finish` | `rb2-bear-rabbit-sharing` |

A finish frame must use the same canvas, scale and positions as its end image, so the hand-over looks continuous.
"""


def main():
    swing_diagram(ART / "ref-sheet-swing.png")
    start = 37
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
    if "rb2-beaver-swing-sheet" not in s:
        anchor = "| 36 | `rb2-rabbit-write-finish.png` | 6 app animation frames | 1536x1024 | pending | |"
        assert anchor in s
        s = s.replace(anchor, anchor + "\n" + "\n".join(rows), 1)
        s = s.rstrip("\n") + "\n| `ref-sheet-swing.png` | 2 x 2 swinging layout with a fixed pivot (#37) |\n"
        idx.write_text(s, encoding="utf-8", newline="\n")

    st = ART / "_STYLE.md"
    s = st.read_text(encoding="utf-8")
    if "**AI drafting sets.**" not in s:
        old = "- `rb2-rabbit-write-finish`: the same single ink stroke 一 (the writing sheet's paper stays blank)."
        assert old in s
        s = s.replace(old, old + "\n- `rb2-beaver-swing-finish`: one capital A and one lowercase a (the swinging sheet has no letters)."
                      "\n- The counting squirrel (`rb2-squirrel-count-sheet`, `rb2-squirrel-count-finish`) has NO numbers: the app draws the counting.")
        anchor = "- Transparent background as for every other asset.\n"
        assert anchor in s
        s = s.replace(anchor, anchor + DRAFTING_NOTE, 1)
        st.write_text(s, encoding="utf-8", newline="\n")
    print("done")


main()
