"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { provisionTeacher } from "@/lib/provision-teacher";

export async function addTeacherAccount(input: unknown) {
  const { db } = await requireViewer(true);
  const result = await provisionTeacher(db,input);
  if (result.ok) { revalidatePath("/admin"); revalidatePath("/"); }
  return result;
}
const commands = ["create_class", "rename_class", "create_student", "assign_students", "remove_students", "archive_students", "restore_students", "assign_teachers", "remove_teachers", "archive_class", "restore_class", "clear_class", "deactivate_teachers", "reactivate_teachers", "set_teacher_classes", "add_teacher_classes"] as const;
const schema = z.object({
  year: z.number().int().min(2020).max(2200),
  class_id: z.uuid().nullable().optional(),
  ids: z.array(z.uuid()).min(1).max(200).optional(),
  class_ids: z.array(z.uuid()).max(200).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  level: z.enum(["PG", "N1", "N2", "K1", "K2"]).optional(),
}).strict();
export type AdminChangeResult = { ok: boolean; message: string; id?: string };
export async function adminChange(command: string, payload: Record<string, unknown>): Promise<AdminChangeResult> {
  const { db } = await requireViewer(true);
  const parsed = schema.safeParse(payload);
  if (!z.enum(commands).safeParse(command).success || !parsed.success) return { ok: false, message: "Check the fields and selections, then try again." };
  const directoryCommand = ["deactivate_teachers", "reactivate_teachers", "set_teacher_classes"].includes(command);
  const { data, error } = command === "add_teacher_classes" ? await db.rpc("add_teacher_classes", { payload: parsed.data }) : await db.rpc(directoryCommand ? "manage_directory" : "manage_class", { command, payload: parsed.data });
  if (error) return { ok: false, message: error.code === "23505" ? "A class with that name already exists in this year." : error.code === "40001" ? "The class membership changed. Reload before trying again." : "Could not save. Check that the class and selected people are still available, then retry." };
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/portfolio/[id]", "page");
  const messages: Record<string, string> = { create_class: "Class created.", rename_class: "Class details saved.", create_student: "Student created.", assign_students: "Student assignments updated for both semesters.", remove_students: "Students moved to Unassigned. Portfolios retained.", archive_students: "Students archived. Membership and portfolios retained.", restore_students: "Students restored.", assign_teachers: "Teachers assigned for the academic year.", remove_teachers: "Teacher access removed for this class.", archive_class: "Class archived. Membership and portfolios retained.", restore_class: "Class restored.", clear_class: "Class grouping cleared. Students and portfolios retained." };
  messages.deactivate_teachers = "Teachers archived. Workspace access blocked; records and assignments retained.";
  messages.reactivate_teachers = "Teachers restored with access to their assigned active classes.";
  messages.add_teacher_classes = "Class access added. Existing assignments kept.";
  messages.set_teacher_classes = "Class access updated for this academic year.";
  if (command === "restore_students") messages.restore_students = parsed.data.class_id ? "Students restored and assigned to the selected class." : "Students restored. Assign a class when ready; historical records are retained.";
  return { ok: true, message: messages[command], id: data?.id ?? undefined };
}
