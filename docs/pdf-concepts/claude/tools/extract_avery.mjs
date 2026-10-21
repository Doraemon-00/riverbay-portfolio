#!/usr/bin/env node
// Builds data/avery-lim-2026-s2.json from an existing read-only capture of Avery's
// saved Semester 2 records (benchmarks/live-classroom/historical-reference.json,
// captured 2026-10-20 by an earlier authorised local read). No database access.
//
// Only parent-facing fields are copied: rating and narrative. Observations, IDs and
// revisions stay behind. Narratives are copied byte-for-byte.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURE = resolve(ROOT, "../../../benchmarks/live-classroom/historical-reference.json");
const capture = JSON.parse(readFileSync(CAPTURE, "utf8"));
const row = (d) => {
  const r = capture.rows.find((x) => x.domain === d);
  if (!r) throw new Error(`capture has no ${d} row`);
  return r;
};
const SCALE = "sample-domain-ring-v1"; // src/lib/portfolio.ts scaleVersion
// Semester 1: scripts/setup-local.mjs seeds rating 1 for every domain of the first three
// children (Avery is first). Not re-read from the live database.
const previous = { semester: 1, rating: 1, rating_scale_version: SCALE };

// Teacher-selected photos are not available to this concept (private storage, and the two
// saved items are neutral placeholders). Slots use fictional illustrations, labelled on the
// page as samples, with no captions: no teacher caption exists and none is invented.
const illus = (file, alt) => ({ src: `../assets/art/${file}`, caption: null, alt, kind: "fictional_illustration" });

const en = row("english");
const zh = row("chinese");
const report = {
  schema: "riverbay.portfolio-report.v1",
  fixture: {
    kind: "saved-sample",
    source: "benchmarks/live-classroom/historical-reference.json (read-only capture of persisted fictional records)",
    captured_at: capture.capturedAt,
    revisions: { english: en.revision, chinese: zh.revision },
    notes: [
      "Saved narratives are sample content, not proof of teacher approval (app status: Draft, not Reviewed).",
      "Semester 1 ratings come from the setup-local.mjs seed, not a live read.",
      "Photos are fictional illustrations, not evidence of events in Avery's observations.",
    ],
  },
  child: { display_name: "Avery Lim", student_code: "RB-000020", class_name: "K1 Willow" },
  period: { year: 2026, semester: 2 },
  rating_scale_version: SCALE,
  // Sample cover image: a labelled fictional illustration, not a photo of Avery.
  cover_photo: { src: "../assets/art/rb2-scene-cover-garden.jpg", kind: "fictional_illustration", alt: "Illustration: four animal friends flying a kite by the river", fit: "width" },
  domains: {
    english: {
      rating: en.rating,
      rating_scale_version: SCALE,
      previous,
      english_feedback: en.narrative,
      english_photos: [
        illus("rb2-scene-reading-corner.jpg", "Illustration: a beaver and a rabbit reading a picture book under a willow"),
        illus("rb2-scene-story-circle.jpg", "Illustration: four animal friends looking at a picture book at story time"),
      ],
    },
    chinese: {
      rating: zh.rating,
      rating_scale_version: SCALE,
      previous,
      chinese_feedback: zh.narrative,
      chinese_photos: [
        illus("rb2-scene-garden-planting.jpg", "插图：小动物们在菜园里种菜"),
        illus("rb2-scene-counting-stones.jpg", "插图：小松鼠把石头排成一行，小熊在旁边看"),
        illus("rb2-scene-sharing-snack.jpg", "插图：小动物们在野餐垫上分享点心"),
      ],
    },
  },
};
writeFileSync(join(ROOT, "data/avery-lim-2026-s2.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log("wrote data/avery-lim-2026-s2.json");

// Full report: all four learning areas. Mathematics and Social-emotional have saved
// narratives but no indicator (rating null) in the capture; ratings are never invented,
// so this file renders only with --preview (dashed "Not assessed" ring).
// Only five distinct new-style scenes exist besides the cover, so each appears once,
// allocated by theme: English 2, 中文 1, Mathematics 1, Social-emotional 1.
const ma = row("mathematics");
const se = row("social_emotional");
const full = JSON.parse(JSON.stringify(report));
full.fixture.revisions = { english: en.revision, chinese: zh.revision, mathematics: ma.revision, social_emotional: se.revision };
full.fixture.notes.push(
  "Mathematics and Social-emotional have no saved indicator (rating null): render with --preview; export is blocked until a teacher sets one.",
  "Each illustration appears once in the full report (five distinct scenes besides the cover).",
);
full.domains.chinese.chinese_photos = [illus("rb2-scene-garden-planting.jpg", "插图：小动物们在菜园里种菜")];
full.domains.mathematics = {
  rating: ma.rating,
  rating_scale_version: SCALE,
  previous,
  mathematics_feedback: ma.narrative,
  mathematics_photos: [illus("rb2-scene-counting-stones.jpg", "Illustration: a squirrel arranging river stones from small to large while a bear watches")],
};
full.domains.social_emotional = {
  rating: se.rating,
  rating_scale_version: SCALE,
  previous,
  social_emotional_feedback: se.narrative,
  social_emotional_photos: [illus("rb2-scene-sharing-snack.jpg", "Illustration: animal friends sharing tea and biscuits on a picnic blanket")],
};
writeFileSync(join(ROOT, "data/avery-lim-2026-s2-full.json"), JSON.stringify(full, null, 2) + "\n", "utf8");
console.log("wrote data/avery-lim-2026-s2-full.json");
