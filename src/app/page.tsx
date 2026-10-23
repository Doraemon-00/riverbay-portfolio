import { ClassWorkspace } from "@/components/class-workspace";
import { requireViewer } from "@/lib/auth";
import { rosterSelect, type RosterItem } from "@/lib/portfolio";
import { Shell } from "@/components/shell";
export const instant = false;
export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string; class?: string }> }) {
  const { db, profile } = await requireViewer();
  const query = await searchParams;
  const results = await Promise.all([
    db.from("enrolments").select(rosterSelect),
    db.from("reporting_periods").select("id,year,semester").order("year", { ascending: false }).order("semester", { ascending: false }),
    db.from("class_memberships").select("child_id,class_id,academic_year,access_enabled"),
    db.from("classes").select("id,name,academic_year").is("archived_at",null).order("name"),
  ]);
  if (results.some(r => r.error)) throw new Error("Could not load your classes. Please try again.");
  const all = (results[0].data as unknown as RosterItem[]).filter(item => item.children && !item.children.archived_at && !item.classes.archived_at && results[2].data!.some(m => m.child_id === item.child_id && m.class_id === item.class_id && m.academic_year === item.reporting_periods.year && m.access_enabled));
  return <Shell profile={profile} framed current="classes"><ClassWorkspace viewerId={profile.id} roster={all} classes={results[3].data!} periods={results[1].data!} initialPeriod={query.period} initialClass={query.class} /></Shell>;
}
