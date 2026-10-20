export type AdminClass = { id: string; name: string; level: string; academic_year: number; archived_at: string | null };
export type AdminStudent = { id: string; display_name: string; student_code: string; archived_at: string | null };
export type AdminTeacher = { id: string; display_name: string; is_active: boolean; email: string | null; staff_code: string };
export type Membership = { child_id: string; academic_year: number; class_id: string | null; access_enabled: boolean };
export type ClassTeacher = { teacher_id: string; class_id: string };
export type AdminData = { year: number; years: number[]; initialClass?: string; classes: AdminClass[]; allClasses: AdminClass[]; students: AdminStudent[]; teachers: AdminTeacher[]; memberships: Membership[]; allMemberships: Membership[]; assignments: ClassTeacher[] };
