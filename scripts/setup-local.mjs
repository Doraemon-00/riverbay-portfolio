import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

// Local-only: never seed or reset a hosted project with this script.
const output = execFileSync(
  process.execPath,
  ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const status = JSON.parse(output);
const endpoint = status.API_URL;
if (!["127.0.0.1", "localhost"].includes(new URL(endpoint).hostname))
  throw new Error("Local setup refuses non-local database endpoints.");
const db = createClient(endpoint, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const check = (result) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
const id = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const priorEnv = await readFile(".env.local", "utf8").catch(error => { if (error.code === "ENOENT") return ""; throw error; });
const retainedEnv = priorEnv.split(/\r?\n/).filter(line => !/^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=/.test(line)).join("\n").trim();
await writeFile(".env.local", `${retainedEnv ? retainedEnv + "\n" : ""}NEXT_PUBLIC_SUPABASE_URL=${endpoint}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}\nSUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}\n`);
const existing = check(await db.from("children").select("id").limit(1));
if (existing.length) {
  console.log(
    "Local environment configured. Existing data preserved; access details remain in .demo-access.txt.",
  );
  process.exit(0);
}
// Shared credentials for this fictional demo, matching newly provisioned teachers.
const password = "teach2LEARN";
const accounts = [
  { email: "admin@riverbay.com", name: "Morgan Tan", role: "admin" },
  { email: "teacher@riverbay.com", name: "Jamie Lee", role: "teacher" },
  { email: "teacher2@riverbay.com", name: "Alex Chen", role: "teacher" },
];
const users = check(await db.auth.admin.listUsers()).users;
for (const account of accounts) {
  let user = users.find((u) => u.email === account.email);
  if (!user)
    user = check(
      await db.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
      }),
    ).user;
  account.id = user.id;
  check(
    await db
      .from("profiles")
      .upsert({ id: user.id, display_name: account.name, role: account.role, email: account.email }),
  );
}
await writeFile(
  ".demo-access.txt",
  JSON.stringify(
    {
      note: "Local fictional demo accounts only. Do not publish this file.",
      password,
      accounts: accounts.map((a) => ({ email: a.email, role: a.role })),
    },
    null,
    2,
  ),
);
check(
  await db.from("classes").upsert([
    { id: id(1), name: "K1 Willow", level: "K1" },
    { id: id(2), name: "K1 Meadow", level: "K1" },
  ]),
);
check(
  await db.from("reporting_periods").upsert([
    { id: id(11), year: 2026, semester: 1 },
    { id: id(12), year: 2026, semester: 2 },
  ]),
);
check(
  await db.from("class_teachers").upsert([
    { teacher_id: accounts[1].id, class_id: id(1) },
    { teacher_id: accounts[2].id, class_id: id(2) },
  ]),
);
const names = [
  "Avery Lim",
  "Bailey Tan",
  "Casey Ng",
  "Dylan Goh",
  "Eden Lee",
  "Finley Koh",
  "Harper Wong",
  "Jamie Teo",
  "Jordan Chua",
  "Kai Low",
  "Logan Yeo",
  "Morgan Foo",
  "Noah Toh",
  "Parker Ho",
  "Quinn Ong",
  "Reese Tay",
  "Riley Sim",
  "Rowan Ang",
  "Sage Neo",
  "Taylor Soh",
  "Robin Chan",
];
const children = names.map((display_name, i) => ({
  id: id(100 + i),
  display_name,
}));
check(await db.from("children").upsert(children));
const admin = createClient(endpoint, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
check(
  await admin.auth.signInWithPassword({ email: accounts[0].email, password }),
);
for (const [classId, selected] of [[id(1), children.slice(0, 20)], [id(2), children.slice(20)]]) {
  check(await admin.rpc("manage_class", { command: "assign_students", payload: { year: 2026, class_id: classId, ids: selected.map(c => c.id) } }));
}
for (let i = 0; i < 3; i++) {
    const enrolment = check(
      await db
        .from("enrolments")
        .select("id")
        .eq("child_id", children[i].id)
        .eq("period_id", id(11))
        .single(),
    );
    const portfolio = check(
      await db
        .from("portfolios")
        .select("id")
        .eq("enrolment_id", enrolment.id)
        .single(),
    );
    check(
      await db
        .from("domain_entries")
        .update({ rating: 1 })
        .eq("portfolio_id", portfolio.id),
    );
}
console.log(
  "Local setup complete: admin, two teachers, two classes, 20-child main class and semester history. Access details: .demo-access.txt",
);
