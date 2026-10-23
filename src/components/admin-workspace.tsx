"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminChange } from "@/app/(workspace)/admin/actions";
import type { AdminData } from "@/lib/admin";
import { Icon } from "./icon";
import type { NotifyAdmin } from "./admin-notification";
import { AssignmentFields } from "./assignment-fields";
import { QuickTour } from "./quick-tour";
import { dialogGuide } from "@/lib/quick-tours";
import { useLoaderWait } from "./page-loader";

type Confirmation = { kind: "confirm"; title: string; description: string; command: string; payload: Record<string, unknown> };
type Modal = { kind: "class" | "students" | "student" | "teachers" | "restore" } | Confirmation;

export function Dialog({ title, children, close, pending, tour = "dialog" }: { title: string; children: React.ReactNode; close: () => void; pending: boolean; tour?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="admin-dialog" data-tour-dialog={tour} onCancel={event => { event.preventDefault(); if (!pending) close(); }} aria-labelledby={titleId}>
    <div className="section-heading"><h2 id={titleId}>{title}</h2><div className="dialog-heading-actions">{dialogGuide(tour) && <QuickTour inline disabled={pending} />}<button type="button" className="icon-button" aria-label="Close dialog" disabled={pending} onClick={close}><Icon name="x" /></button></div></div>
    <div className="admin-dialog-content">{children}</div>
  </dialog>;
}

export function AdminWorkspace({ data, notify, sectionNav }: { data: AdminData; notify: NotifyAdmin; sectionNav?: React.ReactNode }) {
  const router = useRouter();
  const detailRef = useRef<HTMLElement>(null);
  const [detailFloor, setDetailFloor] = useState(0);
  function preserveView() {
    // Keep enough content below the viewport when a shorter section replaces a roster.
    const detail = detailRef.current;
    if (detail) setDetailFloor(Math.max(0, window.innerHeight - detail.getBoundingClientRect().top));
  }
  const [selectedClass, setSelectedClass] = useState(data.initialClass ?? data.classes.find(c => !c.archived_at)?.id ?? "unassigned");
  const [tab, setTab] = useState<"students" | "teachers" | "settings">("students");
  const [showArchivedClasses, setShowArchivedClasses] = useState(false);
  const [studentStatus, setStudentStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [modal, setModal] = useState<Modal | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerScope, setPickerScope] = useState("unassigned");
  const [picked, setPicked] = useState<string[]>([]);
  const [moveTo, setMoveTo] = useState("");
  const [restoreYear, setRestoreYear] = useState(new Date().getFullYear());
  const [restoreClass, setRestoreClass] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  // Changing the academic year reloads the page; a transition reports that wait to the loader.
  const [yearLoading, startYearLoad] = useTransition();
  const [yearLabel, setYearLabel] = useState("");
  useLoaderWait(yearLoading, yearLabel);
  const current = data.classes.find(c => c.id === selectedClass);
  const classId = current?.id ?? null;
  const belongs = (id: string, target: string | null) => { const m = data.memberships.find(m => m.child_id === id); return target ? m?.class_id === target && m.access_enabled : !m?.class_id || !m.access_enabled || !data.classes.some(c => c.id === m.class_id && !c.archived_at); };
  const inClass = (id: string) => belongs(id, classId);
  const count = (id: string | null) => data.students.filter(s => !s.archived_at && belongs(s.id, id)).length;
  const members = data.students.filter(s => inClass(s.id) && (studentStatus === "archived" ? !!s.archived_at : !s.archived_at) && `${s.display_name} ${s.student_code}`.toLowerCase().includes(search.toLowerCase()));
  const staff = data.teachers.filter(t => data.assignments.some(a => a.class_id === classId && a.teacher_id === t.id) && `${t.display_name} ${t.staff_code} ${t.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const rows = tab === "teachers" ? staff : members;
  const visibleClasses = data.classes.filter(c => showArchivedClasses || !c.archived_at);
  const candidates = modal?.kind === "teachers" ? data.teachers.filter(t => t.is_active && !data.assignments.some(a => a.class_id === classId && a.teacher_id === t.id)) : data.students.filter(s => !s.archived_at && !inClass(s.id));
  const filteredCandidates = candidates.filter(p => (pickerIsStudentInScope(p)) && `${p.display_name} ${"student_code" in p ? p.student_code : `${p.staff_code} ${p.email ?? ""}`}`.toLowerCase().includes(pickerSearch.toLowerCase()));
  function pickerIsStudentInScope(person: (typeof candidates)[number]) {
    return !("student_code" in person) || pickerScope === "all" || belongs(person.id, null);
  }
  const activeClasses = data.classes.filter(c => !c.archived_at && c.id !== classId);
  const teacherCount = data.assignments.filter(a => a.class_id === classId).length;
  const base = { year: data.year, class_id: classId };
  function toggle(id: string, selected: string[], update: (ids: string[]) => void) { update(selected.includes(id) ? selected.filter(v => v !== id) : [...selected, id]); }
  // The whole highlighted row ticks its checkbox; its own controls, the checkbox and text selection keep their behaviour.
  function rowToggle(event: React.MouseEvent, id: string) { if (pending || (event.target as Element).closest("button,a,input,label,select,textarea") || window.getSelection()?.toString()) return; toggle(id, selection, setSelection); }
  function choose(id: string) { preserveView(); setSelectedClass(id); setSelection([]); setSearch(""); setTab("students"); setStudentStatus("active"); setMessage(""); setMoveTo(""); }
  function open(value: Modal) {
    if (value.kind === "restore") { const year = data.year; setRestoreYear(year); setRestoreClass(current?.academic_year === year && !current.archived_at ? current.id : ""); }
    setPicked([]); setPickerSearch(""); setPickerScope("unassigned"); setMessage(""); setFailed(false); setModal(value);
  }
  function run(command: string, payload: Record<string, unknown>) {
    preserveView();
    startTransition(async () => {
      try {
        const result = await adminChange(command, payload);
        setFailed(!result.ok); setMessage(result.message);
        if (result.ok) {
          setModal(null); setSelection([]); setPicked([]); setMoveTo("");
          if (command === "create_class") { router.push(`/admin?year=${payload.year}&class=${result.id}`, { scroll: false }); setSelectedClass(result.id!); setTab("students"); setStudentStatus("active"); setSearch(""); }
          if (command === "create_student") { setTab("students"); setStudentStatus("active"); setSearch(String(payload.name)); }
          const target = command === "archive_students" ? "archived" : command === "restore_students" ? "active" : null;
          notify({ message: result.message, action: command === "archive_class" ? { label: "View archived", run: () => setShowArchivedClasses(true) } : target ? { label: target === "archived" ? "View archived" : "View active", run: () => {
            preserveView();
            const year = command === "restore_students" ? Number(payload.year) : data.year;
            const destination = command === "restore_students" ? String(payload.class_id ?? "unassigned") : classId ?? "unassigned";
            if (year !== data.year) router.push(`/admin?year=${year}&class=${destination}`,{ scroll: false });
            else { setSelectedClass(destination); setTab("students"); setStudentStatus(target); setSelection([]); }
          } } : undefined });
        } else if (!modal) {
          notify({ message: result.message, error: true });
        }
      } catch { const text = "Could not save. Your selection is still here; please retry."; setFailed(true); setMessage(text); if (!modal) notify({ message: text, error: true }); }
    });
  }
  function confirm(title: string, description: string, command: string, payload: Record<string, unknown>) { open({ kind: "confirm", title, description, command, payload }); }
  const pickerIsTeachers = modal?.kind === "teachers";
  const peopleLabel = `${selection.length} ${tab === "teachers" ? (selection.length === 1 ? "teacher" : "teachers") : (selection.length === 1 ? "student" : "students")}`;
  const modalTitle = modal?.kind === "class" ? "Add class" : modal?.kind === "student" ? "Create student" : modal?.kind === "teachers" ? "Add teachers" : modal?.kind === "students" ? "Add students" : modal?.kind === "restore" ? "Restore students" : modal?.kind === "confirm" ? modal.title : "";
  return <div className="admin-workspace" aria-busy={pending}>
    <div className="admin-directory">
      <aside className="class-directory" aria-label="Class directory">
        <label className="compact-label rail-semester"><span className="eyebrow">ACADEMIC YEAR</span><select aria-label="Academic year" value={data.year} disabled={pending} onChange={e => { const year = e.target.value; setYearLabel(`Opening the ${year} classes…`); startYearLoad(() => router.push(`/admin?year=${year}`, { scroll: false })); }}>{data.years.map(y => <option key={y}>{y}</option>)}</select></label>
        <p className="eyebrow">CLASSES · {data.year}</p>
        <label className="mobile-class-picker">Class<select aria-label="Choose class" value={selectedClass} disabled={pending} onChange={e => choose(e.target.value)}>{visibleClasses.map(c => <option key={c.id} value={c.id}>{c.name}{c.archived_at ? " · Archived" : ""}</option>)}<option value="unassigned">Unassigned</option></select></label>
        <nav aria-label="Choose class">{visibleClasses.map(c => <button key={c.id} disabled={pending} aria-current={selectedClass === c.id ? "page" : undefined} onClick={() => choose(c.id)}><Icon name="books" /><span>{c.name}{c.archived_at && <small>Archived</small>}</span><span className="directory-count">{count(c.id)}</span></button>)}
          <button className="unassigned-class" disabled={pending} aria-current={selectedClass === "unassigned" ? "page" : undefined} onClick={() => choose("unassigned")}><Icon name="users-three" /><span>Unassigned</span><span className="directory-count">{count(null)}</span></button></nav>
        {!data.classes.length && <p className="hint">No classes yet. Add the first class for {data.year}.</p>}
        <button className="secondary rail-add-class" disabled={pending} onClick={() => open({ kind: "class" })}><Icon name="books" />Add class</button>
        <label className="check-label directory-archive-toggle"><input type="checkbox" checked={showArchivedClasses} onChange={e => { setShowArchivedClasses(e.target.checked); if (!e.target.checked && current?.archived_at) choose("unassigned"); }} />Show archived classes</label>
      </aside>
      <section ref={detailRef} className="class-detail" style={{ minHeight: detailFloor }} aria-labelledby="class-detail-title">
        {sectionNav}
        <header className="class-detail-heading"><h2 id="class-detail-title">{current ? `${current.name} · ${data.year}` : `Unassigned students · ${data.year}`}</h2><p>{count(classId)} active {count(classId) === 1 ? "student" : "students"}{current && ` · ${teacherCount} ${teacherCount === 1 ? "teacher" : "teachers"}`} · {data.year}{current?.archived_at && " · Archived class"}</p></header>
        {current && <nav className="admin-tabs" aria-label="Class sections"><span className="admin-tab-options">{(["students", "teachers", "settings"] as const).map(value => <button key={value} data-tour-tab={value} disabled={pending} aria-current={tab === value ? "page" : undefined} onClick={() => { preserveView(); setTab(value); setSelection([]); setSearch(""); setMessage(""); }}>{value[0].toUpperCase() + value.slice(1)}</button>)}</span></nav>}
        {tab !== "settings" ? <>
          {current?.archived_at && <p className="hint">This class is archived. Saved portfolios are retained; teachers cannot access this class until it is restored.</p>}
          <div className="directory-toolbar"><label className="search-field"><Icon name="magnifying-glass" /><span className="sr-only">Search {tab}</span><input type="search" placeholder={`Search ${tab}${tab === "students" ? " by name or ID" : " by name, staff ID or email"}`} value={search} onChange={e => { preserveView(); setSearch(e.target.value); }} /></label>
            {tab === "students" && <label className="compact-label"><span className="sr-only">Student status</span><select aria-label="Student status" value={studentStatus} onChange={e => { preserveView(); setStudentStatus(e.target.value); setSelection([]); }}><option value="active">Active students</option><option value="archived">Archived students</option></select></label>}
            <button className="primary" disabled={pending || !!current?.archived_at} onClick={() => open({ kind: tab === "teachers" ? "teachers" : current ? "students" : "student" })}><Icon name="users-three" />{tab === "teachers" ? "Add teachers" : current ? "Add students" : "Create student"}</button>
          </div>
          {selection.length > 0 && <div className="bulk-toolbar" aria-label="Selected people actions"><strong>{selection.length} selected</strong>
            {tab === "students" ? studentStatus === "archived" ? <button disabled={pending} className="text-action" onClick={() => open({ kind: "restore" })}><Icon name="check-circle" />Restore students</button> : <>
              <label className="compact-label"><span className="sr-only">Move selected students to</span><select aria-label="Move selected students to" value={moveTo} disabled={pending} onChange={e => setMoveTo(e.target.value)}><option value="">Move to class…</option>{activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <button className="text-action" disabled={pending || !moveTo} onClick={() => confirm(`Move ${peopleLabel}?`, `Move their ${data.year} membership and both semester workspaces to the selected class. Saved content is retained.`, "assign_students", { year: data.year, class_id: moveTo, ids: selection })}><Icon name="arrow-right" />Move</button>
              {current && <button className="text-action" disabled={pending} onClick={() => confirm(`Remove ${peopleLabel} from ${current.name}?`, "They will appear in Unassigned. Their portfolios remain stored, and class teachers lose access until they are assigned again.", "remove_students", { ...base, ids: selection })}>Remove from class</button>}
              <button className="text-action danger" disabled={pending} onClick={() => confirm(`Archive ${peopleLabel}?`, "Archiving hides them across active classes and removes teacher access. Their membership and portfolio history are retained. Use Archived students to restore them.", "archive_students", { ...base, ids: selection })}>Archive</button>
            </> : <button className="text-action danger" disabled={pending} onClick={() => confirm(`Remove ${peopleLabel}?`, "Their access to this class ends for both semesters of the selected year. Other class assignments and their accounts are unchanged. Student portfolios are retained.", "remove_teachers", { ...base, ids: selection })}>Remove class access</button>}
            <button className="text-action" disabled={pending} onClick={() => setSelection([])}>Clear selection</button>
          </div>}
          <div className="directory-table-scroll"><table className="directory-table"><thead><tr><th className="selection-column"><label className="checkbox-hit"><input aria-label={`Select all visible ${tab}`} type="checkbox" disabled={pending || !rows.length} checked={rows.length > 0 && rows.every(r => selection.includes(r.id))} onChange={e => setSelection(e.target.checked ? [...new Set([...selection, ...rows.map(r => r.id)])] : selection.filter(id => !rows.some(r => r.id === id)))} /></label></th><th scope="col">{tab === "teachers" ? "Teacher" : "Student"}</th><th scope="col">{tab === "teachers" ? "Access" : "Status"}</th></tr></thead><tbody>{rows.map(person => <tr key={person.id} className={`selectable-row${selection.includes(person.id) ? " is-selected" : ""}`} onClick={e => rowToggle(e, person.id)}><td><label className="checkbox-hit"><input type="checkbox" aria-label={`Select ${person.display_name}`} disabled={pending} checked={selection.includes(person.id)} onChange={() => toggle(person.id, selection, setSelection)} /></label></td><th scope="row">{person.display_name}<small className="person-reference">{"student_code" in person ? person.student_code : person.staff_code}</small>{"email" in person && person.email && <small className="person-reference">{person.email}</small>}</th><td>{tab === "teachers" ? ("is_active" in person && !person.is_active ? "Archived · Access blocked" : "All domains · Both semesters") : studentStatus === "archived" ? "Archived" : "Active"}</td></tr>)}</tbody></table></div>
          {!rows.length && <div className="directory-empty"><h3>{search ? "No matching names" : tab === "teachers" ? "No teachers assigned" : studentStatus === "archived" ? "No archived students here" : "No students here yet"}</h3><p className="hint">{search ? "Try another name, ID or email, or clear your search." : tab === "teachers" ? "Add teachers to give them access for the academic year." : "Add students or choose another class."}</p></div>}
          <p className="hint directory-footnote">{tab === "teachers" ? "Class access covers all four domains and both semesters. Archive or restore whole accounts in Administration → Teachers." : "Class membership covers the academic year. Teachers choose a semester in their portfolio workspace."}</p>
        </> : current && <div className="class-settings" key={current.id}>
          <form data-tour="class-rename" onSubmit={event => { event.preventDefault(); const f = new FormData(event.currentTarget); run("rename_class", { ...base, name: f.get("name"), level: f.get("level") }); }}><h3>Class details</h3><div className="settings-fields"><label>Level<select name="level" defaultValue={current.level}>{["PG","N1","N2","K1","K2"].map(l => <option key={l}>{l}</option>)}</select></label><label>Class name<input name="name" defaultValue={current.name.replace(new RegExp(`^${current.level}\\s+`), "")} required maxLength={60} /></label></div><button disabled={pending} className="primary">Save class details</button></form>
          <section className="settings-section" data-tour="class-archive"><h3>{current.archived_at ? "Restore class" : "Archive class"}</h3><p className="hint">Keep students, teachers and saved portfolios. Archived classes are hidden from teacher workspaces.</p><button className="secondary" disabled={pending} onClick={() => current.archived_at ? run("restore_class", base) : confirm(`Archive ${current.name}?`, "The class will be hidden from teachers. Its membership and portfolios are retained, and you can restore it from Show archived classes.", "archive_class", base)}>{current.archived_at ? "Restore class" : "Archive class"}</button></section>
          <section className="settings-section" data-tour="class-clear"><h3>Clear class grouping</h3><p className="hint">Move students to Unassigned and remove teacher assignments. The class and all student portfolios remain.</p><button className="secondary danger" disabled={pending} onClick={() => confirm(`Clear ${current.name}?`, "All its students move to Unassigned and all its teachers lose access. The class, student records and saved portfolio content remain. Assignments must be added again manually.", "clear_class", base)}>Clear grouping</button></section>
        </div>}
      </section>
    </div>
    {modal && <Dialog key={modal.kind} tour={modal.kind === "class" ? "class-create" : modal.kind === "student" ? "student-create" : modal.kind === "students" ? "assign-students" : modal.kind === "teachers" ? "assign-teachers" : modal.kind === "restore" ? "restore-students" : "confirm"} title={modalTitle} pending={pending} close={() => { setModal(null); if (failed) setMessage(""); }}>
      {message && <p role={failed ? "alert" : "status"} className={failed ? "error" : "success"}>{message}</p>}
      {modal.kind === "restore" ? <><p className="hint">Keep their student IDs and portfolio history. Choose a class to resume teacher access, or leave them unassigned for now.</p><AssignmentFields year={restoreYear} years={data.years} classes={data.allClasses.filter(c => c.academic_year === restoreYear && !c.archived_at)} classId={restoreClass} pending={pending} setYear={setRestoreYear} setClassId={setRestoreClass} /><div className="dialog-actions"><button className="secondary" disabled={pending} onClick={() => setModal(null)}>Cancel</button><button className="primary" disabled={pending} onClick={() => run("restore_students", { year: restoreYear, class_id: restoreClass || null, ids: selection })}>{pending ? "Saving…" : restoreClass ? "Restore & assign" : "Restore unassigned"}</button></div></> : modal.kind === "confirm" ? <><p>{modal.description}</p><div className="dialog-actions"><button className="secondary" disabled={pending} onClick={() => setModal(null)}>Cancel</button><button className="primary" disabled={pending} onClick={() => run(modal.command, modal.payload)}>{pending ? "Saving…" : modal.command === "clear_class" ? "Clear grouping" : modal.command.startsWith("archive") ? "Archive" : modal.command.startsWith("remove") ? "Remove" : modal.command === "assign_students" ? "Move students" : "Confirm"}</button></div></> : modal.kind === "class" || modal.kind === "student" ? <form onSubmit={event => { event.preventDefault(); const f = new FormData(event.currentTarget); run(modal.kind === "class" ? "create_class" : "create_student", modal.kind === "class" ? { year: Number(f.get("year")), level: f.get("level"), name: f.get("name") } : { ...base, name: f.get("name") }); }}><fieldset disabled={pending} className="editor-fields">
        {modal.kind === "class" && <div className="settings-fields"><label>Academic year<input type="number" name="year" required min={2020} max={2200} defaultValue={data.year} /></label><label>Level<select name="level" defaultValue="K1">{["PG","N1","N2","K1","K2"].map(l => <option key={l}>{l}</option>)}</select></label></div>}
        <label>{modal.kind === "class" ? "Class name" : "Student name"}<input name="name" required maxLength={modal.kind === "class" ? 60 : 100} placeholder={modal.kind === "class" ? "Bear" : "Full name"} /></label>
        <p className="hint">{modal.kind === "class" ? "Students and teachers can be assigned after creating the class." : `Creates a student in ${current?.name ?? "Unassigned"} for ${data.year}.`}</p>
        <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setModal(null)}>Cancel</button><button className="primary">{pending ? "Saving…" : modal.kind === "class" ? "Create class" : "Create student"}</button></div></fieldset></form> : <>
        <p className="hint">{pickerIsTeachers ? `Assign teachers to ${current?.name} for both semesters of ${data.year}.` : `Select existing students for ${current?.name}. Students already in another ${data.year} class will move here; their saved portfolio content is retained.`}</p>
        {!pickerIsTeachers && <button className="text-action" disabled={pending} onClick={() => open({ kind: "student" })}>Create a new student instead</button>}
        <label className="search-field picker-search"><Icon name="magnifying-glass" /><span className="sr-only">Search available people</span><input type="search" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder={pickerIsTeachers ? "Search by name, staff ID or email" : "Search by name or student ID"} /></label>
        {!pickerIsTeachers && <label className="compact-label">Student source<select aria-label="Student source" value={pickerScope} disabled={pending} onChange={e => setPickerScope(e.target.value)}><option value="unassigned">Unassigned</option><option value="all">All active students</option></select></label>}
        <label className="check-label picker-select-all"><input type="checkbox" disabled={pending || !filteredCandidates.length} checked={filteredCandidates.length > 0 && filteredCandidates.every(p => picked.includes(p.id))} onChange={e => setPicked(e.target.checked ? [...new Set([...picked, ...filteredCandidates.map(p => p.id)])] : picked.filter(id => !filteredCandidates.some(p => p.id === id)))} />Select all shown</label>
        <div className="people-picker">{filteredCandidates.map(person => { const membership = data.memberships.find(m => m.child_id === person.id && m.access_enabled); const from = membership && data.classes.find(c => c.id === membership.class_id && !c.archived_at); return <label key={person.id} className={`picker-row ${picked.includes(person.id) ? "is-selected" : ""}`}><input type="checkbox" checked={picked.includes(person.id)} disabled={pending} onChange={() => toggle(person.id, picked, setPicked)} /><span>{person.display_name}<small>{"student_code" in person ? person.student_code : person.staff_code}</small>{"email" in person && person.email && <small>{person.email}</small>}{!pickerIsTeachers && <small>{from ? `Move from ${from.name} · ${data.year}` : "Not assigned in this year"}</small>}</span></label>; })}{!filteredCandidates.length && <p className="hint">{pickerIsTeachers ? "No available matches." : pickerScope === "unassigned" ? "No unassigned matches. Choose All active students to move students from another class." : "No available matches."}</p>}</div>
        <div className="dialog-actions"><span className="hint">{picked.length} selected{picked.some(id => !filteredCandidates.some(p => p.id === id)) && " (including hidden selections)"}</span><button className="secondary" disabled={pending} onClick={() => setModal(null)}>Cancel</button><button className="primary" disabled={pending || !picked.length} onClick={() => run(pickerIsTeachers ? "assign_teachers" : "assign_students", { ...base, ids: picked })}>{pending ? "Saving…" : `Add ${picked.length} ${pickerIsTeachers ? picked.length === 1 ? "teacher" : "teachers" : picked.length === 1 ? "student" : "students"}`}</button></div>
      </>}
    </Dialog>}
  </div>;
}
