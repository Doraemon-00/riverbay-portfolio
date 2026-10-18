import { requireViewer } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { changeAssignment, enrolChild } from "@/app/actions";
export const instant = false;
type Named = { id: string; display_name: string };
type Class = { id: string; name: string };
type Period = { id: string; year: number; semester: number };
type Assignment = { teacher_id: string; class_id: string; period_id: string };
type Enrolment = {
  id: string;
  child_id: string;
  class_id: string;
  period_id: string;
};
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { db, profile } = await requireViewer(true);
  const results = await Promise.all([
    db
      .from("profiles")
      .select("id, display_name")
      .eq("role", "teacher")
      .order("display_name"),
    db.from("classes").select("id, name").order("name"),
    db
      .from("reporting_periods")
      .select("id, year, semester")
      .order("year", { ascending: false })
      .order("semester", { ascending: false }),
    db.from("children").select("id, display_name").order("display_name"),
    db.from("teacher_assignments").select("*"),
    db.from("enrolments").select("*"),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Could not load class administration.");
  const teachers = results[0].data as Named[],
    classes = results[1].data as Class[],
    periods = results[2].data as Period[];
  const children = results[3].data as Named[],
    assignments = results[4].data as Assignment[],
    enrolments = results[5].data as Enrolment[];
  const { error, notice } = await searchParams;
  const periodLabel = (id: string) => {
    const p = periods.find((p) => p.id === id);
    return p ? `${p.year} · Semester ${p.semester}` : "Unavailable";
  };
  const classLabel = (id: string) =>
    classes.find((c) => c.id === id)?.name ?? "Unavailable";
  const selectors = (prefix: "assignment" | "enrolment") => (
    <>
      <label>
        Class
        <select
          name={prefix === "assignment" ? "class_id" : "target_class"}
          required
          defaultValue=""
        >
          <option value="" disabled>
            Choose a class
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Reporting period
        <select
          name={prefix === "assignment" ? "period_id" : "target_period"}
          required
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {periodLabel(p.id)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
  return (
    <Shell profile={profile}>
      <div className="page-heading">
        <p className="eyebrow">CLASS ADMINISTRATION</p>
        <h1>The right people, together.</h1>
        <p>
          Manage who teaches each class and where each child belongs for the
          semester.
        </p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error === "duplicate"
            ? "That teacher is already assigned to this class and semester."
            : "Could not save the change. Check your selection and try again."}
        </p>
      )}
      {notice && (
        <p role="status" className="success">
          {notice === "assignment"
            ? "Teacher assignments updated."
            : "Child enrolment updated. Their semester portfolio is ready."}
        </p>
      )}
      <div className="admin-grid">
        <section className="panel">
          <h2>Assign a teacher</h2>
          <p className="hint">
            Access applies to the selected class and semester.
          </p>
          <form action={changeAssignment}>
            <label>
              Teacher
              <select name="teacher_id" required defaultValue="">
                <option value="" disabled>
                  Choose a teacher
                </option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.display_name}
                  </option>
                ))}
              </select>
            </label>
            {selectors("assignment")}
            <button className="primary">Assign teacher</button>
          </form>
        </section>
        <section className="panel">
          <h2>Enrol or move a child</h2>
          <p className="hint">
            Moving a child changes access to their selected semester’s
            portfolio. Other semesters stay as they are.
          </p>
          <form action={enrolChild}>
            <label>
              Child
              <select name="student_id" required defaultValue="">
                <option value="" disabled>
                  Choose a child
                </option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </label>
            {selectors("enrolment")}
            <button className="primary">Save enrolment</button>
          </form>
        </section>
      </div>
      <section className="class-section">
        <h2>Teacher assignments</h2>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Class</th>
                <th>Period</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={`${a.teacher_id}:${a.class_id}:${a.period_id}`}>
                  <th scope="row">
                    {teachers.find((t) => t.id === a.teacher_id)
                      ?.display_name ?? "Staff member"}
                  </th>
                  <td>{classLabel(a.class_id)}</td>
                  <td>{periodLabel(a.period_id)}</td>
                  <td>
                    <form action={changeAssignment}>
                      <input
                        type="hidden"
                        name="teacher_id"
                        value={a.teacher_id}
                      />
                      <input type="hidden" name="class_id" value={a.class_id} />
                      <input
                        type="hidden"
                        name="period_id"
                        value={a.period_id}
                      />
                      <button
                        className="quiet danger"
                        name="operation"
                        value="remove"
                      >
                        Remove access
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="class-section">
        <h2>Student enrolments</h2>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Child</th>
                <th>Class</th>
                <th>Period</th>
              </tr>
            </thead>
            <tbody>
              {enrolments.map((e) => (
                <tr key={e.id}>
                  <th scope="row">
                    {children.find((c) => c.id === e.child_id)?.display_name}
                  </th>
                  <td>{classLabel(e.class_id)}</td>
                  <td>{periodLabel(e.period_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="hint">
        Staff accounts, classes and children are seeded for this prototype.
        Invitations and bulk imports can follow.
      </p>
    </Shell>
  );
}
