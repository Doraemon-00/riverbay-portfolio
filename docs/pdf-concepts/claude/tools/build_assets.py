"""Rebuild every local asset this concept uses, from canonical Riverbay sources.

Run from the concept folder (docs/pdf-concepts/claude):

    python -I tools/build_assets.py

Inputs are read-only: ../../design-assets/riverbay/ (brand art). Fonts are built
separately by tools/build_fonts.py; run that first so the manifest includes them. Outputs:

    assets/brand/...                unchanged copies of canonical brand files (rings, logo, tokens)
    assets/illustrations/*.jpg      v1 fictional crops/composites, kept for the stress-test fixtures
                                    (extreme aspect ratios); the template's own art is built by
                                    tools/build_art_assets.py into assets/art/
    assets/manifest.generated.json  path, pixel size and sha256 for every asset

Deterministic: fixed crop boxes, fixed composite coordinates, fixed JPEG settings.
No network access and no AI calls.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
RIVERBAY = ROOT.parents[1] / "design-assets" / "riverbay"
ASSETS = ROOT / "assets"

# Canonical brand files copied byte-for-byte (source relative to design-assets/riverbay).
BRAND_COPIES = {
    "brand/rings/ring-unassessed.svg": "rings/ring-unassessed.svg",
    "brand/rings/ring-beginning.svg": "rings/ring-beginning.svg",
    "brand/rings/ring-developing.svg": "rings/ring-developing.svg",
    "brand/rings/ring-consistently-shown.svg": "rings/ring-consistently-shown.svg",
    "brand/mark/riverbay-logo.svg": "mark/riverbay-logo.svg",
    "brand/tokens/riverbay-tokens.css": "tokens/riverbay-tokens.css",
}

PAPER = (251, 247, 238)  # neutral/paper #FBF7EE

# Crops of existing generated scenes: (output, source, box=(left, top, right, bottom)).
CROPS = [
    ("illustrations/scene-scrapbook-beaver.jpg", "source/signin-scrapbook-concept-v1.png", (40, 200, 1060, 965)),
    ("illustrations/scene-squirrel-leaf.jpg", "source/signin-scrapbook-concept-v1.png", (1105, 470, 1525, 1000)),
    ("illustrations/scene-scrapbook-pages.jpg", "source/signin-scrapbook-concept-v1.png", (300, 545, 1250, 960)),
    ("illustrations/scene-river-stones.jpg", "source/signin-scrapbook-concept-v1.png", (690, 215, 1536, 555)),
    ("illustrations/scene-riverbank-friends.jpg", "source/banner-riverbank.png", (900, 120, 1584, 672)),
    ("illustrations/scene-willow-tall.jpg", "source/banner-riverbank.png", (1240, 0, 1584, 672)),
]

# Simple composites of existing cut-outs on a pastel paper ground. Coordinates are in
# output pixels; each item is (cutout, target height, centre x, baseline y).
COMPOSITES = [
    {
        "out": "illustrations/scene-rabbit-garden.jpg",
        "size": (1200, 900),
        "ground": (214, 237, 223),  # decor/mint
        "items": [
            ("cutouts/botanicals/wildflowers.png", 470, 250, 800),
            ("cutouts/characters/rabbit.png", 640, 640, 820),
            ("cutouts/props/daisy.png", 300, 960, 805),
            ("cutouts/botanicals/clover.png", 190, 1080, 830),
        ],
    },
    {
        "out": "illustrations/scene-acorn-line.jpg",
        "size": (1200, 1200),
        "ground": (248, 237, 188),  # decor/butter
        "items": [
            ("cutouts/characters/squirrel.png", 760, 470, 980),
            ("cutouts/props/acorn.png", 150, 830, 1060),
            ("cutouts/props/acorn.png", 150, 960, 1060),
            ("cutouts/props/acorn.png", 150, 1090, 1060),
            ("cutouts/botanicals/leafy-sprig.png", 420, 1060, 860),
        ],
    },
    {
        "out": "illustrations/scene-bear-hive.jpg",
        "size": (900, 1200),
        "ground": (220, 236, 242),  # decor/powder-blue
        "items": [
            ("cutouts/botanicals/reeds.png", 520, 140, 1020),
            ("cutouts/characters/bear.png", 800, 470, 1060),
            ("cutouts/botanicals/daisy.png", 160, 780, 1080),
        ],
    },
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_jpeg(img: Image.Image, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out, "JPEG", quality=88, optimize=True, progressive=False, subsampling=0)


def composite(spec: dict) -> Image.Image:
    w, h = spec["size"]
    img = Image.new("RGB", (w, h), PAPER)
    # Soft ground blob: an ellipse, lightly blurred, in a decor tint.
    ground = Image.new("L", (w, h), 0)
    ImageDraw.Draw(ground).ellipse((-0.15 * w, 0.62 * h, 1.15 * w, 1.35 * h), fill=255)
    ground = ground.filter(ImageFilter.GaussianBlur(6))
    img.paste(Image.new("RGB", (w, h), spec["ground"]), (0, 0), ground)
    for src, target_h, cx, base in spec["items"]:
        art = Image.open(RIVERBAY / src).convert("RGBA")
        scale = target_h / art.height
        art = art.resize((round(art.width * scale), target_h), Image.LANCZOS)
        img.paste(art, (round(cx - art.width / 2), base - target_h), art)
    return img


def main() -> int:
    if not RIVERBAY.is_dir():
        print(f"Riverbay design assets not found at {RIVERBAY}", file=sys.stderr)
        return 1
    for rel, src in BRAND_COPIES.items():
        out = ASSETS / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(RIVERBAY / src, out)
    for rel, src, box in CROPS:
        save_jpeg(Image.open(RIVERBAY / src).convert("RGB").crop(box), ASSETS / rel)
    for spec in COMPOSITES:
        save_jpeg(composite(spec), ASSETS / spec["out"])

    manifest = []
    for path in sorted(ASSETS.rglob("*")):
        if path.is_dir() or path.name.endswith(".generated.json"):
            continue
        entry = {"path": path.relative_to(ROOT).as_posix(), "bytes": path.stat().st_size, "sha256": sha(path)}
        if path.suffix.lower() in {".png", ".jpg", ".webp"}:
            with Image.open(path) as im:
                entry["pixels"] = f"{im.width}x{im.height}"
        manifest.append(entry)
    (ASSETS / "manifest.generated.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(manifest)} asset files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
