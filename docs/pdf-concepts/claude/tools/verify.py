"""Verify rendered PDFs and write page previews.

    python -I tools/verify.py            # every out/*.pdf from tools/cases.json

Checks, per PDF (each case in each orientation it renders):
  * page size is A4 in the case's orientation (595.28 x 841.89 pt, either way round, +-0.5)
  * every font is embedded; lists font names (Noto Sans SC, Nunito, DM Sans)
  * extracted text contains every narrative and caption exactly, after removing
    whitespace (PDF text extraction cannot reproduce line breaks), and Chinese
    punctuation from the source is present in the PDF text
  * no forbidden parent-facing content (field names from the teacher workspace)
  * layout report from the renderer is ok

  * the child's name appears once, on the cover, and nowhere else outside the narratives

Writes out/previews/<case>.<orientation>-p<N>.png (single pages, 110 dpi),
out/previews/<case>.<orientation>-all.png (contact strip) and out/VERIFICATION.json.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"
PREVIEWS = OUT / "previews"
CJK_PUNCT = set("，。、；：？！“”‘’（）《》……")
FORBIDDEN = ["observation", "needs_review", "translation_preview", "workflow", "revision", "Draft available"]


def squash(s: str) -> str:
    return re.sub(r"\s+", "", s)


def report_texts(data: dict, domains: list[str]) -> list[tuple[str, str]]:
    out = []
    for d in domains:
        entry = data["domains"][d]
        out.append((f"{d} narrative", entry[f"{d}_feedback"]))
        for i, p in enumerate(entry.get(f"{d}_photos", [])):
            if p.get("caption"):
                out.append((f"{d} caption {i + 1}", p["caption"]))
    return out


def previews(doc: fitz.Document, name: str, first_page: int) -> list[str]:
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    for old in PREVIEWS.glob(f"{name}-*.png"):
        old.unlink()
    images = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=110)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        path = PREVIEWS / f"{name}-p{first_page + i}.png"
        img.save(path, optimize=True)
        images.append((first_page + i, img))
    written = [p.name for p in sorted(PREVIEWS.glob(f"{name}-p*.png"))]
    # A contact strip of all pages for quick review.
    thumbs = [im.resize((im.width // 3, im.height // 3)) for _, im in images]
    strip = Image.new("RGB", (sum(t.width for t in thumbs) + 16 * (len(thumbs) + 1), thumbs[0].height + 32), (205, 201, 190))
    x = 16
    for t in thumbs:
        strip.paste(t, (x, 16))
        x += t.width + 16
    strip.save(PREVIEWS / f"{name}-all.png", optimize=True)
    written.append(f"{name}-all.png")
    return written


def verify_case(case: dict, orientation: str | None) -> dict:
    name = case["name"]
    stem = f"{name}.{orientation}" if orientation else name
    pdf = OUT / f"{stem}.pdf"
    result = {"case": name, "orientation": orientation, "pdf": f"out/{stem}.pdf", "problems": []}
    if case.get("expectInvalid"):
        v = json.loads((OUT / f"{name}.validation.json").read_text(encoding="utf-8"))
        result.update(expected="rejected", rejected=v["rejected"], errors=v["errors"], pdf=None)
        if not v["rejected"]:
            result["problems"].append("invalid data was accepted")
        if list(OUT.glob(f"{name}*.pdf")):
            result["problems"].append("a PDF exists for invalid data")
        return result
    layout = json.loads((OUT / f"{stem}.layout.json").read_text(encoding="utf-8"))
    if not layout.get("ok"):
        result["problems"].append("renderer layout report not ok: " + "; ".join(layout.get("problems", [])) + (layout.get("error") or ""))
        return result
    data = json.loads((ROOT / case["data"]).read_text(encoding="utf-8"))
    doc = fitz.open(pdf)
    result["pages"] = doc.page_count
    result["bytes"] = pdf.stat().st_size
    sizes = {(round(p.rect.width, 2), round(p.rect.height, 2)) for p in doc}
    result["page_size_pt"] = sorted(sizes)
    want = (841.89, 595.28) if orientation == "landscape" else (595.28, 841.89)
    if any(abs(w - want[0]) > 0.5 or abs(h - want[1]) > 0.5 for w, h in sizes):
        result["problems"].append(f"page size not A4 {orientation}: {sizes}")

    fonts = {}
    for page in doc:
        # ext is the embedded font program's format; "n/a" means not embedded.
        for xref, ext, ftype, basefont, *_ in page.get_fonts(full=True):
            fonts[basefont] = {"type": ftype, "ext": ext}
    result["fonts"] = fonts
    not_embedded = [f for f, v in fonts.items() if v["ext"] in ("n/a", "")]
    if not_embedded:
        result["problems"].append(f"fonts not embedded: {not_embedded}")
    families = " ".join(fonts)
    expected = ("Nunito", "DMSans") + (("NotoSansSC",) if "chinese" in case["domains"] else ())
    for fam in expected:
        if fam.lower() not in families.replace(" ", "").replace("-", "").lower():
            result["problems"].append(f"expected font family {fam} not found in PDF")

    text = "".join(page.get_text("text") for page in doc)
    flat = squash(text)
    checks = []
    fragments = {d["domain"]: d["fragments"] for d in layout["domains"]}
    for label, src in report_texts(data, case["domains"]):
        if label.endswith("narrative"):
            # Narratives may be split across pages: rebuild from the placed fragments
            # (must equal the source exactly) and find every fragment in the PDF text.
            frags = fragments[label.split()[0]]
            paras: list[str] = []
            for f in frags:
                if f["cont"]:
                    paras[-1] += f["text"]
                else:
                    paras.append(f["text"])
            rebuilt_ok = "\n\n".join(paras) == src
            found = all(squash(f["text"]) in flat for f in frags)
            ok = rebuilt_ok and found
            checks.append({"text": label, "chars": len(src), "fragments": len(frags), "fragments_rejoin_to_source": rebuilt_ok, "all_fragments_in_pdf": found})
        else:
            ok = squash(src) in flat
            checks.append({"text": label, "chars": len(src), "found_exactly": ok})
        if not ok:
            result["problems"].append(f"{label} not preserved verbatim in PDF text")
    result["text_checks"] = checks
    zh_src = "".join(src for label, src in report_texts(data, case["domains"]) if label.startswith("chinese"))
    punct = sorted({ch for ch in zh_src if ch in CJK_PUNCT})
    missing = [ch for ch in punct if ch not in text]
    result["chinese_punctuation"] = {"in_source": "".join(punct), "missing_in_pdf": "".join(missing)}
    if missing:
        result["problems"].append(f"Chinese punctuation missing in PDF text: {''.join(missing)}")
    # Every CJK character and CJK-context punctuation glyph must come from Noto Sans SC,
    # not a fallback font (catches missing unicode-range subsets).
    wrong = {}
    cjk_glyphs = 0
    for page in doc:
        for block in page.get_text("rawdict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    for ch in span["chars"]:
                        c = ch["c"]
                        if "　" <= c <= "鿿" or "＀" <= c <= "￯" or (c in "“”‘’…" and "NotoSansSC" not in span["font"] and any("一" <= x <= "鿿" for x in "".join(k["c"] for k in span["chars"]))):
                            cjk_glyphs += 1
                            if "NotoSansSC" not in span["font"]:
                                wrong.setdefault(span["font"], set()).add(c)
    result["cjk_glyphs_checked"] = cjk_glyphs
    if wrong:
        result["problems"].append(f"CJK glyphs rendered by fallback fonts: { {k: ''.join(sorted(v)) for k, v in wrong.items()} }")
    leaked = [w for w in FORBIDDEN if w.lower() in text.lower()]
    if leaked:
        result["problems"].append(f"workspace terms in PDF: {leaked}")
    child = data["child"]["display_name"]
    outside = text.count(child) - sum(src.count(child) for _, src in report_texts(data, case["domains"]))
    result["child_name_occurrences_outside_narrative"] = outside
    if outside != (1 if case.get("cover") else 0):
        result["problems"].append(f"child name appears {outside} times outside the narratives (expected only on the cover)")
    result["layout"] = {d["domain"]: {"variant": d["variant"], "pages": d["pages"], "decor": d["decor"], "log": d["log"], "photos": d["photos"]} for d in layout["domains"]}
    result["previews"] = previews(doc, stem, 1 if case.get("cover") else case.get("startPage", 2))
    return result


def main() -> int:
    cases = json.loads((ROOT / "tools/cases.json").read_text(encoding="utf-8"))["cases"]
    names = set(sys.argv[1:])
    results = []
    for c in cases:
        if names and c["name"] not in names:
            continue
        if c.get("expectInvalid"):
            results.append(verify_case(c, None))
        else:
            for o in c.get("orientations", ["landscape", "portrait"]):
                results.append(verify_case(c, o))
    (OUT / "VERIFICATION.json").write_text(json.dumps(results, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    bad = 0
    for r in results:
        status = "ok" if not r["problems"] else "FAIL"
        bad += bool(r["problems"])
        extra = f"{r.get('pages')} pages, {len(r.get('fonts', {}))} fonts" if r.get("pdf") else "rejected"
        print(f"{status:4} {r['case']}{' (' + r['orientation'] + ')' if r.get('orientation') else ''}: {extra}")
        for p in r["problems"]:
            print(f"     - {p}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
