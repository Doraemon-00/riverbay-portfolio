"""Layout matrix: one fictional report per photo count (1 to 4 photos in every area; the template allows 4).

    python -I tools/build_matrix.py          # writes data/tests/matrix/photos-<n>.json

Each area gets a different mix of photo shapes (landscape, portrait, square, wide), so
the matrix covers 4 areas x 6 counts x 2 orientations = 48 arrangements. Every second
photo has a caption. All text and captions are fictional fixture text about a fictional
child; nothing comes from a Riverbay record. Render and review with:

    node tools/render.mjs matrix-photos-1 matrix-photos-2 ...   (or just node tools/render.mjs)
    python -I tools/build_matrix_review.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/tests/matrix"
ART = "../../../assets/art"

# Mixed shapes (aspect): reading corner 1.36, counting stones 0.67, sharing snack 1.0,
# story circle 1.57, garden planting 1.46, cover garden 2.36 (clamped to 16:9, cropped).
SHAPES = [
    "rb2-scene-reading-corner.jpg",
    "rb2-scene-counting-stones.jpg",
    "rb2-scene-sharing-snack.jpg",
    "rb2-scene-story-circle.jpg",
    "rb2-scene-garden-planting.mirrored.jpg",
    "rb2-scene-cover-garden.jpg",
]
OFFSET = {"english": 0, "chinese": 2, "mathematics": 4, "social_emotional": 1}

TEXT = {
    "english": "Mira enjoyed sharing books with friends this semester and often chose stories about animals by the river. In August, Mira began joining in with repeated lines and pointed to the pictures to explain what might happen next. During a small-group activity in October, Mira retold a familiar story in order, with one question from the teacher to recall the middle. Mira is starting to write the first sound of familiar words and asks for help with longer ones.",
    "chinese": "本学期Mira在阅读角经常选择关于小动物的图画书，能一边翻页一边说出动物的名称。在小组分享时，Mira尝试用两三个短句介绍自己的画，并在老师的提示下补充颜色和动作。十月份，Mira能跟着儿歌的节奏一起拍手，并说出“早上好”“谢谢”等礼貌用语。遇到不会说的词语时，会先用手势表示，再请老师帮忙。",
    "mathematics": "Mira counted objects with one-to-one pointing for groups up to ten and liked to line items up first to keep track. During block play, Mira sorted shapes by colour and size and used words such as bigger and smaller when comparing towers. In October, Mira copied a simple two-colour pattern and, with a reminder, extended it by two more pieces.",
    "social_emotional": "Mira joined friends in building and pretend play and was beginning to take turns with shared toys. When a friend was upset, Mira offered a turn with the watering can after a gentle prompt from the teacher. During group time, Mira waited for a turn to speak with a reminder and was proud to help tidy the reading corner.",
}
CAPTIONS = {
    "en": ["Looking closely at the pictures before turning the page.", "Choosing a book to share with a friend.", "Counting together during group time."],
    "zh-Hans": ["在阅读角翻看小动物的图画书。", "和同伴一起分享自己的画。", "跟着儿歌的节奏拍手。"],
}
LANG = {"english": "en", "chinese": "zh-Hans", "mathematics": "en", "social_emotional": "en"}


def photos(domain: str, n: int) -> list[dict]:
    out = []
    for i in range(n):
        src = SHAPES[(OFFSET[domain] + i) % len(SHAPES)]
        caps = CAPTIONS[LANG[domain]]
        out.append({
            "src": f"{ART}/{src}",
            "kind": "fictional_illustration",
            "alt": "Illustration" if LANG[domain] == "en" else "插图",
            "caption": caps[(i // 2) % len(caps)] if i % 2 == 0 else None,
        })
    return out


def report(n: int) -> dict:
    scale = "sample-domain-ring-v1"
    prev = {"semester": 1, "rating": 1, "rating_scale_version": scale}
    domains = {}
    for i, d in enumerate(TEXT):
        domains[d] = {"rating": 1 + (i + n) % 3, "rating_scale_version": scale, "previous": prev, f"{d}_feedback": TEXT[d], f"{d}_photos": photos(d, n)}
    return {
        "schema": "riverbay.portfolio-report.v1",
        "fixture": {"kind": "fictional", "notes": [f"Layout matrix: {n} photo(s) in every area, mixed shapes, every second photo captioned. Fictional child and text."]},
        "child": {"display_name": "Mira Tan (matrix test)", "student_code": f"FX-MATRIX-{n}", "class_name": "Test class"},
        "period": {"year": 2026, "semester": 2},
        "rating_scale_version": scale,
        "domains": domains,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for n in range(1, 5):
        (OUT / f"photos-{n}.json").write_text(json.dumps(report(n), ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    for stale in OUT.glob("photos-[56].json"):
        stale.unlink()
    print("wrote data/tests/matrix/photos-1..4.json")


if __name__ == "__main__":
    main()
