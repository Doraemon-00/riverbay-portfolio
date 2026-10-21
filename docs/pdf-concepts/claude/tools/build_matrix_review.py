"""Combine the layout-matrix renders into one review PDF and one overview image per orientation.

    python -I tools/build_matrix_review.py

Reads out/matrix-photos-<n>.<orientation>.pdf and .layout.json (n = 1..4) and writes:
  out/layout-matrix.<orientation>.pdf   every page, labelled "<n> photos · <area> · <layout>"
  out/previews/layout-matrix.<orientation>.png   one row per photo count, pages left to right
Labels sit in a small white tag at the top-left corner; they are review notes, not template output.
"""
from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"
AREAS = {"english": "English", "chinese": "中文 Chinese", "mathematics": "Mathematics", "social_emotional": "Social-emotional"}


def labels(layout: dict) -> list[str]:
    """One label per page, from the per-domain page counts in the layout report."""
    out = []
    for d in layout["domains"]:
        for k in range(d["pages"]):
            part = f" (page {k + 1} of {d['pages']})" if d["pages"] > 1 else ""
            out.append(f"{AREAS[d['domain']]}: {d['variant']}{part}")
    return out


def main() -> int:
    font = fitz.Font("china-s")  # built-in CJK-capable font, only for the review labels
    for o in ("landscape", "portrait"):
        review = fitz.open()
        rows = []
        for n in range(1, 5):
            stem = f"matrix-photos-{n}.{o}"
            pdf_path, layout_path = OUT / f"{stem}.pdf", OUT / f"{stem}.layout.json"
            if not pdf_path.exists():
                print(f"missing {stem}.pdf (render the matrix cases first)")
                return 1
            layout = json.loads(layout_path.read_text(encoding="utf-8"))
            src = fitz.open(pdf_path)
            names = labels(layout)
            thumbs = []
            for i, page in enumerate(src):
                pix = page.get_pixmap(dpi=36)
                thumbs.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
                review.insert_pdf(src, from_page=i, to_page=i)
                p = review[-1]
                text = f"{n} photo{'s' if n > 1 else ''} · {names[i] if i < len(names) else ''}"
                w = font.text_length(text, 9) + 10
                p.draw_rect(fitz.Rect(4, 4, 4 + w, 19), color=(0.6, 0.6, 0.6), fill=(1, 1, 1), width=0.5)
                tw = fitz.TextWriter(p.rect)
                tw.append((9, 15), text, font=font, fontsize=9)
                tw.write_text(p)
            rows.append((n, thumbs))
        review.save(OUT / f"layout-matrix.{o}.pdf", garbage=3, deflate=True)
        th, tw_ = rows[0][1][0].height, rows[0][1][0].width
        cols = max(len(t) for _, t in rows)
        sheet = Image.new("RGB", (60 + cols * (tw_ + 10), len(rows) * (th + 10) + 10), (225, 221, 212))
        d = ImageDraw.Draw(sheet)
        for r, (n, thumbs) in enumerate(rows):
            y = 10 + r * (th + 10)
            d.text((12, y + th // 2 - 6), f"{n} photo{'s' if n > 1 else ''}", fill=(40, 50, 45))
            for c, t in enumerate(thumbs):
                sheet.paste(t, (60 + c * (tw_ + 10), y))
        (OUT / "previews").mkdir(exist_ok=True)
        sheet.save(OUT / "previews" / f"layout-matrix.{o}.png", optimize=True)
        print(f"out/layout-matrix.{o}.pdf: {review.page_count} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
