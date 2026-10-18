"""Fetch a small, pinned set of public design assets; never fetch child photos."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent / "assets"
ROOT.mkdir(exist_ok=True)

def package(name, version):
    metadata = json.load(urllib.request.urlopen(f"https://registry.npmjs.org/{name}/{version}"))
    payload = urllib.request.urlopen(metadata["dist"]["tarball"]).read()
    integrity = metadata["dist"]["integrity"]
    algorithm, expected = integrity.split("-", 1)
    actual = base64.b64encode(hashlib.new(algorithm, payload).digest()).decode()
    if actual != expected:
        raise RuntimeError(f"Integrity mismatch for {name}")
    return tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz")

fonts = package("@fontsource/dm-sans", "5.3.0")
for weight in (400, 500, 600, 700):
    source = f"package/files/dm-sans-latin-{weight}-normal.woff2"
    (ROOT / f"dm-sans-{weight}.woff2").write_bytes(fonts.extractfile(source).read())
font_license = next(m for m in fonts.getmembers() if m.name.lower().endswith("/license"))
(ROOT / "DM-Sans-LICENSE.txt").write_bytes(fonts.extractfile(font_license).read())

icons = package("@phosphor-icons/core", "2.1.1")
names = ["book-open", "users-three", "check-circle", "magnifying-glass", "arrow-left", "arrow-right", "sparkle", "translate", "image", "plus", "printer", "plant", "shapes", "hand-heart", "text-aa", "file-text", "check", "x", "books", "sun", "palette", "leaf", "arrow-square-out"]
ET.register_namespace("", "http://www.w3.org/2000/svg")
sprite = ET.Element("{http://www.w3.org/2000/svg}svg")
for name in names:
    suffix = f"/duotone/{name}-duotone.svg"
    member = next(m for m in icons.getmembers() if m.name.endswith(suffix))
    svg = ET.fromstring(icons.extractfile(member).read())
    symbol = ET.SubElement(sprite, "symbol", id=name, viewBox=svg.attrib.get("viewBox", "0 0 256 256"))
    for child in svg:
        symbol.append(child)
ET.ElementTree(sprite).write(ROOT / "icons.svg", encoding="utf-8", xml_declaration=True)
icon_license = next(m for m in icons.getmembers() if m.name.lower().endswith("/license"))
(ROOT / "Phosphor-LICENSE.txt").write_bytes(icons.extractfile(icon_license).read())
print("Prepared verified pinned DM Sans fonts and 23 Phosphor icons. No remote runtime assets.")
