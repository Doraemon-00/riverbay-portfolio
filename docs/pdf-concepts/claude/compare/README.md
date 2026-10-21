# Size comparison: before and after shrinking

PDFs exported **by the app** (Portfolio PDF panel, "Preview") from Avery Lim's local records, 21 Oct 2026. They are the like-for-like baseline for the shrinking step.

| File | Pages | Size | Render time (app route) |
|---|---|---|---|
| `avery-app-landscape.unshrunk.pdf` | 6 | 6.97 MB | 3.5 s |
| `avery-app-portrait.unshrunk.pdf` | 6 | 7.36 MB | 3.7 s |

Shrunk versions will be added here as `*.shrunk.pdf`, with the same data and the same template.

**Data at the time of export** (seeded by `tools/seed_avery_app.mjs`, fictional demo data):

- **Narratives:** Semester 2 narratives, unchanged from the saved records (checksums match `benchmarks/live-classroom/historical-reference.json`).
- **Indicators:** chosen to follow the narratives, never going backwards from Semester 1 to Semester 2:

| Area | Semester 1 | Semester 2 |
|---|---|---|
| English | Beginning | Developing |
| 中文 | Beginning | Developing |
| Mathematics | Developing | Consistently shown |
| Social-emotional | Beginning | Developing |

- **Photos:** the 6 neutral placeholders were replaced with 5 fictional sample illustrations (English 2, 中文 1, Mathematics 1, Social-emotional 1). They are stored as `sample-*.jpg` and printed with a "Sample illustration" chip. No captions, because no teacher captions exist.
- **No cover photo** (the app has no cover-photo field yet), so the illustrated cover is used.
- **Exports:** these are preview exports. Since the export-rule change (21 Oct), "Download for parents" needs only an indicator and a story in every area plus one confirmation in the Create PDF dialog, so Avery's parent copy is now available too (same layout and size).
