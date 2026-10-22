import Link from "next/link";
import { Icon } from "@/components/icon";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import {
  domains,
  ratingLabels,
  rosterSelect,
  scaleVersion,
  type Entry,
  type RosterItem,
} from "@/lib/portfolio";
import { StudentNavigator } from "@/components/student-navigator";
import { loadPortfolioNavigation } from "@/lib/portfolio-navigation";
import { InlineLoader, LinkLoader } from "@/components/page-loader";
import { DomainEditor } from "@/components/domain-editor";
import { PdfExport } from "@/components/pdf-export";
import { DomainStamp } from "@/components/domain-stamp";
export const instant = false;
export default async function Portfolio({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { db, profile } = await requireViewer();
  const { id } = await params,
    query = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: portfolio, error: portfolioError } = await db
    .from("portfolios")
    .select("enrolment_id")
    .eq("id", id)
    .maybeSingle();
  if (portfolioError) throw new Error("Could not load this portfolio.");
  if (!portfolio) notFound();
  const { data, error } = await db
    .from("enrolments")
    .select(rosterSelect)
    .eq("id", portfolio.enrolment_id)
    .single();
  if (error) throw new Error("Could not load this portfolio.");
  const child = data as unknown as RosterItem;
  const selected = domains.find((d) => d.id === query.domain) ?? domains[0];
  const entry = child.portfolios?.domain_entries.find(
    (e) => e.domain === selected.id,
  );
  if (!entry) notFound();
  const [history, navigation] = await Promise.all([
    db.rpc("previous_semester_ratings", { current_portfolio: id }),
    loadPortfolioNavigation(db, child.period_id, child.reporting_periods.year),
  ]);
  if (history.error) throw new Error("Could not load semester history.");
  const prior = (history.data as Pick<Entry, "domain" | "rating" | "rating_scale_version">[])
    .find(e => e.domain === selected.id && e.rating_scale_version === scaleVersion);
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
        <nav className="child-nav" aria-label="Children">
          {previous && (
            <Link scroll={false} href={`/portfolio/${previous.id}?domain=${selected.id}`} data-loader-label={`Opening ${previousName}…`}>
              <Icon name="arrow-left" size={18} /> Previous
              <LinkLoader kind="inline" label={`Opening ${previousName}…`} />
            </Link>
          )}
          <span>
            {index + 1} of {classmates.length}
          </span>
          {next && (
            <Link scroll={false} href={`/portfolio/${next.id}?domain=${selected.id}`} data-loader-label={`Opening ${nextName}…`}>
              Next <Icon name="arrow-right" size={18} />
              <LinkLoader kind="inline" label={`Opening ${nextName}…`} />
            </Link>
          )}
        </nav>
      </div>
      <PdfExport key={id} portfolioId={id} areas={domains.map((d) => {
        const e = child.portfolios?.domain_entries.find((x) => x.domain === d.id) as (Entry & { updated_at: string }) | undefined;
        return { id: d.id, label: d.label, indicator: e?.rating ? ratingLabels[e.rating - 1] : null, hasStory: Boolean(e?.narrative.trim()), savedAt: e?.updated_at ?? new Date(0).toISOString() };
      })} />
      <nav className="domain-tabs" aria-label="Learning domains">
        {domains.map((d) => {
          const saved = child.portfolios?.domain_entries.find(e => e.domain === d.id);
          return (
          <Link
            key={d.id}
            scroll={false} href={`/portfolio/${id}?domain=${d.id}`}
            aria-current={selected.id === d.id ? "page" : undefined}
            aria-describedby={`readiness-${id}-${selected.id}-${d.id}`}
            data-loader-label={`Opening ${d.label}…`}
          >
            <LinkLoader kind="inline" label={`Opening ${d.label}…`} />
            <span className={`domain-badge ${d.id}`}>{d.short}</span>
            <span className="domain-tab-label">{d.label}</span>
            <DomainStamp domain={d.id} tooltipId={`readiness-${id}-${selected.id}-${d.id}`} hasIndicator={Boolean(saved?.rating)} hasStory={Boolean(saved?.narrative.trim())} />
          </Link>
        ); })}
      </nav>
      <InlineLoader />
      <DomainEditor
        key={entry.id}
        entry={entry}
        previousRating={prior?.rating ?? null}
      />
        </section>
      </div>
    </>
  );
}
