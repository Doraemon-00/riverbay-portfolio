import Link from "next/link";
import { Icon } from "@/components/icon";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile, viewerSession } from "@/lib/auth";
import {
  domains,
  ratingLabels,
  rosterSelect,
  scaleVersion,
  type Domain,
  type Entry,
  type RosterItem,
} from "@/lib/portfolio";
import { StudentNavigator } from "@/components/student-navigator";
import { loadPortfolioNavigation } from "@/lib/portfolio-navigation";
import { LinkLoader } from "@/components/page-loader";
import { PdfExport } from "@/components/pdf-export";
import { PortfolioDomains } from "@/components/portfolio-domains";

// One query finds the portfolio's enrolment: the inner join filters enrolments by portfolio ID.
const portfolioSelect = rosterSelect.replace("portfolios(", "portfolios!inner(");

export const instant = false;
export default async function Portfolio({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { db, userId } = await viewerSession();
  const { id } = await params,
    query = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  // The staff check and the portfolio load run together; database policies apply to both.
  const [profile, { data, error }] = await Promise.all([
    requireProfile(db, userId),
    db.from("enrolments").select(portfolioSelect).eq("portfolios.id", id).maybeSingle(),
  ]);
  if (error) throw new Error("Could not load this portfolio.");
  if (!data) notFound();
  const child = data as unknown as RosterItem;
  const selected = domains.find((d) => d.id === query.domain) ?? domains[0];
  const entries = child.portfolios?.domain_entries ?? [];
  if (!entries.some((e) => e.domain === selected.id)) notFound();
  const [history, navigation] = await Promise.all([
    db.rpc("previous_semester_ratings", { current_portfolio: id }),
    loadPortfolioNavigation(db, child.period_id, child.reporting_periods.year),
  ]);
  if (history.error) throw new Error("Could not load semester history.");
  const priorRatings: Partial<Record<Domain, number>> = {};
  for (const e of history.data as Pick<Entry, "domain" | "rating" | "rating_scale_version">[])
    if (e.rating != null && e.rating_scale_version === scaleVersion) priorRatings[e.domain] = e.rating;
  const { classChoices } = navigation;
  const classmates = navigation.students.filter(c => c.class_id === child.class_id);
  const index = classmates.findIndex((c) => c.id === child.id);
  const previous = classmates[index - 1]?.portfolios,
    next = classmates[index + 1]?.portfolios;
  const previousName = classmates[index - 1]?.children.display_name,
    nextName = classmates[index + 1]?.children.display_name;
  return (
    <>
      <Link className="text-link portfolio-back-link" href={`/?period=${child.period_id}&class=${child.class_id}`}>
        <Icon name="arrow-left" size={18} /> Back to my classes
        <LinkLoader label="Opening your classes…" />
      </Link>
      <div className="portfolio-workspace" data-tour-page="portfolio" data-tour-key={`${id}:${selected.id}`}>
        <StudentNavigator viewerId={profile.id} classmates={classmates} currentId={id} domain={selected.id} className={child.classes.name} year={child.reporting_periods.year} semester={child.reporting_periods.semester} classId={child.class_id} classChoices={classChoices} periodId={child.period_id} />
        <section className="portfolio-main" aria-label="Student portfolio">
      <div className="child-heading">
        <div>
          <p className="eyebrow">
            {child.classes.name} · {child.reporting_periods.year} · SEMESTER{" "}
            {child.reporting_periods.semester}
          </p>
          <h1>{child.children.display_name}</h1>
        </div>
        <nav className="child-nav" aria-label="Students">
          {previous && (
            <Link prefetch scroll={false} href={`/portfolio/${previous.id}`} data-loader-label={`Opening ${previousName}…`}>
              <Icon name="arrow-left" size={18} /> Previous
              <LinkLoader kind="inline" label={`Opening ${previousName}…`} />
            </Link>
          )}
          <span>
            {index + 1} of {classmates.length}
          </span>
          {next && (
            <Link prefetch scroll={false} href={`/portfolio/${next.id}`} data-loader-label={`Opening ${nextName}…`}>
              Next <Icon name="arrow-right" size={18} />
              <LinkLoader kind="inline" label={`Opening ${nextName}…`} />
            </Link>
          )}
        </nav>
      </div>
      <PdfExport key={id} portfolioId={id} areas={domains.map((d) => {
        const e = entries.find((x) => x.domain === d.id) as (Entry & { updated_at: string }) | undefined;
        return { id: d.id, label: d.label, indicator: e?.rating ? ratingLabels[e.rating - 1] : null, hasStory: Boolean(e?.narrative.trim()), savedAt: e?.updated_at ?? new Date(0).toISOString(), photos: e?.photos?.length ?? 0 };
      })} />
      <PortfolioDomains portfolioId={id} entries={entries} priorRatings={priorRatings} fallback={selected.id} />
        </section>
      </div>
    </>
  );
}
