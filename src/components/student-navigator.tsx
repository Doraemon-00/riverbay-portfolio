"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { domains, type Domain } from "@/lib/portfolio";
import type { NavigationItem } from "@/lib/portfolio-navigation";
import { useCurrentDomain } from "./portfolio-domains";
import { Dialog } from "./admin-workspace";
import { Icon } from "./icon";
import { LinkLoader, useLoaderWait } from "./page-loader";

type ClassChoice = { id: string; name: string; portfolioIds: string[] };
export function StudentNavigator({ viewerId, classmates, currentId, domain: serverDomain, className, classId, year, semester, classChoices, periodId }: {
  viewerId: string; classmates: NavigationItem[]; currentId: string; domain: Domain; className: string; classId: string; year: number; semester: number; classChoices: ClassChoice[]; periodId: string;
}) {
  const router = useRouter();
  const domain = useCurrentDomain(serverDomain);
  // Resting on a student for a moment switches on that link's full prefetch (data included), so the
  // click opens it at once. Only the hovered link prefetches, not the whole list.
  const hover = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [resting, setResting] = useState<string | null>(null);
  const prefetchOnRest = (id: string) => { clearTimeout(hover.current); hover.current = setTimeout(() => setResting(id), 150); };
  const cancelRest = () => clearTimeout(hover.current);
  // Class picker navigates in code, so its wait is reported through a transition.
  const [classNavigating, startClassNavigation] = useTransition();
  const [classNavLabel, setClassNavLabel] = useState("");
  useLoaderWait(classNavigating, classNavLabel, "inline");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [classesOpen, setClassesOpen] = useState(false);
  const [lastStudents, setLastStudents] = useState<Record<string,string>>({});
  const [currentVisible, setCurrentVisible] = useState(true);
  const reveal = useRef(false);
  const desktopList = useRef<HTMLElement>(null);
  const mobileList = useRef<HTMLElement>(null);
  const position = useRef(0);
  const key = `riverbay:student-list:${viewerId}:${classId}:${year}:${semester}`;
  const lastKey = `riverbay:last-student:${viewerId}:${year}:${semester}`;
  const classIndex = classChoices.findIndex(c => c.id === classId);
  const previousClass = classChoices[classIndex - 1];
  const nextClass = classChoices[classIndex + 1];
  useLayoutEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(lastKey) ?? "{}");
      const next = currentId ? { ...saved, [classId]: currentId } : saved;
      // Resolve class destinations before paint without replacing the workspace.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastStudents(next);
      sessionStorage.setItem(lastKey,JSON.stringify(next));
    } catch { /* First student remains a valid fallback. */ }
  },[lastKey,classId,currentId]);
  useLayoutEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
      // Restore before paint: an after-paint update visibly snaps the student list.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(typeof saved?.search === "string" ? saved.search : "");
      position.current = Number.isFinite(saved?.scroll) ? saved.scroll : 0;
    } catch { /* Navigation memory is optional. */ }
  },[key]);
  useLayoutEffect(() => {
    if (desktopList.current) desktopList.current.scrollTop = position.current;
    if (mobileList.current) mobileList.current.scrollTop = position.current;
    const list = open ? mobileList.current : desktopList.current;
    if (reveal.current && list) { reveal.current = false; scrollToCurrent(list); }
    // Synchronous measurement keeps the locate action consistent with restored scroll.
    updateVisibility(list);
  },[key,search,open,currentId]);
  useLayoutEffect(() => {
    // Close the cached mobile picker in the same paint as the student change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
    setClassesOpen(false);
  },[currentId,classId]);
  function classHref(choice: ClassChoice) {
    const remembered = lastStudents[choice.id];
    const target = choice.portfolioIds.includes(remembered) ? remembered : choice.portfolioIds[0];
    return target ? `/portfolio/${target}?domain=${domain}` : `/portfolio/class/${choice.id}?period=${periodId}&domain=${domain}`;
  }
  function chooseClass(id: string) {
    const choice = classChoices.find(c => c.id === id);
    if (!choice || id === classId) return;
    const href = classHref(choice), label = `Opening ${choice.name}…`;
    const allowed = window.dispatchEvent(new CustomEvent("riverbay:before-navigate",{ cancelable:true, detail:{ href, label } }));
    if (allowed) { setClassNavLabel(label); startClassNavigation(() => router.push(href,{ scroll:false })); }
  }
  function updateVisibility(list: HTMLElement | null) {
    if (!list || list.offsetParent === null) return;
    const active = list.querySelector('[aria-current="page"]');
    if (!active) { setCurrentVisible(false); return; }
    const item = active.getBoundingClientRect(), bounds = list.getBoundingClientRect();
    setCurrentVisible(item.top >= bounds.top - 1 && item.bottom <= Math.min(bounds.bottom,window.innerHeight) + 1);
  }
  function scrollToCurrent(list: HTMLElement) {
    const active = list.querySelector('[aria-current="page"]');
    if (!active) return;
    const item = active.getBoundingClientRect(), bounds = list.getBoundingClientRect();
    list.scrollTop += item.top - bounds.top - Math.max(0,(list.clientHeight-item.height)/2);
    position.current = list.scrollTop;
    setCurrentVisible(true);
  }
  function showCurrent(mobile: boolean) {
    const list = mobile ? mobileList.current : desktopList.current;
    reveal.current = true;
    remember("",position.current);
    if (search) setSearch("");
    else if (list) { reveal.current = false; scrollToCurrent(list); }
  }
  function remember(value: string, scroll: number) {
    position.current = scroll;
    try { sessionStorage.setItem(key,JSON.stringify({ search: value, scroll })); } catch { /* Storage may be unavailable. */ }
  }
  const matches = classmates.filter(c => `${c.children.display_name} ${c.children.student_code}`.toLowerCase().includes(search.trim().toLowerCase()));
  function picker(mobile: boolean) {
    return <>
      {mobile ? <label>Class<select aria-label="Portfolio class" value={classId} onChange={e => chooseClass(e.target.value)}>{classChoices.map(c => <option key={c.id} value={c.id}>{c.name}{!c.portfolioIds.length ? " · No students" : ""}</option>)}</select></label> : <div className="sidebar-class-navigation">
        {previousClass ? <Link className="icon-button" aria-label={`Previous class: ${previousClass.name}`} title={`Previous class: ${previousClass.name}`} prefetch={false} scroll={false} href={classHref(previousClass)} data-loader-label={`Opening ${previousClass.name}…`}><Icon name="arrow-left" /><LinkLoader kind="inline" label={`Opening ${previousClass.name}…`} /></Link> : <span aria-hidden="true" />}
        <button className="class-title-picker" aria-label={`Choose class, current ${className}`} onClick={() => setClassesOpen(true)}>{className}<small>{year}</small></button>
        {nextClass ? <Link className="icon-button" aria-label={`Next class: ${nextClass.name}`} title={`Next class: ${nextClass.name}`} prefetch={false} scroll={false} href={classHref(nextClass)} data-loader-label={`Opening ${nextClass.name}…`}><Icon name="arrow-right" /><LinkLoader kind="inline" label={`Opening ${nextClass.name}…`} /></Link> : <span aria-hidden="true" />}
      </div>}
      <p className="hint student-list-context">Semester {semester} · {classmates.length} students</p>
      {classmates.length > 0 && <>
      <label className="search-field"><Icon name="magnifying-glass" /><span className="sr-only">Search class students</span><input type="search" placeholder="Name or student ID" value={search} onChange={e => { setSearch(e.target.value); remember(e.target.value,0); if (desktopList.current) desktopList.current.scrollTop = 0; if (mobileList.current) mobileList.current.scrollTop = 0; }} /></label>
      {!currentVisible && <button type="button" className="text-action show-current-student" onClick={() => showCurrent(mobile)}>Show current student</button>}
      <nav ref={mobile ? mobileList : desktopList} className="student-links" aria-label="Choose student" onScroll={e => { if (e.currentTarget.offsetParent !== null) { remember(search,e.currentTarget.scrollTop); updateVisibility(e.currentTarget); } }}>{matches.map(c => {
        const count = c.portfolios?.readyCount ?? 0;
        const countLabel = `${count} of ${domains.length} areas ready for PDF`;
        const content = <><span className="student-link-name">{c.children.display_name}<small>{c.children.student_code}</small></span><span className="student-draft-count" aria-label={countLabel} title={countLabel}>{count}/{domains.length}</span></>;
        return c.portfolios ? <Link prefetch={resting === c.id} scroll={false} key={c.id} href={`/portfolio/${c.portfolios.id}`} aria-current={c.portfolios.id === currentId ? "page" : undefined} aria-label={`${c.children.display_name} · ${c.children.student_code} · ${countLabel}`} data-loader-label={`Opening ${c.children.display_name}…`} onPointerEnter={() => prefetchOnRest(c.id)} onPointerLeave={cancelRest}>{content}<LinkLoader kind="inline" label={`Opening ${c.children.display_name}…`} /></Link> : <span className="student-unavailable" key={c.id}>{c.children.display_name}<small>Awaiting setup</small></span>;
      })}</nav>
      {!matches.length && <p className="hint">No matching students. Try another name or ID.</p>}
      </>}
      {!classmates.length && <p className="hint">No students yet. Choose another class to continue.</p>}
    </>;
  }
  return <>
    <aside className="student-sidebar" aria-label="Class students">{picker(false)}</aside>
    <div className="mobile-student-selector"><button type="button" className="secondary" onClick={() => setOpen(true)}><Icon name="users-three" />{classmates.length ? "Choose student" : "Choose class"}</button><span className="hint">{className} · Semester {semester}</span></div>
    {open && <Dialog tour={classmates.length ? "student-picker" : "class-picker"} title={classmates.length ? "Choose student" : "Choose class"} pending={false} close={() => setOpen(false)}><div className="student-picker">{picker(true)}</div><div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>Close</button></div></Dialog>}
    {classesOpen && <Dialog tour="class-picker" title="Choose class" pending={false} close={() => setClassesOpen(false)}><p className="hint">{year} · Semester {semester}. Your learning domain stays selected.</p><nav className="student-links class-choice-links" aria-label="Portfolio classes">{classChoices.map(c => <Link prefetch={false} scroll={false} key={c.id} href={classHref(c)} aria-current={c.id === classId ? "page" : undefined} onNavigate={() => setClassesOpen(false)} data-loader-label={`Opening ${c.name}…`}><LinkLoader kind="inline" label={`Opening ${c.name}…`} /><span>{c.name}</span><small>{c.portfolioIds.length} {c.portfolioIds.length === 1 ? "student" : "students"}</small></Link>)}</nav><div className="dialog-actions"><button className="secondary" onClick={() => setClassesOpen(false)}>Close</button></div></Dialog>}
  </>;
}
