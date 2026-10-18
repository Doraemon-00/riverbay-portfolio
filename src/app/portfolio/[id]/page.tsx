import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import {
  domains,
  rosterSelect,
  scaleVersion,
  type Entry,
  type RosterItem,
} from "@/lib/portfolio";
import { Shell } from "@/components/shell";
import { DomainEditor } from "@/components/domain-editor";
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
  const results = await Promise.all([
    db.rpc("previous_semester_ratings", { current_portfolio: id }),
    db
      .from("enrolments")
      .select(rosterSelect)
      .eq("class_id", child.class_id)
      .eq("period_id", child.period_id),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Could not load class navigation or semester history.");
  const prior = (
    results[0].data as Pick<
      Entry,
      "domain" | "rating" | "rating_scale_version"
    >[]
  ).find(
    (e) => e.domain === selected.id && e.rating_scale_version === scaleVersion,
  );
  const classmates = (results[1].data as unknown as RosterItem[]).sort((a, b) =>
    a.children.display_name.localeCompare(b.children.display_name),
  );
  const index = classmates.findIndex((c) => c.id === child.id);
  const previous = classmates[index - 1]?.portfolios,
    next = classmates[index + 1]?.portfolios;
  return (
    <Shell profile={profile}>
      <Link className="text-link" href="/">
        ← Back to my classes
      </Link>
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
            <Link href={`/portfolio/${previous.id}?domain=${selected.id}`}>
              ← Previous
            </Link>
          )}
          <span>
            {index + 1} of {classmates.length}
          </span>
          {next && (
            <Link href={`/portfolio/${next.id}?domain=${selected.id}`}>
              Next →
            </Link>
          )}
        </nav>
      </div>
      <nav className="domain-tabs" aria-label="Learning domains">
        {domains.map((d) => (
          <Link
            key={d.id}
            href={`/portfolio/${id}?domain=${d.id}`}
            aria-current={selected.id === d.id ? "page" : undefined}
          >
            <span className={`domain-badge ${d.id}`}>{d.short}</span>
            {d.label}
          </Link>
        ))}
      </nav>
      <DomainEditor
        key={entry.id}
        entry={entry}
        previousRating={prior?.rating ?? null}
      />
    </Shell>
  );
}
