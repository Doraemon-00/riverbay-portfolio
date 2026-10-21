"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { Observation } from "@/lib/portfolio";
import { Icon } from "./icon";
import { ObservationDatePicker } from "./observation-date-picker";

export function ObservationTimeline({ observations, onChange, chinese }: {
  observations: Observation[]; onChange: (items: Observation[]) => void; chinese: boolean;
}) {
  const fieldId = useId();
  const [expanded, setExpanded] = useState(false);
  const [generalExpanded, setGeneralExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const generalHeading = useRef<HTMLHeadingElement>(null);
  const returnToHeading = useRef<HTMLHeadingElement | null>(null);
  useLayoutEffect(() => {
    if (!returnToHeading.current) return;
    const target = returnToHeading.current;
    returnToHeading.current = null;
    // Measure after the older notes collapse, before the next paint.
    const top = target.getBoundingClientRect().top;
    if (top >= 0) return;
    target.focus({ preventScroll:true });
    window.scrollTo({
      top: Math.max(0, window.scrollY + top - 24),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [expanded, generalExpanded]);
  const [editing, setEditing] = useState<string[]>(observations.filter(o => !o.text.trim()).map(o => o.id));
  const [reading, setReading] = useState<string[]>([]);
  const dated = observations.filter(o => o.date).sort((a,b) => b.date!.localeCompare(a.date!));
  const general = observations.filter(o => !o.date);
  const visible = expanded ? dated : dated.filter((o,i) => i < 3 || editing.includes(o.id));
  const hidden = dated.length - visible.length;
  const visibleGeneral = generalExpanded ? general : general.filter((o,i) => i < 3 || editing.includes(o.id));
  const hiddenGeneral = general.length - visibleGeneral.length;
  function update(id: string, patch: Partial<Observation>) {
    onChange(observations.map(o => o.id === id ? { ...o, ...patch } : o));
  }
  function add() {
    const id = crypto.randomUUID();
    const date = new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Singapore", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
    onChange([...observations, { id, date, text:"" }]);
    setEditing([...editing,id]);
  }
  function point(o: Observation) {
    const label = o.date ? new Intl.DateTimeFormat("en-SG",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${o.date}T00:00:00Z`)) : "General observation";
    const active = editing.includes(o.id);
    const long = o.text.length > 280 && !reading.includes(o.id);
    return <li key={o.id} className="observation-point">
      <div className="observation-heading"><strong>{label}</strong><div className="observation-actions">
        {!active && <button type="button" className="text-action" aria-label={`Edit observation: ${label}`} onClick={() => setEditing([...editing,o.id])}>Edit</button>}
        <button type="button" className="text-action danger" aria-label={`Remove observation: ${label}`} onClick={() => onChange(observations.filter(item => item.id !== o.id))}>Remove</button>
      </div></div>
      {active ? <div className="observation-inputs">
        <label htmlFor={`${fieldId}-${o.id}-date`}>Observation date <span className="hint">(optional)</span></label>
        <ObservationDatePicker id={`${fieldId}-${o.id}-date`} value={o.date} onChange={date => update(o.id, { date })} />
        <label htmlFor={`${fieldId}-${o.id}-text`}>Observation</label>
        <textarea id={`${fieldId}-${o.id}-text`} value={o.text} onChange={e => update(o.id,{text:e.target.value})} rows={4} maxLength={6000} lang={chinese ? "zh-Hans" : "en"} placeholder={chinese ? "例如：在提示下，能用短句分享自己的想法。" : "What did you notice? Rough notes are welcome."} />
        <button type="button" className="secondary" disabled={!o.text.trim()} onClick={() => setEditing(editing.filter(id => id !== o.id))}>Done editing</button>
      </div> : <><p className="observation-text">{long ? `${o.text.slice(0,280)}…` : o.text}</p>{o.text.length > 280 && <button type="button" className="text-action" aria-label={`${long ? "Read more" : "Read less"}: ${label}`} onClick={() => setReading(long ? [...reading,o.id] : reading.filter(id => id !== o.id))}>{long ? "Read more" : "Read less"}</button>}</>}
    </li>;
  }
  return <section className="panel observation-panel" aria-labelledby={`${fieldId}-title`}>
    <div className="section-heading"><h2 ref={heading} tabIndex={-1} id={`${fieldId}-title`}>Your observations</h2><button type="button" className="text-action" disabled={observations.length >= 100} onClick={add}><Icon name="plus" size={16} />Add observation</button></div>
    <p className="hint">Rough notes are welcome. Dates are optional. Use Save changes to save your observations.</p>
    {!!dated.length && <ol className="observation-timeline" aria-label="Dated observations">{visible.map(point)}</ol>}
    {dated.length > 3 && <button type="button" className="text-action observation-history" aria-expanded={expanded} onClick={() => { returnToHeading.current = expanded && heading.current && heading.current.getBoundingClientRect().top < 0 ? heading.current : null; setExpanded(!expanded); }}>{expanded ? "Show fewer" : hidden ? `Show ${hidden} earlier ${hidden === 1 ? "observation" : "observations"}` : "Show earlier observations"}</button>}
    {!!general.length && <div className="general-observations"><h3 ref={generalHeading} tabIndex={-1}>General observations</h3><ul id={`${fieldId}-general-list`} className="observation-timeline" aria-label="General observations">{visibleGeneral.map(point)}</ul>
      {general.length > 3 && <button type="button" className="text-action observation-history" aria-controls={`${fieldId}-general-list`} aria-expanded={generalExpanded} aria-label={generalExpanded ? "Show fewer general observations" : hiddenGeneral ? `Show ${hiddenGeneral} more general ${hiddenGeneral === 1 ? "observation" : "observations"}` : "Show more general observations"} onClick={() => { returnToHeading.current = generalExpanded && generalHeading.current && generalHeading.current.getBoundingClientRect().top < 0 ? generalHeading.current : null; setGeneralExpanded(!generalExpanded); }}>{generalExpanded ? "Show fewer" : hiddenGeneral ? `Show ${hiddenGeneral} more ${hiddenGeneral === 1 ? "observation" : "observations"}` : "Show more"}</button>}
    </div>}
    {!observations.length && <p className="hint">No observations yet. Add a note to get started.</p>}
  </section>;
}
