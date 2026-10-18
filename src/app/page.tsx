import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { domains, rosterSelect, type RosterItem } from "@/lib/portfolio";
import { Shell } from "@/components/shell";
export const instant = false;
export default async function Home() {
  const { db, profile } = await requireViewer();
  const { data, error } = await db.from("enrolments").select(rosterSelect);
  if (error) throw new Error("Could not load your classes. Please try again.");
  const roster = (data as unknown as RosterItem[]).sort(
    (a, b) =>
      b.reporting_periods.year - a.reporting_periods.year ||
      b.reporting_periods.semester - a.reporting_periods.semester ||
      a.children.display_name.localeCompare(b.children.display_name),
  );
  const groups = new Map<string, RosterItem[]>();
  roster.forEach((item) => {
    const key = `${item.class_id}:${item.period_id}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return (
    <Shell profile={profile}>
      <div className="page-heading">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Room for every little story.</h1>
        <p>Choose a child to continue their learning portfolio.</p>
      </div>
      {roster.length === 0 && (
        <section className="panel">
          <h2>No class assigned yet</h2>
          <p>Your administrator can assign your class and reporting period.</p>
        </section>
      )}
      {[...groups.entries()].map(([key, children]) => (
        <section className="class-section" key={key}>
          <div className="section-heading">
            <h2>{children[0].classes.name}</h2>
            <span>
              {children[0].reporting_periods.year} · Semester{" "}
              {children[0].reporting_periods.semester} · {children.length}{" "}
              children
            </span>
          </div>
          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Child</th>
                  {domains.map((d) => (
                    <th key={d.id}>{d.label}</th>
                  ))}
                  <th>
                    <span className="sr-only">Open portfolio</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id}>
                    <th scope="row">{child.children.display_name}</th>
                    {domains.map((domain) => {
                      const entry = child.portfolios?.domain_entries.find(
                        (e) => e.domain === domain.id,
                      );
                      return (
                        <td key={domain.id}>
                          <span
                            className={`status ${entry?.narrative ? "started" : ""}`}
                          >
                            {entry?.narrative
                              ? "Draft saved"
                              : entry?.comments || entry?.rating
                                ? "In progress"
                                : "Not started"}
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      {child.portfolios ? (
                        <Link
                          className="text-link"
                          href={`/portfolio/${child.portfolios.id}`}
                        >
                          Open →
                        </Link>
                      ) : (
                        "Awaiting setup"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </Shell>
  );
}
