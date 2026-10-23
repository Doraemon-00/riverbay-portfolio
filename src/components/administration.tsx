"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { addTeacherAccount, adminChange } from "@/app/(workspace)/admin/actions";
import type { AdminData, AdminStudent, AdminTeacher } from "@/lib/admin";
import { AdminWorkspace, Dialog } from "./admin-workspace";
import { Icon } from "./icon";
import { AdminNotification, type AdminNotice, type NotifyAdmin } from "./admin-notification";
import { AssignmentFields } from "./assignment-fields";

type Section = "classes" | "students" | "teachers";
type People = "students" | "teachers";
type Sheet = { kind: "create" | "assign" | "restore" | "teacher-classes" | "bulk-teacher-classes"; ids: string[] }
  | { kind: "confirm"; ids: string[]; title: string; description: string; command: string; action: string };

export function Administration({ data }: { data: AdminData }) {
  const [section, setSection] = useState<Section>("classes");
  const [notice, setNotice] = useState<(AdminNotice & { id: string }) | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const notify = (source: Section): NotifyAdmin => value => setNotice({ ...value, id: crypto.randomUUID(), action: value.action ? { label: value.action.label, run: () => { setSection(source); value.action!.run(); } } : undefined });
  const root = useRef<HTMLDivElement>(null);
  const [floor, setFloor] = useState(0);
  // The sections are the page's own tabs: a row at the top of the content, under the top bar.
  const sectionNav = <nav className="administration-nav" aria-label="Administration sections">
      <span className="administration-nav-options">
      {(["classes", "students", "teachers"] as const).map(value => <button key={value} aria-current={section === value ? "page" : undefined} aria-controls={`admin-${value}`} onClick={() => {
        if (root.current) setFloor(Math.max(0, window.innerHeight - root.current.getBoundingClientRect().top));
        setSection(value);
      }}><Icon name={value === "classes" ? "books" : "users-three"} />{value[0].toUpperCase() + value.slice(1)}</button>)}
      </span>
    </nav>;
  return <div ref={root} data-tour-page="administration" data-tour-key={section} style={{ minHeight: floor }}>
    <h1 className="sr-only">Administration</h1>
    <div id="admin-classes" hidden={section !== "classes"}><AdminWorkspace key={data.year} data={data} notify={notify("classes")} sectionNav={sectionNav} /></div>
    {(["students", "teachers"] as const).map(kind => <div key={kind} id={`admin-${kind}`} hidden={section !== kind} className="admin-directory">
      <aside className="class-directory" aria-hidden="true" />
      <div className="class-detail">{sectionNav}<PeopleDirectory kind={kind} data={data} notify={notify(kind)} /></div>
    </div>)}
    {notice && <AdminNotification key={notice.id} notice={notice} dismiss={dismissNotice} />}
  </div>;
}

function PeopleDirectory({ kind, data, notify }: { kind: People; data: AdminData; notify: NotifyAdmin }) {
  const students = kind === "students";
  const people: (AdminStudent | AdminTeacher)[] = students ? data.students : data.teachers;
  const currentYear = new Date().getFullYear();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [filterYear, setFilterYear] = useState(currentYear);
  const [classFilter, setClassFilter] = useState("all");
  const [selection, setSelection] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [year, setYear] = useState(currentYear);
  const [classId, setClassId] = useState("");
  const [pickedClasses, setPickedClasses] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLElement>(null);
  const [floor, setFloor] = useState(0);
  const inactive = (person: AdminStudent | AdminTeacher) => "archived_at" in person ? !!person.archived_at : !person.is_active;
  const matches = (person: AdminStudent | AdminTeacher) => `${person.display_name} ${"student_code" in person ? person.student_code : `${person.email ?? ""} ${person.staff_code}`}`.toLowerCase().includes(search.trim().toLowerCase());
  function assignedClass(person: AdminStudent) {
    if (person.archived_at) return undefined;
    const membership = data.allMemberships.find(m => m.child_id === person.id && m.academic_year === filterYear && m.access_enabled && m.class_id);
    return membership && data.allClasses.find(c => c.id === membership.class_id && !c.archived_at);
  }
  const filterClasses = data.allClasses.filter(c => c.academic_year === filterYear && !c.archived_at);
  const classMatches = (person: AdminStudent | AdminTeacher) => !students || classFilter === "all" || ("student_code" in person && (classFilter === "unassigned" ? !assignedClass(person) : assignedClass(person)?.id === classFilter));
  const rows = people.filter(person => classMatches(person) && (status === "all" || inactive(person) === (status === "inactive")) && matches(person));
  const chosen = people.filter(person => selection.includes(person.id));
  const allActive = chosen.length > 0 && chosen.every(person => !inactive(person));
  const allInactive = chosen.length > 0 && chosen.every(inactive);
  const years = [...new Set([...data.years, ...data.allClasses.map(c => c.academic_year), currentYear])].sort((a,b) => b-a);
  const availableClasses = data.allClasses.filter(c => c.academic_year === year && !c.archived_at);
  const matchingClasses = availableClasses.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  const savedClasses = sheet?.kind === "teacher-classes" ? teacherClasses(sheet.ids[0],year) : [];
  const classChanges = sheet?.kind === "teacher-classes" && (savedClasses.length !== pickedClasses.length || savedClasses.some(id => !pickedClasses.includes(id)));
  function preserveView() { if (root.current) setFloor(Math.max(0, window.innerHeight - root.current.getBoundingClientRect().top)); }
  function toggle(id: string, list: string[], update: (value: string[]) => void) { update(list.includes(id) ? list.filter(v => v !== id) : [...list, id]); }
  // The whole highlighted row ticks its checkbox; its own controls, the checkbox and text selection keep their behaviour.
  function rowToggle(event: React.MouseEvent, id: string) { if (pending || (event.target as Element).closest("button,a,input,label,select,textarea") || window.getSelection()?.toString()) return; toggle(id, selection, setSelection); }
  function teacherClasses(teacherId: string, targetYear: number) { return data.assignments.filter(a => a.teacher_id === teacherId && data.allClasses.some(c => c.id === a.class_id && c.academic_year === targetYear && !c.archived_at)).map(a => a.class_id); }
  function open(value: Sheet) {
    setYear(students ? filterYear : currentYear); setClassId(""); setClassSearch("");
    setPickedClasses(value.kind === "teacher-classes" ? teacherClasses(value.ids[0], currentYear) : []);
    setMessage(""); setFailed(false); setSheet(value);
  }
  function run(command: string, payload: Record<string, unknown>) {
    preserveView();
    startTransition(async () => {
      try {
        const result = await adminChange(command, payload);
        setMessage(result.message); setFailed(!result.ok);
        if (result.ok) {
          setSheet(null); setSelection([]);
          if (command === "create_student") { setStatus("active"); setClassFilter("all"); setFilterYear(Number(payload.year)); setSearch(String(payload.name)); }
          const count = Array.isArray(payload.ids) ? payload.ids.length : 1;
          const outcomes: Record<string, { message: string; target: string; label: string }> = {
            archive_students: { message: `${count} student${count === 1 ? "" : "s"} archived.`, target: "inactive", label: "View archived" },
            restore_students: { message: `${count} student${count === 1 ? "" : "s"} restored${payload.class_id ? " and assigned" : " unassigned"}.`, target: "active", label: "View active" },
            deactivate_teachers: { message: `${count} teacher${count === 1 ? "" : "s"} archived.`, target: "inactive", label: "View archived" },
            reactivate_teachers: { message: `${count} teacher${count === 1 ? "" : "s"} restored.`, target: "active", label: "View active" },
          };
          const outcome = outcomes[command];
          notify({ message: outcome?.message ?? result.message, action: outcome ? { label: outcome.label, run: () => { preserveView(); setStatus(outcome.target); setClassFilter("all"); if (students) setFilterYear(Number(payload.year)); setSelection([]); } } : undefined });
        } else if (!sheet) {
          notify({ message: result.message, error: true });
        }
      } catch { const text = "Could not save. Your selection is still here; please retry."; setFailed(true); setMessage(text); if (!sheet) notify({ message: text, error: true }); }
    });
  }
  function createTeacher(form: FormData) {
    preserveView();
    startTransition(async () => {
      try {
        const result = await addTeacherAccount({ name: form.get("name"), email: form.get("email"), year, class_ids: pickedClasses });
        if (!result.ok || !result.email || !result.initialPassword) { setFailed(true); setMessage(result.message); return; }
        setSheet(null); setSelection([]); setStatus("active"); setSearch(result.email);
        setMessage(""); setFailed(false); setCopied(false); setCopyError(""); setShowPassword(false);
        setCredentials({ email: result.email, password: result.initialPassword });
      } catch { setFailed(true); setMessage("Could not complete setup. Check the teacher list before retrying, in case the request completed."); }
    });
  }
  function finishCredentials() { setCredentials(null); setShowPassword(false); setCopied(false); setCopyError(""); notify({ message: "Teacher added." }); }
  function confirm(ids: string[], action: "archive" | "deactivate" | "reactivate") {
    const noun = students ? "student" : "teacher";
    open({ kind: "confirm", ids, title: `${action === "reactivate" ? "Restore" : "Archive"} ${ids.length} ${noun}${ids.length === 1 ? "" : "s"}?`,
      description: action === "archive" ? "Hide these students from active workspaces and end teacher access. Their IDs, history and saved portfolios are retained. Restore them from All students → Archived."
        : action === "deactivate" ? "They will not be able to sign in to the workspace or access portfolios, including through existing sessions. Their class assignments and past contributions are retained."
        : "Restore access to their assigned active classes. Review their class assignments before restoring if their responsibilities have changed.",
      command: action === "archive" ? "archive_students" : `${action}_teachers`, action: action === "reactivate" ? "Restore" : "Archive" });
  }
  function studentClass(person: AdminStudent) {
    const memberships = data.allMemberships.filter(m => m.child_id === person.id).sort((a,b) => b.academic_year-a.academic_year);
    const activeClass = assignedClass(person);
    if (activeClass) return <>{activeClass.name}<small className="person-reference">{filterYear}</small></>;
    const last = memberships.find(m => m.class_id), historical = last && data.allClasses.find(c => c.id === last.class_id);
    return <>{`No class assigned · ${filterYear}`}{historical && <small className="person-reference">Previously {historical.name} · {last!.academic_year}</small>}</>;
  }
  const title = students ? "All students" : "All teachers";
  const sheetTitle = !sheet ? "" : sheet.kind === "confirm" ? sheet.title : sheet.kind === "create" ? students ? "Add student" : "Add teacher" : sheet.kind === "restore" ? "Restore students" : sheet.kind === "assign" ? "Assign students to class" : sheet.kind === "bulk-teacher-classes" ? "Assign classes" : `Class access · ${data.teachers.find(t => t.id === sheet.ids[0])?.display_name}`;
  return <section className="people-directory" ref={root} style={{ minHeight: floor }} aria-label={title} aria-busy={pending}>
    <div className="admin-heading"><div><h2>{title}</h2><p className="hint">{students ? "Find students across the school, including past classes and archived records." : "Manage teacher accounts and class access across the school."}</p></div>
      <button className="primary" disabled={pending} onClick={() => open({ kind: "create", ids: [] })}><Icon name="plus" />Add {students ? "student" : "teacher"}</button>
    </div>
    <div className={`directory-toolbar ${students ? "student-directory-toolbar" : ""}`}><label className="search-field"><Icon name="magnifying-glass" /><span className="sr-only">Search all {kind}</span><input type="search" value={search} placeholder={students ? "Search by name or student ID" : "Search by name, staff ID or email"} onChange={e => { preserveView(); setSearch(e.target.value); }} /></label>
      {students && <>
        <label className="compact-label"><span className="sr-only">Student academic year</span><select aria-label="Student academic year" value={filterYear} onChange={e => { preserveView(); setFilterYear(Number(e.target.value)); setClassFilter("all"); setSelection([]); }}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
        <label className="compact-label"><span className="sr-only">Student class</span><select aria-label="Student class" value={classFilter} onChange={e => { preserveView(); setClassFilter(e.target.value); setSelection([]); }}><option value="all">All classes</option><option value="unassigned">Unassigned</option>{filterClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </>}
      <label className="compact-label"><span className="sr-only">{students ? "Student records" : "Teacher accounts"}</span><select aria-label={students ? "Student records" : "Teacher accounts"} value={status} onChange={e => { preserveView(); setStatus(e.target.value); setSelection([]); }}><option value="active">Active {kind}</option><option value="inactive">Archived {kind}</option><option value="all">All {kind}</option></select></label>
    </div>
    {!!selection.length && <div className="bulk-toolbar" aria-label={`Selected ${kind} actions`}><strong>{selection.length} selected</strong>
      {students ? <><button className="text-action" disabled={pending || !allActive} onClick={() => open({ kind: "assign", ids: selection })}>Assign to class</button><button className="text-action danger" disabled={pending || !allActive} onClick={() => confirm(selection,"archive")}>Archive</button><button className="text-action" disabled={pending || !allInactive} onClick={() => open({ kind: "restore", ids: selection })}><Icon name="check-circle" />Restore</button></>
        : <><button className="text-action" disabled={pending || !allActive} onClick={() => open({ kind: "bulk-teacher-classes", ids: selection })}>Assign classes</button><button className="text-action danger" disabled={pending || !allActive} onClick={() => confirm(selection,"deactivate")}>Archive</button><button className="text-action" disabled={pending || !allInactive} onClick={() => confirm(selection,"reactivate")}>Restore</button></>}
      <button className="text-action" disabled={pending} onClick={() => setSelection([])}>Clear selection</button>
    </div>}
    <div className="directory-table-scroll"><table className="directory-table people-table"><thead><tr><th className="selection-column"><label className="checkbox-hit"><input type="checkbox" aria-label={`Select all visible ${kind}`} checked={rows.length > 0 && rows.every(p => selection.includes(p.id))} disabled={pending || !rows.length} onChange={e => setSelection(e.target.checked ? [...new Set([...selection,...rows.map(p => p.id)])] : selection.filter(id => !rows.some(p => p.id === id)))} /></label></th><th scope="col">{students ? "Student" : "Teacher"}</th><th scope="col">{students ? `Class · ${currentYear}` : "Class access"}</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{rows.map(person => <tr key={person.id} className={`selectable-row${selection.includes(person.id) ? " is-selected" : ""}`} onClick={e => rowToggle(e, person.id)}><td><label className="checkbox-hit"><input type="checkbox" aria-label={`Select ${person.display_name}`} checked={selection.includes(person.id)} disabled={pending} onChange={() => toggle(person.id,selection,setSelection)} /></label></td>
        <th scope="row">{person.display_name}<small className="person-reference">{"student_code" in person ? person.student_code : <>{person.staff_code}{person.email && <span className="person-reference">{person.email}</span>}</>}</small><small className="mobile-person-summary">{inactive(person) ? "Archived" : "Active"}{"student_code" in person ? <span>{studentClass(person)}</span> : <span>{data.assignments.filter(a => a.teacher_id === person.id && data.allClasses.some(c => c.id === a.class_id && !c.archived_at)).length} assigned classes</span>}</small></th>
        <td>{"student_code" in person ? studentClass(person) : <div className="assignment-list">{data.assignments.filter(a => a.teacher_id === person.id && data.allClasses.some(c => c.id === a.class_id && !c.archived_at)).map(a => { const c = data.allClasses.find(c => c.id === a.class_id)!; return <span key={a.class_id}>{c.name} · {c.academic_year}</span>; })}{!data.assignments.some(a => a.teacher_id === person.id && data.allClasses.some(c => c.id === a.class_id && !c.archived_at)) && "No active classes"}</div>}</td>
        <td><span className={`status ${inactive(person) ? "" : "started"}`}>{inactive(person) ? "Archived" : "Active"}</span></td>
        <td>{students ? inactive(person) ? <button className="text-action" disabled={pending} onClick={() => open({ kind: "restore", ids: [person.id] })}>Restore<span className="sr-only"> {person.display_name}</span></button> : <button className="text-action" disabled={pending} onClick={() => open({ kind: "assign", ids: [person.id] })}>Assign class<span className="sr-only"> for {person.display_name}</span></button> : <button className="text-action" disabled={pending} onClick={() => open({ kind: "teacher-classes", ids: [person.id] })}>Manage classes<span className="sr-only"> for {person.display_name}</span></button>}</td>
      </tr>)}</tbody></table></div>
    {!rows.length && <div className="directory-empty"><h3>{search ? "No matching names" : students && status === "inactive" ? "No archived students" : !students && status === "inactive" ? "No archived teachers" : students && classFilter === "unassigned" ? "No unassigned students" : `No ${kind} here yet`}</h3><p className="hint">{search ? `Try a different ${students ? "name or student ID" : "name, staff ID or email"}, or choose All ${kind}.` : students ? "Try another class, year or status filter." : "Change the status filter to see other records."}</p></div>}
    <p className="hint directory-footnote">{students ? "Student IDs stay the same across classes and years. Archived students remain searchable here." : "Archived teachers cannot sign in to the workspace or access portfolios. All demo accounts use the shared password; email invitations and password resets are not connected."}</p>
    {sheet && <Dialog tour={sheet.kind === "confirm" ? "confirm" : sheet.kind === "create" ? students ? "student-create" : "teacher-create" : sheet.kind === "restore" ? "restore-students" : sheet.kind === "teacher-classes" ? "teacher-access" : sheet.kind === "bulk-teacher-classes" ? "teacher-bulk" : "assign-students"} title={sheetTitle} pending={pending} close={() => { setSheet(null); if (failed) setMessage(""); }}>
      {message && failed && <p className="error" role="alert">{message}</p>}
      {sheet.kind === "confirm" ? <><p>{sheet.description}</p><div className="dialog-actions"><button className="secondary" disabled={pending} onClick={() => setSheet(null)}>Cancel</button><button className="primary" disabled={pending} onClick={() => run(sheet.command,{ year, ids: sheet.ids })}>{pending ? "Saving…" : sheet.action}</button></div></>
        : sheet.kind === "create" && !students ? <form onSubmit={event => { event.preventDefault(); createTeacher(new FormData(event.currentTarget)); }}><fieldset className="editor-fields" disabled={pending}>
          <label>Teacher name<input name="name" required maxLength={100} autoComplete="off" placeholder="Full name" /></label>
          <label>Email<input name="email" type="email" required maxLength={254} autoComplete="off" placeholder="teacher@riverbay.com" /></label>
          <p className="hint">Creates a sign-in account using the shared demo password. No email is sent.</p>
          <details className="optional-assignments"><summary>Assign classes (optional)</summary>
            <label data-tour="assignment-year">Academic year<select value={year} onChange={e => { setYear(Number(e.target.value)); setPickedClasses([]); setClassSearch(""); }}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
            <label className="search-field picker-search"><Icon name="magnifying-glass" /><span className="sr-only">Search classes</span><input type="search" value={classSearch} placeholder="Search classes" onChange={e => setClassSearch(e.target.value)} /></label>
            <div className="people-picker">{matchingClasses.map(c => <label className={`picker-row ${pickedClasses.includes(c.id) ? "is-selected" : ""}`} key={c.id}><input type="checkbox" checked={pickedClasses.includes(c.id)} onChange={() => toggle(c.id,pickedClasses,setPickedClasses)} /><span>{c.name}<small>{c.academic_year} · Both semesters</small></span></label>)}{!matchingClasses.length && <p className="hint">No matching active classes in this year.</p>}</div>
            <p className="hint">{pickedClasses.length ? `${pickedClasses.length} classes selected.` : "You can assign classes later from Manage classes."}</p>
          </details>
          <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setSheet(null)}>Cancel</button><button className="primary">{pending ? "Adding…" : "Add teacher"}</button></div>
        </fieldset></form>
        : sheet.kind === "create" ? <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); run("create_student",{ year, class_id: classId || null, name: form.get("name") }); }}><fieldset className="editor-fields" disabled={pending}>
          <label>Student name<input name="name" required maxLength={100} placeholder="Full name" /></label><p className="hint">A permanent student ID is assigned automatically.</p><AssignmentFields year={year} years={years} classes={availableClasses} classId={classId} pending={pending} setYear={setYear} setClassId={setClassId} />
          <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setSheet(null)}>Cancel</button><button className="primary">{pending ? "Saving…" : "Add student"}</button></div></fieldset></form>
        : (sheet.kind === "teacher-classes" || sheet.kind === "bulk-teacher-classes") ? <>
          <p className="hint">{sheet.kind === "bulk-teacher-classes" ? `Add class access for ${sheet.ids.length} selected teacher${sheet.ids.length === 1 ? "" : "s"}, for both semesters. Existing assignments are kept.` : <>Choose the active classes this teacher can access for both semesters. {data.teachers.find(t => t.id === sheet.ids[0])?.is_active ? "" : "This account stays archived until you restore it."}</>}</p>
          <label data-tour="assignment-year">Academic year<select value={year} disabled={pending || classChanges} onChange={e => { const next = Number(e.target.value); setYear(next); setPickedClasses(sheet.kind === "bulk-teacher-classes" ? [] : teacherClasses(sheet.ids[0],next)); setClassSearch(""); }}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
          {classChanges && <p className="hint">Save or cancel these changes before choosing another year.</p>}
          <label className="search-field picker-search"><Icon name="magnifying-glass" /><span className="sr-only">Search classes</span><input type="search" value={classSearch} placeholder="Search classes" onChange={e => setClassSearch(e.target.value)} /></label>
          <div className="people-picker">{matchingClasses.map(c => <label className={`picker-row ${pickedClasses.includes(c.id) ? "is-selected" : ""}`} key={c.id}><input type="checkbox" checked={pickedClasses.includes(c.id)} disabled={pending} onChange={() => toggle(c.id,pickedClasses,setPickedClasses)} /><span>{c.name}<small>{c.academic_year} · Both semesters</small></span></label>)}{!matchingClasses.length && <p className="hint">{availableClasses.length ? "No matching classes. Try another name." : "No active classes in this year. Add a class in Classes first."}</p>}</div>
          <p className="hint">{sheet.kind === "bulk-teacher-classes" ? "Only checked classes will be added. Existing access will not be removed. Already assigned teachers are skipped." : "Archived class assignments are retained. Unchecking an active class removes access to it."}</p>
          <div className="dialog-actions"><button className="secondary" disabled={pending} onClick={() => setSheet(null)}>Cancel</button><button className="primary" disabled={pending || (sheet.kind === "bulk-teacher-classes" && !pickedClasses.length)} onClick={() => run(sheet.kind === "bulk-teacher-classes" ? "add_teacher_classes" : "set_teacher_classes",{ year, ids: sheet.ids, class_ids: pickedClasses })}>{pending ? "Saving…" : sheet.kind === "bulk-teacher-classes" ? "Assign classes" : "Save class access"}</button></div>
        </> : <>
          <p className="hint">{sheet.kind === "restore" ? "Keep their student IDs and portfolio history. Choose a class to resume teacher access, or leave them unassigned for now." : "Assign these students for both semesters of the selected year. This replaces any existing class assignment in that year; saved portfolio content is retained."}</p>
          <AssignmentFields year={year} years={years} classes={availableClasses} classId={classId} pending={pending} setYear={setYear} setClassId={setClassId} required={sheet.kind === "assign"} />
          <div className="dialog-actions"><span className="hint">{sheet.ids.length} selected</span><button className="secondary" disabled={pending} onClick={() => setSheet(null)}>Cancel</button><button className="primary" disabled={pending || (sheet.kind === "assign" && !classId)} onClick={() => run(sheet.kind === "restore" ? "restore_students" : "assign_students",{ year, class_id: classId || null, ids: sheet.ids })}>{pending ? "Saving…" : sheet.kind === "restore" ? classId ? "Restore & assign" : "Restore unassigned" : "Assign class"}</button></div>
        </>}
    </Dialog>}
    {credentials && <Dialog tour="credentials" title="Teacher added" pending={false} close={finishCredentials}>
      <p className="hint">Save these initial sign-in details now. The password won’t be shown again after closing. No email has been sent.</p>
      <label>Email<input readOnly value={credentials.email} autoComplete="off" /></label>
      <label>Demo password<div className="credential-field"><input readOnly type={showPassword ? "text" : "password"} value={credentials.password} autoComplete="new-password" /><button type="button" className="text-action" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      {copyError && <p className="error" role="alert">{copyError}</p>}
      <div className="dialog-actions"><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`); setCopied(true); setCopyError(""); } catch { setCopyError("Could not copy. Reveal the password and copy the details manually."); } }}>{copied ? "Copied" : "Copy sign-in details"}</button><button className="primary" onClick={finishCredentials}>Done</button></div>
    </Dialog>}
  </section>;

}
