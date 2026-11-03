// Local-only check of the guest school: separation from the staff school, and the nightly reset.
//   npm run dev (in another terminal), then: npm run test:guest
// Needs GUEST_EMAIL, GUEST_PASSWORD and CRON_SECRET in .env.local (any local values).
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Local fictional fixture only.");
const status = JSON.parse(execFileSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
if (status.API_URL !== url) throw new Error("Local API mismatch.");
const app = process.env.APP_URL ?? "http://127.0.0.1:3000";
const { password } = JSON.parse(await readFile(".demo-access.txt", "utf8"));
const client = key => createClient(url, key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const service = client(status.SERVICE_ROLE_KEY), staff = client(), guest = client(), teacher = client();
const ok = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
const staffSchool = "00000000-0000-4000-8000-000000000001", guestSchool = "00000000-0000-4000-8000-000000000002";
const resetRoute = () => fetch(`${app}/api/guest/reset`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }).then(async r => ({ status: r.status, body: await r.json() }));

// Everything the staff school holds, to prove the guest school never changes it.
async function staffState() {
  const [children, classes, entries, photos] = await Promise.all([
    service.from("children").select("*").eq("school_id", staffSchool).order("id"),
    service.from("classes").select("*").eq("school_id", staffSchool).order("id"),
    service.from("domain_entries").select("id,revision,narrative,observations,rating").order("id"),
    service.from("photos").select("id,storage_key").order("id"),
  ]);
  const staffIds = new Set(ok(children).map(c => c.id));
  const enrolments = ok(await service.from("enrolments").select("id,child_id"));
  const portfolios = ok(await service.from("portfolios").select("id,enrolment_id"));
  const staffPortfolios = new Set(portfolios.filter(f => staffIds.has(enrolments.find(e => e.id === f.enrolment_id)?.child_id)).map(f => f.id));
  const allEntries = ok(entries), entryPortfolio = ok(await service.from("domain_entries").select("id,portfolio_id"));
  const staffEntries = allEntries.filter(e => staffPortfolios.has(entryPortfolio.find(x => x.id === e.id).portfolio_id));
  const staffEntryIds = new Set(staffEntries.map(e => e.id));
  return JSON.stringify({ children: ok(children), classes: ok(classes), entries: staffEntries, photos: ok(photos).filter(p => staffEntryIds.has(p.storage_key.split("/")[0])) });
}

// A staff photo, so the first setup has a file to copy.
ok(await staff.auth.signInWithPassword({ email: "teacher@riverbay.com", password }));
const staffEntry = ok(await staff.from("domain_entries").select("id").limit(1).single());
if (!ok(await service.from("photos").select("id").eq("entry_id", staffEntry.id)).length) {
  const key = `${staffEntry.id}/sample-${randomUUID()}.jpg`;
  ok(await service.storage.from("portfolio-photos").upload(key, await readFile("docs/pdf-concepts/claude/assets/art/rb2-scene-counting-stones.jpg"), { contentType: "image/jpeg" }));
  ok(await service.from("photos").insert({ entry_id: staffEntry.id, storage_key: key, uploaded_by: (await staff.auth.getUser()).data.user.id }));
}
await staff.auth.signOut();

assert.equal((await fetch(`${app}/api/guest/reset`)).status, 401, "The reset needs the cron secret");
const before = await staffState();
let run = await resetRoute();
assert.equal(run.status, 200, JSON.stringify(run.body));
if (run.body.action === "created") console.log("created guest school:", run.body);

// Guest sign-in through the app's endpoint, then as a database client.
const signIn = await fetch(`${app}/api/auth/guest`, { method: "POST", headers: { "content-type": "application/json", origin: app } });
assert.equal(signIn.status, 200); assert.deepEqual(await signIn.json(), { ok: true });
ok(await guest.auth.signInWithPassword({ email: process.env.GUEST_EMAIL, password: process.env.GUEST_PASSWORD }));
ok(await staff.auth.signInWithPassword({ email: "admin@riverbay.com", password }));
ok(await teacher.auth.signInWithPassword({ email: "teacher@riverbay.com", password }));
const guestId = (await guest.auth.getUser()).data.user.id;

// Each administrator sees only their own school.
const guestChildren = ok(await guest.from("children").select("id,display_name,school_id"));
const staffChildren = ok(await staff.from("children").select("id,display_name,school_id"));
assert.ok(guestChildren.length > 0 && guestChildren.every(c => c.school_id === guestSchool), "Guest sees only guest children");
assert.ok(staffChildren.every(c => c.school_id === staffSchool), "Staff admin sees only staff children");
assert.deepEqual(guestChildren.map(c => c.display_name).sort(), staffChildren.map(c => c.display_name).sort(), "Guest school starts as a copy");
assert.ok(ok(await guest.from("profiles").select("school_id")).every(p => p.school_id === guestSchool));
assert.ok(ok(await staff.from("profiles").select("school_id")).every(p => p.school_id === staffSchool));
const staffChild = staffChildren[0].id, guestChild = guestChildren[0].id;
assert.equal(ok(await guest.from("domain_entries").select("id")).length, ok(await staff.from("domain_entries").select("id")).length);
assert.equal(ok(await teacher.from("children").select("id").eq("id", guestChild)).length, 0, "Staff teacher cannot see guest children");

// Neither school can change the other through the administration functions.
const year = 2026;
const guestClass = ok(await guest.from("classes").select("id").limit(1).single()).id;
const staffClass = ok(await staff.from("classes").select("id").limit(1).single()).id;
const staffTeacher = ok(await staff.from("profiles").select("id").eq("role", "teacher").limit(1).single()).id;
for (const [db, command, payload] of [
  [guest, "archive_students", { year, ids: [staffChild] }],
  [guest, "assign_students", { year, class_id: guestClass, ids: [staffChild] }],
  [guest, "assign_teachers", { year, class_id: guestClass, ids: [staffTeacher] }],
  [guest, "rename_class", { year, class_id: staffClass, level: "K1", name: "Taken" }],
  [guest, "clear_class", { year, class_id: staffClass }],
  [staff, "archive_students", { year, ids: [guestChild] }],
  [staff, "assign_students", { year, class_id: staffClass, ids: [guestChild] }],
]) assert.ok((await db.rpc("manage_class", { command, payload })).error, `${command} across schools is refused`);
assert.ok((await guest.rpc("manage_directory", { command: "deactivate_teachers", payload: { ids: [staffTeacher] } })).error);
assert.ok((await guest.rpc("add_teacher_classes", { payload: { year, ids: [staffTeacher], class_ids: [guestClass] } })).error);
const staffEntryRow = ok(await service.from("domain_entries").select("id,revision").eq("id", staffEntry.id).single());
assert.equal((await guest.rpc("save_domain_observations", { entry_id: staffEntryRow.id, expected_revision: staffEntryRow.revision, new_rating: 1, new_narrative: "x", new_observations: [] })).error?.code, "42501");
assert.equal(ok(await guest.storage.from("portfolio-photos").list(staffEntry.id)).length, 0, "Guest cannot list staff photo files");
for (const rpc of ["reset_guest_school", "capture_guest_snapshot", "guest_reset_plan"]) assert.ok((await guest.rpc(rpc)).error, `${rpc} is server-only`);

// Guests change their school freely.
const created = ok(await guest.rpc("manage_class", { command: "create_student", payload: { year, class_id: guestClass, name: "Visitor Test Child" } }));
ok(await guest.rpc("manage_class", { command: "rename_class", payload: { year, class_id: guestClass, level: "K1", name: "Renamed By Guest" } }));
ok(await guest.rpc("manage_class", { command: "create_class", payload: { year: 2031, level: "K2", name: "Future" } }));
const guestEntry = ok(await guest.from("domain_entries").select("id,revision,narrative").limit(1).single());
ok(await guest.rpc("save_domain_observations", { entry_id: guestEntry.id, expected_revision: guestEntry.revision, new_rating: 3, new_narrative: "Changed by a guest.", new_observations: [{ id: randomUUID(), date: null, text: "Guest note" }] }));
const guestPhoto = ok(await guest.from("photos").select("id,storage_key").limit(1).maybeSingle());
if (guestPhoto) {
  ok(await guest.from("photos").delete().eq("id", guestPhoto.id).select("id"));
  ok(await guest.storage.from("portfolio-photos").remove([guestPhoto.storage_key]));
}
const extraKey = `${guestEntry.id}/image-${randomUUID()}.jpg`;
ok(await guest.storage.from("portfolio-photos").upload(extraKey, await readFile("docs/pdf-concepts/claude/assets/art/rb2-scene-garden-planting.jpg"), { contentType: "image/jpeg" }));
ok(await guest.from("photos").insert({ entry_id: guestEntry.id, storage_key: extraKey, uploaded_by: guestId }));
const madeByGuest = ok(await service.auth.admin.createUser({ email: `visitor-${randomUUID().slice(0, 8)}@example.test`, password: randomUUID(), email_confirm: true, app_metadata: { riverbay_setup_by: guestId } })).user;
ok(await guest.rpc("finish_teacher_setup", { teacher_id: madeByGuest.id, teacher_name: "Visitor Teacher", teacher_email: madeByGuest.email, yr: year, class_ids: [guestClass] }));
assert.equal(ok(await guest.from("profiles").select("school_id").eq("id", madeByGuest.id).single()).school_id, guestSchool);
assert.equal(ok(await staff.from("profiles").select("id").eq("id", madeByGuest.id)).length, 0);

// The reset puts the guest school back and leaves the staff school alone.
run = await resetRoute();
assert.equal(run.status, 200, JSON.stringify(run.body));
assert.equal(run.body.action, "reset");
assert.ok(run.body.removedPhotos >= 1 && run.body.removedAccounts === 1, JSON.stringify(run.body));
assert.equal(ok(await service.from("children").select("id").eq("id", created.id)).length, 0, "Guest-made student removed");
assert.equal(ok(await service.from("classes").select("id").eq("academic_year", 2031)).length, 0, "Guest-made class removed");
assert.equal(ok(await service.from("reporting_periods").select("id").eq("year", 2031)).length, 0, "Unused guest year removed");
assert.notEqual(ok(await service.from("classes").select("name").eq("id", guestClass).single()).name, "K1 Renamed By Guest");
assert.equal(ok(await service.from("domain_entries").select("narrative").eq("id", guestEntry.id).single()).narrative, guestEntry.narrative);
assert.equal(ok(await service.from("photos").select("id").eq("storage_key", extraKey)).length, 0);
assert.ok((await service.storage.from("portfolio-photos").download(extraKey)).error, "Guest upload deleted");
if (guestPhoto) assert.equal((await service.storage.from("portfolio-photos").download(guestPhoto.storage_key)).error, null, "Deleted snapshot photo restored");
assert.equal((await service.auth.admin.getUserById(madeByGuest.id)).data.user, null, "Guest-made sign-in deleted");
assert.equal(await staffState(), before, "Staff school unchanged");
assert.equal(ok(await guest.from("children").select("id")).length, guestChildren.length);
console.log("PASS: guest sign-in, school separation for reads, writes, files and admin functions, server-only reset functions, and a nightly reset that restores guest records, photos and accounts while the staff school stays unchanged.");
