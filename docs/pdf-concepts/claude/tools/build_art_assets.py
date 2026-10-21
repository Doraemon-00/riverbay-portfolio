"""Process the generated rb2 art (art/) into print-ready template assets (assets/art/).

    python -I tools/build_art_assets.py

Reads art/_INDEX.md and processes ONLY rows whose status is `done`, at their exact
file names, so older assets are never picked up by accident. For each file:

  * trim     crop to the visible subject (alpha > 12), keeping an edge where the art
             must touch it (willow tops, vine ends, peeking squirrel's straight cut)
  * crop     opaque scenes: drop the empty paper band on one side (deterministic
             column profile), or keep the full canvas
  * resize   to about 240 dpi at the largest size the template prints it (never upscaled)
  * mirror   optional left-right flipped copy (no text in these images, so flipping is safe)

Outputs: assets/art/<name>.png (transparent) or .jpg (opaque scenes),
         assets/art/<name>.mirrored.*, and assets/art/anchors.json with the grip
         points (as fractions of the processed image) used to attach hanging animals
         to photo corners. Deterministic; no network, no AI.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art"
OUT = ROOT / "assets" / "art"
DPI = 240

# name: kind, largest print size in mm (longest side), mirror?, anchor in TRIMMED source pixels
SPECS = {
    "rb2-squirrel-running": dict(kind="cutout", mm=40),
    "rb2-rabbit-hopping": dict(kind="cutout", mm=40),
    "rb2-beaver-hanging-willow": dict(kind="cutout", mm=95, mirror=True, grip=(380, 725)),
    "rb2-squirrel-hanging-willow": dict(kind="cutout", mm=85, mirror=True, grip=(300, 730)),
    "rb2-bear-climbing-vine": dict(kind="cutout", mm=130, mirror=True),
    "rb2-squirrel-peeking": dict(kind="cutout", mm=45),
    "rb2-bear-rabbit-sharing": dict(kind="cutout", mm=85),
    "rb2-beaver-squirrel-waving": dict(kind="cutout", mm=95),
    "rb2-beaver-letters": dict(kind="cutout", mm=75),
    "rb2-rabbit-brush": dict(kind="cutout", mm=65),
    "rb2-squirrel-numbers": dict(kind="cutout", mm=70),
    "rb2-garland-top": dict(kind="cutout", mm=297),
    "rb2-willow-drop": dict(kind="cutout", mm=170),
    "rb2-vine-edge": dict(kind="cutout", mm=190, mirror=True),
    "rb2-meadow-border": dict(kind="cutout", mm=297),
    "rb2-river-landscape": dict(kind="full", mm=297),
    "rb2-river-portrait": dict(kind="full", mm=297),
    "rb2-flower-accent": dict(kind="cutout", mm=14),
    "rb2-scene-cover-garden": dict(kind="scene", crop="none"),
    "rb2-scene-reading-corner": dict(kind="scene", crop="left-empty", mirror=True),
    "rb2-scene-story-circle": dict(kind="scene", crop="left-empty", mirror=True),
    "rb2-scene-garden-planting": dict(kind="scene", crop="left-empty", mirror=True),
    "rb2-scene-counting-stones": dict(kind="scene", crop="none"),
    "rb2-scene-sharing-snack": dict(kind="scene", crop="none"),
    "rb2-beaver-camera": dict(kind="cutout", mm=62),
    "rb2-squirrel-tripod": dict(kind="cutout", mm=70),
    "rb2-rabbit-snapshots": dict(kind="cutout", mm=60),
    "rb2-photo-line": dict(kind="cutout", mm=297, curve=True),
    "rb2-peg": dict(kind="cutout", mm=14),
    "rb2-peg-front": dict(kind="cutout", mm=16),
}


def done_assets() -> set[str]:
    rows = re.findall(r"^\|\s*\d+\s*\|\s*`(rb2-[a-z0-9-]+)\.png`\s*\|[^|]*\|[^|]*\|\s*(\w+)\s*\|", (ART / "_INDEX.md").read_text(encoding="utf-8"), re.M)
    return {name for name, status in rows if status == "done"}


def target_px(mm: float) -> int:
    return round(mm / 25.4 * DPI)


def fit(img: Image.Image, longest: int) -> Image.Image:
    s = longest / max(img.size)
    if s >= 1:
        return img
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


def scene_crop(img: Image.Image) -> Image.Image:
    """Drop an empty paper band on the left: first column where >3% of pixels differ from paper."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    paper = rgb.getpixel((4, 4))
    px = rgb.load()
    step = 4
    left = 0
    for x in range(0, w, step):
        busy = sum(1 for y in range(0, h, step) if sum(abs(a - b) for a, b in zip(px[x, y], paper)) > 40)
        if busy > 0.03 * (h / step):
            left = max(0, x - round(0.03 * w))
            break
    return rgb.crop((left, 0, w, h))


def garland_bottom() -> dict:
    """Bottom border in the new style: the top garland flipped upside down, so its leaves and
    flowers grow up from the vine. It is cut at the column where the vine returns to its
    starting height and slope, so CSS can repeat it across the page without a jog."""
    src = Image.open(OUT / "rb2-garland-top.png").convert("RGBA")
    f = ImageOps.flip(src)
    px = f.load()
    w, h = f.size

    def centre(x):
        rows = [y for y in range(h) if px[x, y][3] > 200 and px[x, y][0] > px[x, y][1] + 10 and px[x, y][0] > px[x, y][2] + 25 and px[x, y][0] < 210]
        return sum(rows) / len(rows) if rows else None

    c0, s0 = centre(2), centre(12) - centre(2)
    best = None
    for x in range(w - 500, w - 12):
        c, c2 = centre(x), centre(x + 10)
        if c is None or c2 is None:
            continue
        err = abs(c - c0) + 0.5 * abs((c2 - c) - s0)
        if best is None or err < best[0]:
            best = (err, x)
    tile = f.crop((0, 0, best[1], h))
    tile.save(OUT / "rb2-garland-bottom.png", "PNG", optimize=True)
    return {"source": "assets/art/rb2-garland-top.png", "edits": f"flipped vertically, cut at x={best[1]} (vine height/slope error {best[0]:.1f} px) for seamless repeat", "outputs": ["assets/art/rb2-garland-bottom.png"], "output_px": list(tile.size)}


def twine_curve(img: Image.Image, samples: int = 21) -> list[list[float]]:
    """Centre line of the brown twine as [x, y] fractions of the trimmed image, sampled
    across its width (leaves and flowers are ignored by colour)."""
    px = img.load()
    w, h = img.size
    out = []
    for i in range(samples):
        x = min(w - 1, round(i * (w - 1) / (samples - 1)))
        ys = [y for y in range(h) if px[x, y][3] > 128 and px[x, y][0] > px[x, y][1] + 8 and px[x, y][0] > px[x, y][2] + 15 and px[x, y][0] < 215]
        if ys:
            ys.sort()
            out.append([round(x / (w - 1), 4), round(ys[len(ys) // 2] / (h - 1), 4)])
    return out


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    done = done_assets()
    anchors, report = {}, []
    for name, spec in SPECS.items():
        src = ART / f"{name}.png"
        if name not in done or not src.exists():
            report.append(f"skipped {name} (not done in _INDEX.md)")
            continue
        img = Image.open(src)
        info = {"source": f"art/{name}.png", "source_px": list(img.size)}
        if spec["kind"] == "scene":
            img = img.convert("RGB")
            if spec["crop"] == "left-empty":
                img = scene_crop(img)
            ext, mode = "jpg", "RGB"
        else:
            img = img.convert("RGBA")
            if spec["kind"] == "cutout":
                bbox = img.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
                img = img.crop(bbox)
                info["trim_box"] = list(bbox)
            ext, mode = "png", "RGBA"
        trimmed = img.size
        if spec["kind"] != "scene":
            img = fit(img, target_px(spec["mm"]))
        if spec.get("curve"):
            anchors[name] = {"curve": twine_curve(img), "aspect": round(img.width / img.height, 4)}
        info["output_px"] = list(img.size)
        variants = [("", img)] + ([(".mirrored", ImageOps.mirror(img))] if spec.get("mirror") else [])
        for suffix, im in variants:
            path = OUT / f"{name}{suffix}.{ext}"
            if ext == "jpg":
                im.save(path, "JPEG", quality=90, subsampling=0, optimize=True)
            else:
                im.save(path, "PNG", optimize=True)
            if "grip" in spec:
                fx, fy = spec["grip"][0] / trimmed[0], spec["grip"][1] / trimmed[1]
                anchors[f"{name}{suffix}"] = {"grip": [round(1 - fx if suffix else fx, 4), round(fy, 4)], "aspect": round(im.width / im.height, 4)}
        info["outputs"] = [f"assets/art/{name}{s}.{ext}" for s, _ in variants]
        report.append(info)
    if "rb2-garland-top" in done:
        report.append(garland_bottom())
    (OUT / "anchors.json").write_text(json.dumps(anchors, indent=1) + "\n", encoding="utf-8", newline="\n")
    (OUT / "build-report.json").write_text(json.dumps(report, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"processed {sum(1 for r in report if isinstance(r, dict))} assets into {OUT.relative_to(ROOT)}")
    for r in report:
        if isinstance(r, str):
            print(" ", r)
    return 0


if __name__ == "__main__":
    sys.exit(main())
