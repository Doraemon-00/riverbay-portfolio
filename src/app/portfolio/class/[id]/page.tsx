import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { domains } from "@/lib/portfolio";
import { loadPortfolioNavigation } from "@/lib/portfolio-navigation";
import { StudentNavigator, type SemesterChoice } from "@/components/student-navigator";

export const instant = false;
export default async function ClassPortfolio({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string; domain?: string }>;
}) {
  const { db, profile } = await requireViewer();
  const { id } = await params, query = await searchParams;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(query.period).success) notFound();
  const { data: period, error } = await db.from("reporting_periods").select("id,year,semester").eq("id", query.period!).maybeSingle();
  if (error) throw new Error("Could not load this semester.");
  if (!period) notFound();
  const [{ students, classChoices }, periods] = await Promise.all([
    loadPortfolioNavigation(db, period.id, period.year),
    db.from("reporting_periods").select("id,year,semester").eq("year", period.year).order("semester", { ascending: false }),
  ]);
  if (periods.error) throw new Error("Could not load this year's semesters.");
  // An empty class has no portfolio to follow, so another semester opens My classes there.
  const semesterChoices: SemesterChoice[] = periods.data.map(p => ({ id: p.id, label: `${p.year} · Semester ${p.semester}`, href: `/?period=${p.id}&class=${id}`, portfolio: false }));
  const current = classChoices.find(c => c.id === id);
  if (!current) notFound();
  const domain = domains.find(d => d.id === query.domain) ?? domains[0];
  // A bookmarked empty class can later have students. Open its first portfolio then.
  if (current.portfolioIds.length) redirect(`/portfolio/${current.portfolioIds[0]}?domain=${domain.id}`);
  const classmates = students.filter(s => s.class_id === id);
  return <>
    <div className="portfolio-workspace" data-tour-page="empty-class" data-tour-key={`${id}:${domain.id}`}>
      <StudentNavigator viewerId={profile.id} classmates={classmates} currentId="" domain={domain.id} className={current.name} classId={id} year={period.year} semester={period.semester} classChoices={classChoices} periodId={period.id} semesterChoices={semesterChoices} />
      <section className="portfolio-main" aria-label="Class portfolios">
        <div className="child-heading"><div><p className="eyebrow"><Link className="crumb-link" href={`/?period=${period.id}&class=${id}`}>{period.year} · SEMESTER {period.semester}</Link></p><h1>{current.name}</h1></div></div>
        <div className="portfolio-empty-state">
          <h2>{classmates.length ? "Portfolios aren't ready yet" : "No students in this class yet"}</h2>
          <p>{classmates.length ? "Student portfolios are awaiting setup. Choose another class to continue." : "Choose another class to continue working on portfolios."}</p>
          {profile.role === "admin" && <Link className="secondary" href={`/admin?year=${period.year}&class=${id}`}>Manage class</Link>}
        </div>
      </section>
    </div>
  </>;
}
