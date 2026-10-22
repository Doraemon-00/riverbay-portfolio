"""Build the reference images for the art prompts, into the flat art/ folder.

    python -I tools/build_art_refs.py

Outputs (all derived from canonical Riverbay files, deterministic, no AI):
  ref-style-banner.png       STYLE reference: copy of riverbay/source/banner-riverbank.png
  ref-identity-characters.png IDENTITY reference: the four current characters, labelled
  ref-palette.png            brand palette swatches with hex codes
  ref-placement-hanging.png  where the hanging beaver's paws must be, relative to a photo frame
  ref-placement-peeking.png  how the peeking squirrel sits on a frame edge
  ref-placement-peeking-side.png  how the beaver peeks out sideways from behind the logo
  ref-placement-tail.png     how the hanging squirrel holds a frame corner with its tail
  ref-placement-vine.png     how the edge vine climbs the page edge beside a photo
  ref-river-path.png         the S/C path of the background river
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RIVERBAY = ROOT.parents[1] / "design-assets" / "riverbay"
OUT = ROOT / "art"
FONT = ROOT / "assets/fonts/static/nunito-800-latin.woff2"

INK = (43, 54, 49)
MUTED = (91, 104, 98)
PAPER = (251, 247, 238)
LINE = (190, 185, 172)
ACCENT = (161, 57, 44)


def font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(str(FONT), size)
    except OSError:
        return ImageFont.load_default()


def identity_sheet() -> None:
    names = [("beaver", "Beaver: peach-brown, crosshatched paddle tail, two front teeth"),
             ("squirrel", "Squirrel: orange-brown, cream belly, big curled tail"),
             ("bear", "Bear: butter-yellow, mint belly, round ears"),
             ("rabbit", "Rabbit: cream, pink inner ears, one ear gently bent")]
    w, h = 2000, 760
    sheet = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((40, 24), "IDENTITY ONLY: who each character is. Do NOT copy this thicker crayon style; follow ref-style-banner.png.", fill=ACCENT, font=font(30))
    for i, (n, label) in enumerate(names):
        art = Image.open(RIVERBAY / f"cutouts/characters/{n}.png").convert("RGBA")
        art.thumbnail((440, 520))
        x = 40 + i * 490
        sheet.paste(art, (x + (440 - art.width) // 2, 90 + (520 - art.height)), art)
        words, line, lines = label.split(), "", []
        for word in words:
            if len(line) + len(word) > 26:
                lines.append(line)
                line = ""
            line += word + " "
        lines.append(line)
        for j, t in enumerate(lines):
            d.text((x, 630 + j * 34), t.strip(), fill=INK, font=font(26))
    sheet.save(OUT / "ref-identity-characters.png", optimize=True)


def palette() -> None:
    sw = [("paper", "#FBF7EE"), ("mint", "#D5EDDF"), ("peach", "#F6D5C1"), ("powder blue", "#DCECF2"),
          ("butter", "#F8EDBC"), ("lavender", "#E9E0F3"), ("forest green", "#2F5C4D"), ("warm brown line", "#6B4A3A")]
    img = Image.new("RGB", (1600, 420), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((30, 20), "Riverbay palette: soft, matte pastels. Leaves may use deeper sage/forest tones.", fill=INK, font=font(30))
    for i, (n, hexv) in enumerate(sw):
        x = 30 + i * 195
        d.rounded_rectangle((x, 90, x + 170, 260), 24, fill=hexv, outline=LINE, width=3)
        d.text((x, 280), n, fill=INK, font=font(26))
        d.text((x, 320), hexv, fill=MUTED, font=font(24))
    img.save(OUT / "ref-palette.png", optimize=True)


def frame(d: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    d.rectangle(box, fill=(255, 255, 255), outline=LINE, width=6)
    d.rectangle((x0 + 22, y0 + 22, x1 - 22, y1 - 22), fill=(226, 232, 228))
    d.text((x0 + 60, (y0 + y1) // 2 - 20), "PHOTO (placed later, not drawn)", fill=MUTED, font=font(30))


LEAF = (120, 160, 120)
RIVER = (150, 196, 222)


def willow_strand(d: ImageDraw.ImageDraw, x: int, y0: int, y1: int) -> None:
    d.line((x, y0, x + 6, (y0 + y1) // 2, x, y1), fill=LEAF, width=8, joint="curve")
    for y in range(y0 + 30, y1 - 10, 46):
        side = 1 if (y // 46) % 2 else -1
        d.ellipse((x + side * 6 - 9 + (side * 12), y - 18, x + side * 6 + 9 + (side * 12), y + 18), fill=(150, 190, 150))


def bezier(points, steps=60):
    """Points along a chain of cubic Bezier segments: [p0, c1, c2, p1, c3, c4, p2, ...]."""
    out = []
    for i in range(0, len(points) - 3, 3):
        p0, c1, c2, p1 = points[i:i + 4]
        for k in range(steps + 1):
            t = k / steps
            mt = 1 - t
            out.append((
                mt**3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t**3 * p1[0],
                mt**3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t**3 * p1[1],
            ))
    return out


def placement_hanging() -> None:
    img = Image.new("RGB", (1400, 1100), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-beaver-hanging-willow.png: draw ONLY the beaver and its willow strand (no frame).", fill=ACCENT, font=font(30))
    willow_strand(d, 260, 70, 420)
    d.text((310, 110), "one willow strand drops from the TOP edge of the image", fill=INK, font=font(26))
    d.ellipse((205, 330, 330, 470), outline=ACCENT, width=6)
    d.text((345, 360), "LEFT paw grips the strand above the head", fill=INK, font=font(26))
    frame(d, (470, 620, 1330, 1060))
    d.ellipse((420, 560, 540, 680), outline=ACCENT, width=6)
    d.text((560, 540), "RIGHT paw reaches down and grips this TOP-LEFT frame corner", fill=INK, font=font(26))
    d.text((40, 980), "Body hangs between the two,", fill=INK, font=font(26))
    d.text((40, 1015), "feet dangling, cheerful face.", fill=INK, font=font(26))
    img.save(OUT / "ref-placement-hanging.png", optimize=True)


def placement_tail() -> None:
    img = Image.new("RGB", (1400, 1150), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-squirrel-hanging-willow.png: draw ONLY the squirrel and its strand (no frame).", fill=ACCENT, font=font(30))
    willow_strand(d, 300, 70, 360)
    d.text((350, 110), "willow strand drops from the TOP edge", fill=INK, font=font(26))
    d.ellipse((245, 280, 360, 400), outline=ACCENT, width=6)
    d.text((380, 300), "one front paw grips the strand", fill=INK, font=font(26))
    d.ellipse((120, 420, 230, 530), outline=ACCENT, width=6)
    d.text((40, 545), "other paw holds an acorn", fill=INK, font=font(26))
    frame(d, (520, 700, 1340, 1110))
    d.arc((380, 560, 620, 800), 200, 40, fill=ACCENT, width=8)
    d.text((640, 600), "big curled TAIL wraps around this TOP-LEFT frame corner", fill=INK, font=font(26))
    d.text((640, 640), "(tail tip may overlap the white border only)", fill=INK, font=font(26))
    img.save(OUT / "ref-placement-tail.png", optimize=True)


def placement_peeking() -> None:
    img = Image.new("RGB", (1400, 900), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-squirrel-peeking.png: draw ONLY the squirrel (no frame).", fill=ACCENT, font=font(30))
    d.rectangle((420, 150, 980, 470), outline=ACCENT, width=6)
    d.text((440, 170), "the image = this box", fill=ACCENT, font=font(26))
    d.text((440, 220), "head, two paws and tail tip visible", fill=INK, font=font(26))
    d.text((440, 260), "paws rest ON the bottom edge", fill=INK, font=font(26))
    frame(d, (200, 470, 1200, 860))
    d.text((40, 400), "frame top edge", fill=INK, font=font(26))
    img.save(OUT / "ref-placement-peeking.png", optimize=True)


def placement_peeking_side() -> None:
    img = Image.new("RGB", (1400, 900), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-beaver-peek-side.png: draw ONLY the beaver (no logo, no wall).", fill=ACCENT, font=font(30))
    d.rectangle((110, 250, 560, 650), fill=(226, 231, 228), outline=LINE, width=6)
    d.text((150, 410), "LOGO", fill=MUTED, font=font(34))
    d.text((150, 460), "(placed later, not drawn)", fill=MUTED, font=font(24))
    d.line((560, 700, 560, 740), fill=INK, width=4)
    d.text((470, 750), "logo right edge", fill=INK, font=font(24))
    d.rectangle((560, 210, 880, 690), outline=ACCENT, width=6)
    d.text((580, 225), "the image", fill=ACCENT, font=font(26))
    d.text((580, 258), "= this box", fill=ACCENT, font=font(26))
    for i, line in enumerate(["LEFT edge = clean vertical cut", "head and face turned to the viewer",
                              "body continues behind the logo", "nothing drawn left of the box"]):
        d.text((920, 240 + i * 46), line, fill=INK, font=font(26))
    # Paws: drawn in FRONT of the edge and fully visible, fingers curling round it (Revision 2).
    paw, line_w = (246, 196, 160), 5
    for top in (430, 560):
        d.rounded_rectangle((562, top, 640, top + 70), radius=34, fill=paw, outline=(107, 74, 58), width=line_w)
        for k in range(3):
            y = top + 18 + k * 17
            d.line((566, y, 584, y), fill=(107, 74, 58), width=4)
    d.text((660, 470), "RIGHT: whole paw", fill=(47, 92, 77), font=font(22))
    d.text((660, 498), "in front, fingers", fill=(47, 92, 77), font=font(22))
    d.text((660, 526), "curl round the edge", fill=(47, 92, 77), font=font(22))
    d.text((920, 440), "WRONG (not this):", fill=ACCENT, font=font(26))
    d.rectangle((920, 480, 1180, 640), outline=LINE, width=3)
    d.line((960, 480, 960, 640), fill=MUTED, width=4)
    d.pieslice((900, 520, 1020, 610), 270, 90, fill=paw, outline=(107, 74, 58), width=line_w)
    d.text((1030, 540), "paw sliced", fill=ACCENT, font=font(22))
    d.text((1030, 566), "by the edge", fill=ACCENT, font=font(22))
    img.save(OUT / "ref-placement-peeking-side.png", optimize=True)


def placement_vine() -> None:
    img = Image.new("RGB", (1300, 1300), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-vine-edge.png: draw ONLY the vine (no frame, no page).", fill=ACCENT, font=font(30))
    d.line((40, 80, 40, 1280), fill=MUTED, width=4)
    d.text((55, 85), "page edge", fill=MUTED, font=font(24))
    d.rectangle((60, 120, 400, 1270), outline=ACCENT, width=6)
    d.text((75, 1225), "the image = this tall box", fill=ACCENT, font=font(26))
    pts = [(120 + 20 * math.sin(i / 9), 1265 - i * 12) for i in range(97)]
    d.line(pts, fill=LEAF, width=12, joint="curve")
    for k, (x, y) in enumerate(pts[6::12]):
        dx = 30 if k % 2 else -30
        d.ellipse((x + min(0, dx) - 4, y - 14, x + max(0, dx) + 4, y + 6), fill=(150, 190, 150))
    for y in (1000, 700, 380):
        d.arc((120, y - 40, 300, y + 60), 260, 360, fill=LEAF, width=6)
    frame(d, (330, 260, 1250, 900))
    d.text((430, 940), "vine climbs STRAIGHT UP along the page edge, bottom to top,", fill=INK, font=font(26))
    d.text((430, 980), "gently curly; a few tendrils reach right and may touch", fill=INK, font=font(26))
    d.text((430, 1020), "the photo's white border. Mirrored in code for the right edge.", fill=INK, font=font(26))
    img.save(OUT / "ref-placement-vine.png", optimize=True)


def river_path() -> None:
    w, h = 1500, 1000
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    d.text((30, 20), "rb2-river-*.png: path of the river (from the user's sketch). Only the river is drawn.", fill=ACCENT, font=font(30))
    d.rectangle((60, 80, w - 60, h - 40), outline=ACCENT, width=6)
    path = bezier([
        (w - 60, 120), (w - 200, 230), (1100, 230), (700, 230),
        (300, 230), (120, 280), (180, 420),
        (240, 520), (1000, 480), (1180, 600),
        (1300, 700), (1000, 800), (700, 860),
        (450, 910), (250, 940), (60, h - 60),
    ])
    d.line(path, fill=RIVER, width=90, joint="curve")
    d.line(path, fill=(120, 170, 200), width=6, joint="curve")
    d.text((1090, 130), "enters top-right", fill=INK, font=font(26))
    d.text((80, h - 110), "exits bottom-left", fill=INK, font=font(26))
    d.text((520, 600), "S / C curve wandering across the page;", fill=INK, font=font(26))
    d.text((520, 640), "photos, animals and plants sit IN FRONT of it", fill=INK, font=font(26))
    img.save(OUT / "ref-river-path.png", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(RIVERBAY / "source/banner-riverbank.png", OUT / "ref-style-banner.png")
    identity_sheet()
    palette()
    placement_hanging()
    placement_tail()
    placement_peeking()
    placement_peeking_side()
    placement_vine()
    river_path()
    print("refs written to", OUT)


if __name__ == "__main__":
    main()
