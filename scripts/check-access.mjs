import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Run only against the local fictional fixture.");
const { password } = JSON.parse(await readFile(".demo-access.txt", "utf8"));
const client = () =>
  createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
const teacher = client(),
  other = client(),
  admin = client(),
  anon = client();
assert.equal(
  (
    await anon.auth.signUp({
      email: `blocked-${randomUUID()}@riverbay.com`,
      password: "Fixture-only-signup-blocked!123",
    })
  ).error?.code,
  "signup_disabled",
);
const ok = (r) => {
  assert.equal(r.error, null, r.error?.message);
  return r.data;
};
for (const [db, email] of [
  [teacher, "teacher@riverbay.com"],
  [other, "teacher2@riverbay.com"],
  [admin, "admin@riverbay.com"],
])
  ok(await db.auth.signInWithPassword({ email, password }));
const mine = ok(await teacher.from("domain_entries").select("*"));
const theirs = ok(await other.from("domain_entries").select("*"));
assert.equal(mine.length, 80);
assert.equal(theirs.length, 4);
assert.equal(
  (await anon.from("domain_entries").select("*")).error?.code,
  "42501",
);
assert.equal(
  ok(await teacher.from("domain_entries").select("*").eq("id", theirs[0].id))
    .length,
  0,
);
assert.ok(
  (
    await teacher.rpc("save_domain_entry", {
      entry_id: theirs[0].id,
      expected_revision: 0,
      new_rating: 1,
      new_comments: "must not write",
      new_narrative: "",
    })
  ).error,
);
assert.ok(
  (
    await teacher
      .from("domain_entries")
      .update({ narrative: "bypass" })
      .eq("id", mine[0].id)
  ).error,
);
assert.ok(
  (
    await teacher
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", (await teacher.auth.getUser()).data.user.id)
  ).error,
);
assert.ok(
  (
    await teacher.rpc("set_enrolment", {
      student_id: "10000000-0000-4000-8000-000000000100",
      target_class: "10000000-0000-4000-8000-000000000002",
      target_period: "10000000-0000-4000-8000-000000000012",
    })
  ).error,
);
const entry = mine[0];
const saved = ok(
  await teacher.rpc("save_domain_entry", {
    entry_id: entry.id,
    expected_revision: entry.revision,
    new_rating: entry.rating,
    new_comments: entry.comments,
    new_narrative: entry.narrative,
  }),
);
assert.equal(saved.revision, entry.revision + 1);
assert.equal(
  (
    await teacher.rpc("save_domain_entry", {
      entry_id: entry.id,
      expected_revision: entry.revision,
      new_rating: 1,
      new_comments: "stale",
      new_narrative: "",
    })
  ).error?.code,
  "40001",
);
const portfolios = ok(await teacher.from("portfolios").select("id"));
let historical = false;
for (const p of portfolios) {
  const ratings = ok(
    await teacher.rpc("previous_semester_ratings", { current_portfolio: p.id }),
  );
  if (ratings.length) {
    assert.equal(ratings.length, 4);
    assert.ok(ratings.every((r) => r.rating === 1));
    historical = true;
    break;
  }
}
assert.ok(historical);
assert.ok(
  (
    await teacher.rpc("previous_semester_ratings", {
      current_portfolio: theirs[0].portfolio_id,
    })
  ).error,
);
const teacherId = (await teacher.auth.getUser()).data.user.id;
const assignment = {
  teacher_id: teacherId,
  class_id: "10000000-0000-4000-8000-000000000001",
  period_id: "10000000-0000-4000-8000-000000000012",
};
try {
  ok(await admin.from("teacher_assignments").delete().match(assignment));
  assert.equal(ok(await teacher.from("domain_entries").select("id")).length, 0);
} finally {
  ok(await admin.from("teacher_assignments").upsert(assignment));
}
const bytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=",
  "base64",
);
assert.ok(
  (
    await teacher.storage
      .from("portfolio-photos")
      .upload(`${theirs[0].id}/${randomUUID()}.png`, bytes, {
        contentType: "image/png",
      })
  ).error,
);
const path = `${entry.id}/${randomUUID()}.png`;
ok(
  await teacher.storage
    .from("portfolio-photos")
    .upload(path, bytes, { contentType: "image/png" }),
);
assert.ok((await other.storage.from("portfolio-photos").download(path)).error);
ok(await teacher.storage.from("portfolio-photos").remove([path]));
// Admin transfer changes access in this period; moving back restores scope.
const child = "10000000-0000-4000-8000-000000000119",
  period = "10000000-0000-4000-8000-000000000012";
try {
  ok(
    await admin.rpc("set_enrolment", {
      student_id: child,
      target_class: "10000000-0000-4000-8000-000000000002",
      target_period: period,
    }),
  );
  assert.equal(
    ok(await teacher.from("domain_entries").select("id")).length,
    76,
  );
  assert.equal(ok(await other.from("domain_entries").select("id")).length, 8);
} finally {
  ok(
    await admin.rpc("set_enrolment", {
      student_id: child,
      target_class: "10000000-0000-4000-8000-000000000001",
      target_period: period,
    }),
  );
}
console.log(
  "PASS: class isolation, anonymous access, forbidden writes, role escalation, stale-save conflict, narrow S1 history, assignment revocation, private storage and admin transfer.",
);
for (const db of [teacher, other, admin]) await db.auth.signOut({ scope: "local" });
