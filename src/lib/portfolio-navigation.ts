import "server-only";
import type { database } from "./supabase/server";
import { domainReadiness } from "./domain-readiness";
import type { Entry, RosterItem } from "./portfolio";

// The sidebar needs names, classes and a "ready for PDF" count, not every classmate's notes and stories.
const navigationSelect = "id, child_id, class_id, period_id, children(display_name, student_code, archived_at), classes(name, archived_at, academic_year), portfolios(id, domain_entries(rating, narrative))";
export type NavigationItem = Pick<RosterItem, "id" | "child_id" | "class_id" | "period_id" | "children" | "classes"> & {
  portfolios: { id: string; readyCount: number } | null;
};
type NavigationRow = Omit<NavigationItem, "portfolios"> & { portfolios: { id: string; domain_entries: Pick<Entry, "rating" | "narrative">[] } | null };

export async function loadPortfolioNavigation(db: Awaited<ReturnType<typeof database>>, periodId: string, year: number) {
  const results = await Promise.all([
    db.from("enrolments").select(navigationSelect).eq("period_id", periodId),
    db.from("classes").select("id,name").eq("academic_year", year).is("archived_at", null).order("name"),
    db.from("class_memberships").select("child_id,class_id").eq("academic_year", year).eq("access_enabled", true),
  ]);
  if (results.some(r => r.error)) throw new Error("Could not load class navigation.");
  const students: NavigationItem[] = (results[0].data as unknown as NavigationRow[])
    .filter(c => c.children && !c.children.archived_at && !c.classes.archived_at && results[2].data!.some(m => m.child_id === c.child_id && m.class_id === c.class_id))
    .sort((a,b) => a.children.display_name.localeCompare(b.children.display_name))
    .map(({ portfolios, ...c }) => ({ ...c, portfolios: portfolios && {
      id: portfolios.id,
      readyCount: portfolios.domain_entries.filter(e => domainReadiness(e.rating != null, Boolean(e.narrative?.trim())).ready).length,
    } }));
  const classChoices = results[1].data!.map(c => ({ ...c, portfolioIds: students.filter(s => s.class_id === c.id && s.portfolios).map(s => s.portfolios!.id) }));
  return { students, classChoices };
}
