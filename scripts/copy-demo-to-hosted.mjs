import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Copy the local fictional demo (accounts, classes, children, portfolios, photos) into a NEW,
// EMPTY hosted Supabase project for the shared demo. Fictional data only.
//
//   node --env-file=.env.hosted scripts/copy-demo-to-hosted.mjs --confirm <project-ref>
//   node scripts/copy-demo-to-hosted.mjs --dry-run      (reads the local demo only)
//
// .env.hosted (ignored) holds HOSTED_SUPABASE_URL and HOSTED_SUPABASE_SERVICE_ROLE_KEY.
// Apply the migrations to the hosted project first. Every account gets DEMO_PASSWORD
// (default: the shared demo password). Generated student/staff numbers are renumbered in
// the same order. Exported PDFs and generation records are not copied.

const status = JSON.parse(
  execFileSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname))
  throw new Error("The source must be the local demo database.");

const dryRun = process.argv.includes("--dry-run");
const target = dryRun ? "https://dry-run.supabase.co" : process.env.HOSTED_SUPABASE_URL;
const targetKey = dryRun ? "dry-run" : process.env.HOSTED_SUPABASE_SERVICE_ROLE_KEY;
if (!target || !targetKey) throw new Error("Set HOSTED_SUPABASE_URL and HOSTED_SUPABASE_SERVICE_ROLE_KEY in .env.hosted.");
const host = new URL(target).hostname;
if (["127.0.0.1", "localhost"].includes(host)) throw new Error("The target must be the hosted project.");
const ref = host.split(".")[0];
const confirm = process.argv[process.argv.indexOf("--confirm") + 1];
if (!dryRun && (!process.argv.includes("--confirm") || confirm !== ref))
  throw new Error(`Re-run with --confirm ${ref} to copy the demo into that project.`);

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const src = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const dst = createClient(target, targetKey, options);
const check = (result, what) => {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
};

if (!dryRun && check(await dst.from("children").select("id").limit(1), "check target").length)
  throw new Error("The hosted project already has children; this copy only fills an empty project.");

const password = process.env.DEMO_PASSWORD ?? "teach2LEARN";
const generated = ["student_number", "student_code", "staff_number", "staff_code"];
const strip = (rows) => rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => !generated.includes(k))));

// Accounts keep their IDs so every reference below stays valid.
const profiles = check(await src.from("profiles").select("*").order("staff_number"), "read profiles");
const existing = dryRun ? [] : check(await dst.auth.admin.listUsers(), "list hosted users").users;
for (const p of dryRun ? [] : profiles) {
  if (existing.some((u) => u.id === p.id)) continue;
  check(await dst.auth.admin.createUser({ id: p.id, email: p.email, password, email_confirm: true }), `create ${p.email}`);
}

// Parents before children; ordered so generated numbers follow the local order.
const tables = [
  ["profiles", "staff_number"],
  ["classes", "id"],
  ["reporting_periods", "id"],
  ["children", "student_number"],
  ["class_memberships", null],
  ["class_teachers", null],
  ["teacher_assignments", null],
  ["enrolments", "id"],
  ["portfolios", "id"],
  ["domain_entries", "id"],
  ["photos", "position"],
];
for (const [table, order] of tables) {
  let query = src.from(table).select("*");
  if (order) query = query.order(order);
  const rows = strip(check(await query, `read ${table}`));
  if (!rows.length) continue;
  if (dryRun) { console.log(`${table}: ${rows.length} (dry run)`); continue; }
  // Migrations may already hold a row (for example a reporting period); keep what is there.
  check(await dst.from(table).upsert(rows, { ignoreDuplicates: true }), `write ${table}`);
  console.log(`${table}: ${rows.length}`);
}

// Photo files, under the same private keys.
const photos = check(await src.from("photos").select("storage_key"), "read photo keys");
for (const { storage_key } of dryRun ? [] : photos) {
  const file = check(await src.storage.from("portfolio-photos").download(storage_key), `download ${storage_key}`);
  check(
    await dst.storage.from("portfolio-photos").upload(storage_key, file, { contentType: "image/jpeg", upsert: true }),
    `upload ${storage_key}`,
  );
}
console.log(`photo files: ${photos.length}${dryRun ? " (dry run, nothing written)" : ""}`);
if (!dryRun) console.log("Hosted demo filled. Sign in with the existing demo emails and the shared demo password.");
