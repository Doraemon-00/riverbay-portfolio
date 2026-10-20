"use client";
import type { AdminClass } from "@/lib/admin";

export function AssignmentFields({ year, years, classes, classId, pending, setYear, setClassId, required = false }: {
  year: number; years: number[]; classes: AdminClass[]; classId: string; pending: boolean;
  setYear: (year: number) => void; setClassId: (id: string) => void; required?: boolean;
}) {
  return <div className="settings-fields"><label>Academic year<select value={year} disabled={pending} onChange={e => { setYear(Number(e.target.value)); setClassId(""); }}>{years.map(y => <option key={y}>{y}</option>)}</select></label><label>Class<select value={classId} required={required} disabled={pending} onChange={e => setClassId(e.target.value)}><option value="">{required ? "Choose a class…" : "Leave unassigned"}</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>;
}
