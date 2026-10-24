#!/usr/bin/env node
// Seed Avery Lim's LOCAL app records to replicate the design draft (fictional demo data).
//
//   cd worlds/peterhouse-portfolio && node docs/pdf-concepts/claude/tools/seed_avery_app.mjs
//
// Local-only (refuses non-local endpoints). Signs in as the seeded K1 Willow demo teacher
// and uses the app's own paths, so row-level security and revision rules apply:
//   * indicators via save_domain_entry (narratives and notes unchanged; review cleared)
//   * photos: removes Avery's Semester 2 photos, uploads the sample scenes to
//     `<entry id>/sample-<uuid>.jpg` (the export labels "sample-" as a fictional illustration)
// Ratings never go backwards from Semester 1 to 2 and follow the saved narratives
// (see README "Full report (Avery)"). Review status is not seeded.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ART = resolve(dirname(fileURLToPath(import.meta.url)), "../assets/art");
const RATINGS = {
  1: { english: 1, chinese: 1, mathematics: 2, social_emotional: 1 },
  2: { english: 2, chinese: 2, mathematics: 3, social_emotional: 2 },
};
const PHOTOS = {
  english: ["rb2-scene-reading-corner.jpg", "rb2-scene-story-circle.jpg"],
  chinese: ["rb2-scene-garden-planting.jpg"],
  mathematics: ["rb2-scene-counting-stones.jpg"],
  social_emotional: ["rb2-scene-sharing-snack.jpg"],
};
const TEACHER = { email: "teacher@riverbay.com", password: "teach2LEARN" }; // fictional demo account (setup-local.mjs)

const status = JSON.parse(execFileSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) throw new Error("Refusing a non-local database.");
const db = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const check = (r, what) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};
const signedIn = check(await db.auth.signInWithPassword(TEACHER), "sign in");

const child = check(await db.from("children").select("id").eq("display_name", "Avery Lim").single(), "child");
const enrolments = check(await db.from("enrolments").select("id, reporting_periods(year, semester), portfolios(id, domain_entries(id, domain, rating, comments, narrative, revision))").eq("child_id", child.id), "enrolments");
const forSemester = (s) => enrolments.find((e) => e.reporting_periods.year === 2026 && e.reporting_periods.semester === s)?.portfolios?.domain_entries ?? [];

for (const semester of [1, 2]) {
  for (const entry of forSemester(semester)) {
    const want = RATINGS[semester][entry.domain];
    if (entry.rating === want) {
      console.log(`S${semester} ${entry.domain}: already ${want}`);
      continue;
    }
    check(await db.rpc("save_domain_entry", { entry_id: entry.id, expected_revision: entry.revision, new_rating: want, new_comments: entry.comments, new_narrative: entry.narrative }), `rating S${semester} ${entry.domain}`);
    console.log(`S${semester} ${entry.domain}: ${entry.rating ?? "not assessed"} -> ${want}`);
  }
}

for (const entry of forSemester(2)) {
  const old = check(await db.from("photos").select("id, storage_key").eq("entry_id", entry.id), "photos");
  if (old.length) {
    check(await db.from("photos").delete().in("id", old.map((p) => p.id)).select("id"), "remove photo rows");
    check(await db.storage.from("portfolio-photos").remove(old.map((p) => p.storage_key)), "remove photo files");
  }
  let position = 0;
  for (const file of PHOTOS[entry.domain]) {
    const key = `${entry.id}/sample-${randomUUID()}.jpg`;
    check(await db.storage.from("portfolio-photos").upload(key, await readFile(join(ART, file)), { contentType: "image/jpeg", upsert: false }), `upload ${file}`);
    check(await db.from("photos").insert({ entry_id: entry.id, storage_key: key, uploaded_by: signedIn.user.id, position: position++ }), `attach ${file}`);
  }
  console.log(`S2 ${entry.domain}: replaced ${old.length} photo(s) with ${PHOTOS[entry.domain].length} sample illustration(s)`);
}
await db.auth.signOut();
