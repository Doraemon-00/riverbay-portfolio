import "server-only";
import type { database } from "./supabase/server";
import { rosterSelect, type RosterItem } from "./portfolio";

export async function loadPortfolioNavigation(db: Awaited<ReturnType<typeof database>>, periodId: string, year: number) {
  const results = await Promise.all([
    db.from("enrolments").select(rosterSelect).eq("period_id", periodId),
    db.from("classes").select("id,name").eq("academic_year", year).is("archived_at", null).order("name"),
    db.from("class_memberships").select("child_id,class_id").eq("academic_year", year).eq("access_enabled", true),
  ]);
  if (results.some(r => r.error)) throw new Error("Could not load class navigation.");
  const students = (results[0].data as unknown as RosterItem[])
    .filter(c => c.children && !c.children.archived_at && !c.classes.archived_at && results[2].data!.some(m => m.child_id === c.child_id && m.class_id === c.class_id))
    .sort((a,b) => a.children.display_name.localeCompare(b.children.display_name));
  const classChoices = results[1].data!.map(c => ({ ...c, portfolioIds: students.filter(s => s.class_id === c.id && s.portfolios).map(s => s.portfolios!.id) }));
  return { students, classChoices };
}
