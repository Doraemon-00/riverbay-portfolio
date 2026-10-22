"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { domains, type RosterItem } from "@/lib/portfolio";
import { readyDomainCount, savedDomainProgress } from "@/lib/domain-readiness";
import { Icon } from "./icon";

type Class = { id: string; name: string; academic_year: number };
type Period = { id: string; year: number; semester: number };

export function ClassWorkspace({ viewerId, roster, classes, periods, initialPeriod, initialClass }: {
  viewerId: string; roster: RosterItem[]; classes: Class[]; periods: Period[]; initialPeriod?: string; initialClass?: string;
}) {
  const statusId = useId();
  const availablePeriods = periods.filter(p => classes.some(c => c.academic_year === p.year));
  const firstPeriod = availablePeriods.find(p => p.id === initialPeriod) ?? availablePeriods[0];
  const [periodId, setPeriodId] = useState(firstPeriod?.id ?? "");
  const period = availablePeriods.find(p => p.id === periodId);
  const yearClasses = classes.filter(c => c.academic_year === period?.year);
  const [classId, setClassId] = useState(yearClasses.find(c => c.id === initialClass)?.id ?? yearClasses[0]?.id ?? "");
  const current = yearClasses.find(c => c.id === classId);
  const [search, setSearch] = useState("");
  const storageKey = `riverbay:roster:${viewerId}:${periodId}:${classId}`;
  const skipSwitchRestore = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [floor, setFloor] = useState(0);
  const children = roster.filter(r => r.class_id === classId && r.period_id === periodId).sort((a,b) => a.children.display_name.localeCompare(b.children.display_name));
  const visible = children.filter(r => `${r.children.display_name} ${r.children.student_code}`.toLowerCase().includes(search.trim().toLowerCase()));
  const ready = children.filter(r => readyDomainCount(r.portfolios?.domain_entries) === domains.length).length;

  useEffect(() => {
    if (skipSwitchRestore.current) { skipSwitchRestore.current = false; return; }
    let second = 0;
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        setSearch(typeof saved?.search === "string" ? saved.search : "");
        if (Number.isFinite(saved?.scroll)) second = requestAnimationFrame(() => window.scrollTo({ top: saved.scroll, behavior: "instant" }));
      } catch { /* Storage is optional; the roster still works when it is unavailable. */ }
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(second); };
  }, [storageKey]);

  function remember() {
    try { sessionStorage.setItem(storageKey,JSON.stringify({ search, scroll: window.scrollY })); } catch { /* Optional navigation convenience. */ }
  }
  function select(nextClass: string, nextPeriod = periodId) {
    skipSwitchRestore.current = nextClass !== classId || nextPeriod !== periodId;
    if (root.current) setFloor(Math.max(0, window.innerHeight - root.current.getBoundingClientRect().top));
    setClassId(nextClass); setPeriodId(nextPeriod); setSearch("");
    const params = new URLSearchParams({ period: nextPeriod, class: nextClass });
    window.history.replaceState(null,"",`/?${params}`);
  }
  function studentCount(id: string) { return roster.filter(r => r.class_id === id && r.period_id === periodId).length; }

  return <div className="my-classes" ref={root} style={{ minHeight: floor }}>
    <header className="admin-heading page-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>My classes</h1><p className="hint">Every moment counts. Every child has a story.</p></div>
      {!!availablePeriods.length && <label className="compact-label">Portfolio semester<select aria-label="Portfolio semester" value={periodId} onChange={e => {
        const next = availablePeriods.find(p => p.id === e.target.value)!;
        const nextClasses = classes.filter(c => c.academic_year === next.year);
        select(nextClasses.some(c => c.id === classId) ? classId : nextClasses[0]?.id ?? "",next.id);
      }}>{availablePeriods.map(p => <option key={p.id} value={p.id}>{p.year} · Semester {p.semester}</option>)}</select></label>}
    </header>
    {!classes.length ? <div className="directory-empty"><h2>No classes assigned yet</h2><p className="hint">Your administrator can assign you a class. Its portfolios will appear here.</p></div> : !period ? <div className="directory-empty"><h2>No reporting semesters yet</h2><p className="hint">Your administrator can prepare the reporting semesters for your classes.</p></div> : <div className="admin-directory">
      <aside className="class-directory" aria-label="My class directory"><p className="eyebrow">CLASSES · {period.year}</p>
        <label className="mobile-class-picker">Class<select aria-label="Choose my class" value={classId} onChange={e => select(e.target.value)}>{yearClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <nav aria-label="Choose my class">{yearClasses.map(c => <button key={c.id} aria-current={classId === c.id ? "page" : undefined} onClick={() => select(c.id)}><Icon name="books" /><span>{c.name}</span><span className="directory-count">{studentCount(c.id)}</span></button>)}</nav>
      </aside>
      <section className="class-detail class-section" aria-labelledby="roster-heading">
        <header className="class-detail-heading section-heading"><div><h2 id="roster-heading">{current?.name} · {period.year}</h2><p>{children.length} {children.length === 1 ? "student" : "students"} · {ready} ready for PDF</p></div></header>
        <label className="search-field roster-search"><Icon name="magnifying-glass" /><span className="sr-only">Search my students</span><input type="search" placeholder="Search by name or student ID" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <div className="portfolio-roster" role="region" aria-label={`${current?.name} portfolio progress`}>
          <div className="roster-columns" aria-hidden="true"><span>Student</span>{domains.map(d => <span key={d.id}>{d.label}</span>)}</div>
          <ul className="roster-list">{visible.map(child => <li key={child.id} className={`roster-row ${child.portfolios ? "has-portfolio" : ""}`}>
            <div className="roster-student"><h3>{child.portfolios ? <Link prefetch={false} className="roster-main-link" href={`/portfolio/${child.portfolios.id}`} onClick={remember} aria-label={`Open ${child.children.display_name}'s portfolio`}>{child.children.display_name}</Link> : child.children.display_name}</h3><span className="person-reference">{child.children.student_code}</span></div>
            <div className="roster-domains">{domains.map(d => {
              const status = savedDomainProgress(child.portfolios?.domain_entries.find(e => e.domain === d.id));
              const tooltipId = `${statusId}-${child.id}-${d.id}`;
              return child.portfolios ? <Link key={d.id} prefetch={false} className={`roster-domain ${status.tone}`} href={`/portfolio/${child.portfolios.id}?domain=${d.id}`} onClick={remember} aria-label={`${child.children.display_name} · ${d.label} · ${status.label}`} aria-describedby={tooltipId}><span className="roster-domain-label">{d.label}</span><span>{status.label}</span><span className="roster-status-tooltip" id={tooltipId} role="tooltip">{status.description}</span></Link> : <span key={d.id} className="roster-domain"><span className="roster-domain-label">{d.label}</span>Awaiting setup</span>;
            })}</div>
            {!child.portfolios && <span className="hint">Awaiting setup</span>}
          </li>)}</ul>
        </div>
        {!visible.length && <div className="directory-empty"><h3>{search ? "No matching students" : "No students in this class yet"}</h3><p className="hint">{search ? "Try another name or student ID, or clear your search." : "Your administrator can add students to this class."}</p>{search && <button className="text-action" onClick={() => setSearch("")}>Clear search</button>}</div>}
      </section>
    </div>}
  </div>;
}
