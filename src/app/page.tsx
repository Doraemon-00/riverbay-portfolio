import Link from "next/link";
import { Icon } from "@/components/icon";
import { requireViewer } from "@/lib/auth";
import { domains, rosterSelect, type RosterItem } from "@/lib/portfolio";
import { Shell } from "@/components/shell";
export const instant = false;
export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { db, profile } = await requireViewer();
  const query = await searchParams;
  const results = await Promise.all([
    db.from("enrolments").select(rosterSelect),
    db.from("reporting_periods").select("id,year,semester").order("year", { ascending: false }).order("semester", { ascending: false }),
    db.from("class_memberships").select("child_id,class_id,academic_year,access_enabled"),
  ]);
  if (results.some(r => r.error)) throw new Error("Could not load your classes. Please try again.");
  const all = (results[0].data as unknown as RosterItem[]).filter(item => item.children && !item.children.archived_at && !item.classes.archived_at && results[2].data!.some(m => m.child_id === item.child_id && m.class_id === item.class_id && m.academic_year === item.reporting_periods.year && m.access_enabled));
  const available = results[1].data!.filter(p => all.some(item => item.period_id === p.id));
  const periods = available.length ? available : results[1].data!;
  const chosen = periods.find(p => p.id === query.period) ?? periods[0];
  const roster = all.filter(item => item.period_id === chosen?.id).sort(
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
        <p>Every observation is a starting point. Choose a child to continue.</p>
      </div>
      {periods.length > 0 && <form className="semester-picker" method="get" action="/"><label>Portfolio semester<select name="period" defaultValue={chosen?.id}>{periods.map(p => <option key={p.id} value={p.id}>{p.year} · Semester {p.semester}</option>)}</select></label><button className="secondary">Open semester</button></form>}
      {roster.length === 0 && (
        <section className="panel">
          <h2>No portfolios here yet</h2>
          <p>Your administrator can assign teachers and students to a class for the academic year.</p>
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
          <p className="hint mobile-table-hint">Swipe the table to see all four domains and open a portfolio.</p>
          <div className="panel table-wrap" tabIndex={0} role="region" aria-label={`${children[0].classes.name} portfolio progress`}>
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
                              ? "Draft"
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
                          Open <Icon name="arrow-right" size={16} />
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
