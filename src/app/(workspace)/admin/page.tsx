import { requireViewer } from "@/lib/auth";
import { Administration } from "@/components/administration";
import type { AdminClass, AdminStudent, AdminTeacher, Membership, ClassTeacher } from "@/lib/admin";
export const instant = false;
export default async function Admin({ searchParams }: { searchParams: Promise<{ year?: string; class?: string }> }) {
  const { db } = await requireViewer(true);
  const query = await searchParams;
  const requested = Number(query.year);
  const year = Number.isInteger(requested) && requested >= 2020 && requested <= 2200 ? requested : new Date().getFullYear();
  const results = await Promise.all([
    db.from("classes").select("id,name,level,academic_year,archived_at").order("name"),
    db.from("children").select("id,display_name,student_code,archived_at").order("display_name"),
    db.from("profiles").select("id,display_name,is_active,email,staff_code").eq("role", "teacher").order("display_name"),
    db.from("class_memberships").select("*"),
    db.from("class_teachers").select("*"),
    db.from("reporting_periods").select("year"),
  ]);
  if (results.some(result => result.error)) throw new Error("Could not load class administration. Please retry.");
  const years = [...new Set([year, new Date().getFullYear(), new Date().getFullYear() + 1, ...results[5].data!.map(p => p.year as number)])].sort((a,b) => b-a);
  const allClasses = results[0].data as AdminClass[], allMemberships = results[3].data as Membership[];
  return <Administration data={{ year, years, initialClass: query.class, classes: allClasses.filter(c => c.academic_year === year), allClasses, students: results[1].data as AdminStudent[], teachers: results[2].data as AdminTeacher[], memberships: allMemberships.filter(m => m.academic_year === year), allMemberships, assignments: results[4].data as ClassTeacher[] }} />;
}
