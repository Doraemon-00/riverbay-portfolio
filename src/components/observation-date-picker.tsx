"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { Icon } from "./icon";

function fromIso(value: string | null) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function displayDate(value: string | null) {
  return value ? value.split("-").reverse().join("/") : "";
}
function parseTyped(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return undefined;
  const [day, month, year] = value.split("/").map(Number);
  if (year < 1000 || year > 9999) return undefined;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? toIso(date) : undefined;
}
function singaporeToday() {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return fromIso(iso)!;
}
export function ObservationDatePicker({ id, value, onChange }: { id: string; value: string | null; onChange: (value: string | null) => void }) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => fromIso(value) ?? singaporeToday());
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [yearPage, setYearPage] = useState(() => Math.floor((fromIso(value) ?? singaporeToday()).getFullYear() / 12) * 12);
  const [draft, setDraft] = useState({ source: value, text: displayDate(value) });
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = fromIso(value);
  const today = singaporeToday();
  const inputText = draft.source === value ? draft.text : displayDate(value);
  const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("en-SG", { month: "short" }).format(new Date(2026, index, 1)));
  const currentMonthName = new Intl.DateTimeFormat("en-SG", { month: "long" }).format(month);

  function browse(direction: number) {
    if (view === "years") { setYearPage(page => Math.max(996, Math.min(9996, page + direction * 12))); return; }
    const next = new Date(month.getFullYear() + (view === "months" ? direction : 0), month.getMonth() + (view === "days" ? direction : 0), 1, 12);
    if (next.getFullYear() >= 1000 && next.getFullYear() <= 9999) setMonth(next);
  }

  useEffect(() => {
    if (!open || !dialog.current) return;
    const popup = dialog.current;
    const previousTrigger = trigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    popup.showModal();
    popup.querySelector<HTMLButtonElement>('.rdp-day_button[tabindex="0"]')?.focus({ preventScroll: true });
    return () => { popup.close(); document.body.style.overflow = overflow; previousTrigger?.focus({ preventScroll: true }); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = view === "days" ? dialog.current?.querySelector<HTMLButtonElement>('.rdp-day_button[tabindex="0"]') : dialog.current?.querySelector<HTMLButtonElement>('.calendar-options button[aria-pressed="true"]') ?? dialog.current?.querySelector<HTMLButtonElement>('.calendar-options button');
    target?.focus({ preventScroll: true });
  }, [open, view]);

  function choose(next: string | null) {
    setDraft({ source: next, text: displayDate(next) });
    input.current?.setCustomValidity("");
    onChange(next);
    setOpen(false);
    // Changing between dated/general groups remounts the observation row.
    requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
  }

  return <div className="observation-date">
    <div className="observation-date-field">
      <input ref={input} id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="DD/MM/YYYY" aria-describedby={`${dialogId}-format`} value={inputText} onChange={event => {
        const text = event.target.value;
        const parsed = parseTyped(text);
        const next = text === "" ? null : parsed;
        event.target.setCustomValidity(next === undefined ? "Enter a valid date as DD/MM/YYYY, or leave it blank." : "");
        setDraft({ source: next === undefined ? value : next, text });
        if (next !== undefined) { onChange(next); if (next) setMonth(fromIso(next)!); }
      }} />
      <button ref={trigger} type="button" className="date-picker-trigger" aria-label="Choose observation date" aria-haspopup="dialog" aria-controls={dialogId} aria-expanded={open} onClick={() => { setMonth(selected ?? singaporeToday()); setView("days"); setOpen(true); }}><Icon name="calendar" size={20} /></button>
    </div>
    <span id={`${dialogId}-format`} className="sr-only">Date format: day, month, year. Dates are optional.</span>
    {value && <button type="button" className="text-action" onClick={() => choose(null)}>Clear date</button>}
    {open && <dialog ref={dialog} id={dialogId} className="date-picker-dialog" aria-labelledby={`${dialogId}-title`} onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
    }} onChange={event => event.stopPropagation()}>
      <div className="date-picker-heading"><h2 id={`${dialogId}-title`}>Observation date</h2><button type="button" className="icon-button" aria-label="Close calendar" onClick={() => setOpen(false)}><Icon name="x" size={18} /></button></div>
      <div className="calendar-browse" aria-label="Calendar navigation">
        <button type="button" className="icon-button" aria-label={view === "years" ? "Previous 12 years" : view === "months" ? "Previous year" : "Previous month"} onClick={() => browse(-1)}><Icon name="arrow-left" size={18} /></button>
        <div className="calendar-period"><button type="button" aria-label={`Choose month, ${currentMonthName}`} aria-pressed={view === "months"} onClick={() => setView(view === "months" ? "days" : "months")}>{currentMonthName}</button><button type="button" aria-label={`Choose year, ${month.getFullYear()}`} aria-pressed={view === "years"} onClick={() => { setYearPage(Math.floor(month.getFullYear() / 12) * 12); setView(view === "years" ? "days" : "years"); }}>{month.getFullYear()}</button></div>
        <button type="button" className="icon-button" aria-label={view === "years" ? "Next 12 years" : view === "months" ? "Next year" : "Next month"} onClick={() => browse(1)}><Icon name="arrow-right" size={18} /></button>
      </div>
      {view === "days" ? <DayPicker className="riverbay-calendar" mode="single" required autoFocus selected={selected} month={month} onMonthChange={setMonth} onSelect={date => { if (date) choose(toIso(date)); }} today={today} hideNavigation showOutsideDays fixedWeeks weekStartsOn={1} /> : <div className="calendar-picker-view">
        <p className="calendar-picker-title" aria-live="polite">{view === "months" ? "Choose a month" : `${Math.max(1000, yearPage)}–${Math.min(9999, yearPage + 11)}`}</p>
        <div className="calendar-options" role="group" aria-label={view === "months" ? "Choose a month" : "Choose a year"}>{view === "months" ? monthNames.map((name, index) => <button key={name} type="button" aria-label={`Show ${name} ${month.getFullYear()}`} aria-pressed={month.getMonth() === index} onClick={() => { setMonth(new Date(month.getFullYear(), index, 1, 12)); setView("days"); }}>{name}</button>) : Array.from({ length: 12 }, (_, index) => yearPage + index).filter(year => year >= 1000 && year <= 9999).map(year => <button key={year} type="button" aria-label={`Show year ${year}`} aria-pressed={month.getFullYear() === year} onClick={() => { setMonth(new Date(year, month.getMonth(), 1, 12)); setView("months"); }}>{year}</button>)}</div>
      </div>}
      <div className="date-picker-footer"><span>Dates are optional</span><button type="button" className="text-action" onClick={() => choose(toIso(singaporeToday()))}>Today</button></div>
    </dialog>}
  </div>;
}
