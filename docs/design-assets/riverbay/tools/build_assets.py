"""Build Riverbay design assets: transparent cut-outs, mark SVGs, tokens and manifest.

Usage (from the child repo root, Pillow required):
    python -I docs/design-assets/riverbay/tools/build_assets.py docs/design-assets/riverbay/source docs/design-assets/riverbay

The first argument holds the generated originals, named as in SOURCES below
(raw Figma downloads matched by SHA-1 image hash are also accepted). Replace an
original with the same file name and rerun to regenerate its cut-outs.
Generated folders (cutouts/, mark/, tokens/) are rebuilt; source/ is never deleted.
"""
import hashlib, json, math, re, shutil, sys
from pathlib import Path
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

RAW = Path(sys.argv[1])
OUT = Path(sys.argv[2])  # .../riverbay
for d in ("cutouts", "mark", "tokens", "rings"):
    if (OUT / d).exists():
        shutil.rmtree(OUT / d)
for d in ("source", "cutouts/characters", "cutouts/badges", "cutouts/stamp-faces", "cutouts/props", "cutouts/botanicals", "cutouts/decor", "mark", "tokens", "rings"):
    (OUT / d).mkdir(parents=True, exist_ok=True)

SOURCES = {
    "f5509dc1a25108f59aa2fea0fda84c69f6e17465": "mascot-beaver",
    "89b3e42a37ce7abd492936361f443bdac6754a52": "supporting-animals-sheet",
    "397841668320ce3f7c0708f882724926a2976e61": "botanicals-sheet",
    "ba11e23df64d587b3be1ddca490e28687e66cbb1": "corner-cluster",
    "e09579d5b946250967976ada5f1187a61b38f162": "banner-riverbank",
    "b3cfd2033a0469c40428c69c09004a1dfb62251a": "mark-option-a-beaver-badge",
    "9980d41712b361ae5e899aa220ad53f55088febb": "bottom-border",
}
files = {}
for name in [*SOURCES.values(), "supporting-bear-honeycomb", "supporting-bear-beehive", "supporting-rabbit-carrot", "badge-bear", "badge-squirrel", "badge-rabbit", "prop-daisy", "prop-beehive", "prop-carrot", "prop-acorn"]:
    if (RAW / f"{name}.png").exists():
        files[name] = RAW / f"{name}.png"
for f in RAW.glob("raw_*.png"):
    name = SOURCES.get(hashlib.sha1(f.read_bytes()).hexdigest())
    if name and name not in files:
        files[name] = f
for name, f in files.items():
    dst = OUT / "source" / f"{name}.png"
    if f.resolve() != dst.resolve():
        shutil.copyfile(f, dst)
    files[name] = dst


def transparent(img, thresh=22):
    """Remove the white background connected to the image edges; keep enclosed whites (daisy petals)."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    sentinel = (255, 0, 255)
    seeds = [(x, y) for x in range(0, w, 16) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 16) for x in (0, w - 1)]
    for s in seeds:
        if rgb.getpixel(s) != sentinel and min(rgb.getpixel(s)) > 230:
            ImageDraw.floodfill(rgb, s, sentinel, thresh=thresh)
    rgba = img.convert("RGBA")
    px, mp = rgba.load(), rgb.load()
    for y in range(h):
        for x in range(w):
            if mp[x, y] == sentinel:
                px[x, y] = (255, 255, 255, 0)
    return rgba


def trim(img, pad=16):
    box = img.getbbox()
    l, t, r, b = box
    return img.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, img.width), min(b + pad, img.height)))


def split_columns(img, names, min_gap=24):
    alpha = img.getchannel("A")
    w, h = img.size
    occ = [any(alpha.getpixel((x, y)) > 40 for y in range(0, h, 3)) for x in range(w)]
    runs, start, gap = [], None, 0
    for x, o in enumerate(occ + [False] * min_gap):
        if o:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                runs.append((start, x - gap + 1))
                start, gap = None, 0
    runs = [r for r in runs if r[1] - r[0] > 40]
    if len(runs) != len(names):
        raise SystemExit(f"expected {len(names)} items, found {len(runs)}: {runs}")
    out = []
    for (a, b), n in zip(runs, names):
        out.append((n, trim(img.crop((a, 0, b, h)))))
    return out


made = []
def save(img, rel):
    p = OUT / rel
    img.save(p.with_suffix(".png"), optimize=True)
    img.save(p.with_suffix(".webp"), quality=90, method=6)
    made.append(rel)


def stamp_face(img):
    """Separate the original closed brown silhouette from its yellow badge.

    Flood only the exterior of the outline: enclosed fur/whites stay unchanged.
    This is a reproducible cut-out, not a redraw or a global yellow colour key.
    Inspect the result if replacing a source: it depends on a closed outline.
    """
    rgba = img.convert("RGBA")
    barrier = Image.new("L", rgba.size)
    barrier.putdata([255 if a > 100 and r < 190 and g < 150 and b < 130 and r > g * 1.1 else 0
                     for r, g, b, a in rgba.getdata()])
    ImageDraw.floodfill(barrier, (0, 0), 128)
    rgba.putalpha(barrier.point(lambda p: 0 if p == 128 else 255))
    return trim(rgba, pad=4)

save(trim(transparent(Image.open(files["mascot-beaver"]))), "cutouts/characters/beaver")
for n, im in split_columns(transparent(Image.open(files["supporting-animals-sheet"])), ["squirrel", "bear", "deer"]):
    if n == "bear" and "supporting-bear-beehive" in files:
        # Generated individual sources already have alpha; do not flood-fill them.
        im = trim(Image.open(files["supporting-bear-beehive"]).convert("RGBA"))
    save(im, f"cutouts/characters/{n}")
if "supporting-rabbit-carrot" in files:
    save(trim(Image.open(files["supporting-rabbit-carrot"]).convert("RGBA")), "cutouts/characters/rabbit")
save(trim(transparent(Image.open(files["mark-option-a-beaver-badge"]))), "cutouts/badges/beaver")
for animal in ("bear", "squirrel", "rabbit"):
    if f"badge-{animal}" in files:
        save(trim(Image.open(files[f"badge-{animal}"]).convert("RGBA")), f"cutouts/badges/{animal}")
for animal in ("beaver", "bear", "squirrel", "rabbit"):
    source = "mark-option-a-beaver-badge" if animal == "beaver" else f"badge-{animal}"
    save(stamp_face(Image.open(files[source])), f"cutouts/stamp-faces/{animal}")
for prop in ("daisy", "beehive", "carrot", "acorn"):
    if f"prop-{prop}" in files:
        save(trim(Image.open(files[f"prop-{prop}"]).convert("RGBA")), f"cutouts/props/{prop}")
for n, im in split_columns(transparent(Image.open(files["botanicals-sheet"])), ["willow-leaves", "reeds", "daisy", "wildflowers", "clover", "leafy-sprig"]):
    save(im, f"cutouts/botanicals/{n}")
save(trim(transparent(Image.open(files["corner-cluster"])), pad=0), "cutouts/decor/corner-cluster")
save(trim(transparent(Image.open(files["bottom-border"])), pad=0), "cutouts/decor/bottom-border")
Image.open(files["banner-riverbank"]).save(OUT / "source" / "banner-riverbank.webp", quality=90, method=6)


def mark(c, hatch=True):
    h = (f'<g stroke="{c["line"]}" stroke-width="2.6" stroke-linecap="round"><line x1="25" y1="21" x2="39" y2="21"/>'
         '<line x1="23" y1="28" x2="41" y2="28"/><line x1="25" y1="35" x2="39" y2="35"/><line x1="32" y1="13" x2="32" y2="41"/></g>') if hatch else ""
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Riverbay">'
            f'<path d="M32 3.5C47.5 2.6 60.6 14.8 60.4 31.2 60.9 47.3 47.8 60.7 31.6 60.4 15.7 61.2 3.2 47.9 3.6 32 3 16.6 16.4 4.4 32 3.5Z" fill="{c["blob"]}"/>'
            f'<g transform="rotate(28 32 27)"><path d="M32 10.5C39.5 10.2 44.2 18 43.6 27.4 43.2 37 38.2 43.8 31.6 43.6 24.6 43.9 20.2 36.4 20.6 27 20.6 17.6 25.2 10.8 32 10.5Z" '
            f'fill="{c["tail"]}" stroke="{c["line"]}" stroke-width="3.2" stroke-linejoin="round"/>{h}</g>'
            f'<path d="M13 50.5c4-3.6 7.4-3.4 10.6 0s7 3.4 10.4 0 7.2-3.6 10.6 0 6 2.4 7.4.6" fill="none" stroke="{c["ripple"]}" '
            f'stroke-width="{3.6 if hatch else 5}" stroke-linecap="round"/></svg>\n')

full = {"blob": "#F8EDBC", "tail": "#D9A273", "line": "#5A3F2C", "ripple": "#6FA3C4"}
rev = dict(full, blob="#FBF7EE")
mono = {"blob": "#2B3631", "tail": "#FBF7EE", "line": "#2B3631", "ripple": "#FBF7EE"}
for name, cfg, hatch in [("riverbay-mark", full, True), ("riverbay-mark-small", full, False), ("riverbay-mark-on-dark", rev, True),
                         ("riverbay-mark-mono", mono, True), ("riverbay-mark-mono-small", mono, False)]:
    (OUT / "mark" / f"{name}.svg").write_text(mark(cfg, hatch), encoding="utf-8")


def wordmark(ink="#2B3631"):
    """Nunito ExtraBold outlines, using a daisy instead of the i's dot.

    Keep the font and all flower geometry here so every exported lockup agrees.
    Outlines avoid a browser font dependency; the font's OFL is kept beside it.
    """
    font = instantiateVariableFont(TTFont(OUT / "source/fonts/Nunito.ttf"), {"wght": 800})
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale, x, paths, flower_x = 0.064, 0, [], 0
    for letter in "Riverbay":
        glyph_name = cmap[ord("ı" if letter == "i" else letter)]
        pen = SVGPathPen(glyphs)
        glyphs[glyph_name].draw(pen)
        paths.append(f'<path d="{pen.getCommands()}" transform="translate({x * scale:.3f} 65) scale({scale} {-scale})"/>')
        advance = font["hmtx"][cmap[ord(letter)]][0]
        if letter == "i":
            flower_x = (x + advance / 2) * scale
        x += advance
    width = x * scale + 4
    petals = "".join(f'<ellipse cx="{flower_x:.3f}" cy="9" rx="3.4" ry="4.5" transform="rotate({a} {flower_x:.3f} 15)"/>' for a in (0, 72, 144, 216, 288))
    flower = (f'<g fill="#FBF7EE" stroke="#5B6862" stroke-width="1.1">{petals}</g>'
              f'<circle cx="{flower_x:.3f}" cy="15" r="2.7" fill="#F8EDBC" stroke="#5B6862" stroke-width="1"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.3f}" height="88" viewBox="0 0 {width:.3f} 88" role="img" aria-label="Riverbay">'
            f'<g fill="{ink}">{"".join(paths)}</g>{flower}</svg>\n')


for suffix, ink in [("", "#2B3631"), ("-on-dark", "#FBF7EE")]:
    word = wordmark(ink)
    (OUT / "mark" / f"riverbay-wordmark{suffix}.svg").write_text(word, encoding="utf-8")
    # Reuse the exact mark and wordmark artwork, rather than drawing a second identity.
    symbol = mark(rev if suffix else full).split('aria-label="Riverbay">', 1)[1].rsplit('</svg>', 1)[0]
    body = word.split('aria-label="Riverbay">', 1)[1].rsplit('</svg>', 1)[0]
    word_width = float(re.search(r'width="([\d.]+)"', word).group(1))
    lockup = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{word_width + 86:.3f}" height="88" viewBox="0 0 {word_width + 86:.3f} 88" role="img" aria-label="Riverbay">'
              f'<g transform="translate(0 8)">{symbol}</g><g transform="translate(86 0)">{body}</g></svg>\n')
    (OUT / "mark" / f"riverbay-logo{suffix}.svg").write_text(lockup, encoding="utf-8")

TOKENS = {
    "neutral/paper": "#FBF7EE", "neutral/surface": "#FFFFFF", "neutral/line": "#E4E2D8", "neutral/field-border": "#8F978F",
    "text/ink": "#2B3631", "text/muted": "#5B6862",
    "action/primary": "#2F5C4D", "action/primary-tint": "#E3F1E8", "action/on-primary": "#FFFFFF",
    "decor/mint": "#D5EDDF", "decor/peach": "#F6D5C1", "decor/powder-blue": "#DCECF2", "decor/butter": "#F8EDBC", "decor/lavender": "#E9E0F3",
    "ring/fill": "#8467C4", "ring/track": "#ECE7F4",
    "status/success": "#2E6B4E", "status/success-bg": "#E3F1E8", "status/attention": "#7A5300", "status/attention-bg": "#FBF0C9",
    "status/danger": "#A1392C", "status/danger-bg": "#FBE4DE", "status/info": "#2D5C78", "status/info-bg": "#E1EEF5",
}
(OUT / "tokens" / "riverbay-tokens.json").write_text(json.dumps({"color": TOKENS, "radius": {"control": 10, "card": 18, "pill": 999},
    "font": {"display": "Nunito", "ui": "DM Sans", "zh": "Noto Sans SC"}}, indent=2) + "\n", encoding="utf-8")
css = ["/* Riverbay proposed tokens (not yet wired into src/app/globals.css). Source: Figma variables 'Riverbay tokens'. */", ":root {"]
css += [f"  --rb-{k.replace('/', '-')}: {v};" for k, v in TOKENS.items()]
css += ["  --rb-radius-control: 10px;", "  --rb-radius-card: 18px;", '  --rb-font-display: "Nunito", "Noto Sans SC", sans-serif;',
        '  --rb-font-ui: "DM Sans", "Noto Sans SC", sans-serif;', "}"]
(OUT / "tokens" / "riverbay-tokens.css").write_text("\n".join(css) + "\n", encoding="utf-8")

def ring_asset(level):
    """Three discrete sectors with lightly rounded corners; selected reference style."""
    def point(radius, angle):
        angle = math.radians(angle)
        return f"{32 + radius * math.cos(angle):.3f} {32 + radius * math.sin(angle):.3f}"

    labels = ["Not yet assessed", "Beginning", "Developing", "Consistently shown"]
    if level == 0:
        # Explicit arc dashes also render correctly in PDF/SVG engines that ignore dasharray.
        body = "".join(
            f'<path d="M {point(24, a - 5)} A 24 24 0 0 1 {point(24, a + 5)}" '
            f'fill="none" stroke="{TOKENS["ring/fill"]}" stroke-width="2.4" stroke-linecap="round"/>'
            for a in range(-90, 270, 30)
        )
    else:
        body = ""
        # Fill upper-left, then upper-right, then bottom. Each small gap remains visible at level 3.
        for index, (a, b) in enumerate([(152, 268), (272, 388), (32, 148)]):
            path = (f'M {point(28, a + 3)} A 28 28 0 0 1 {point(28, b - 3)} '
                    f'Q {point(28, b)} {point(26.5, b)} L {point(19.5, b)} '
                    f'Q {point(18, b)} {point(18, b - 4.5)} A 18 18 0 0 0 {point(18, a + 4.5)} '
                    f'Q {point(18, a)} {point(19.5, a)} L {point(26.5, a)} '
                    f'Q {point(28, a)} {point(28, a + 3)} Z')
            fill = TOKENS["ring/fill"] if index < level else TOKENS["ring/track"]
            body += f'<path d="{path}" fill="{fill}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="{labels[level]}">'
            f'<title>{labels[level]}</title>{body}</svg>\n')


for level, name in enumerate(["unassessed", "beginning", "developing", "consistently-shown"]):
    (OUT / "rings" / f"ring-{name}.svg").write_text(ring_asset(level), encoding="utf-8")

manifest = []
for p in sorted(OUT.rglob("*")):
    if p.is_file():
        im = None
        if p.suffix in (".png", ".webp"):
            with Image.open(p) as i:
                im = f"{i.width}x{i.height}"
        manifest.append((p.relative_to(OUT).as_posix(), im, hashlib.sha256(p.read_bytes()).hexdigest()[:16]))
(OUT / "manifest.json").write_text(json.dumps([{"path": a, "size": b, "sha256_16": c} for a, b, c in manifest], indent=2) + "\n", encoding="utf-8")
print("\n".join(f"{a}  {b or ''}" for a, b, c in manifest))
