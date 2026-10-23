"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "./admin-workspace";
import { saveEntry } from "@/app/actions";
import { type Entry, domains, ratingLabels } from "@/lib/portfolio";
import { Icon } from "./icon";
import { ObservationTimeline } from "./observation-timeline";
import { NarrativeDraft } from "./narrative-draft";
import { RatingRing } from "./rating-ring";
import { DomainPhotos } from "./domain-photos";
import { type LoaderKind, LinkLoader, useLoaderWait } from "./page-loader";

export function DomainEditor({
  entry,
  previousRating,
  previousPortfolioId,
}: {
  entry: Entry;
  /** Undefined in Semester 1, which has no earlier report. */
  previousRating?: number | null;
  /** The same student's Semester 1 portfolio, when this teacher can open it. */
  previousPortfolioId?: string | null;
}) {
  const fieldId = useId();
  const [rating, setRating] = useState(entry.rating);
  const [observations, setObservations] = useState(() => entry.observations?.length ? entry.observations : [{ id:entry.id, date:null, text:entry.comments ?? "" }]);
  const [narrative, setNarrative] = useState(entry.narrative);
  const baseline = useRef({ rating: entry.rating, observations: entry.observations?.length ? entry.observations : [{ id:entry.id, date:null, text:entry.comments ?? "" }], narrative: entry.narrative });
  const [revision, setRevision] = useState(entry.revision);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("All changes saved");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const domain = domains.find((d) => d.id === entry.domain)!;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const bypass = useRef(false);
  const [navigation, setNavigation] = useState<{ href: string; label?: string } | { form: HTMLFormElement } | null>(null);
  // After Save or Discard the editor navigates in code; a transition reports that wait to the loader.
  const [navigating, startNavigation] = useTransition();
  const [navLoader, setNavLoader] = useState<{ label: string; kind: LoaderKind }>({ label: "", kind: "inline" });
  useLoaderWait(navigating, navLoader.label, navLoader.kind);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (!bypass.current) event.preventDefault(); };
    const click = (event: MouseEvent) => {
      if (bypass.current || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.href === window.location.href) return;
      event.preventDefault(); event.stopPropagation();
      setNavigation({ href: link.href, label: link.dataset.loaderLabel });
    };
    const submit = (event: SubmitEvent) => {
      if (bypass.current || event.target === formRef.current) return;
      event.preventDefault(); event.stopPropagation();
      setNavigation({ form: event.target as HTMLFormElement });
    };
    const requested = (event: Event) => {
      if (bypass.current) return;
      const { href, label } = (event as CustomEvent<{ href: string; label?: string }>).detail ?? {};
      if (!href) return;
      event.preventDefault(); setNavigation({ href, label });
    };
    window.addEventListener("riverbay:before-navigate",requested);
    window.addEventListener("beforeunload",unload);
    document.addEventListener("click",click,true);
    document.addEventListener("submit",submit,true);
    return () => {
      window.removeEventListener("beforeunload",unload);
      window.removeEventListener("riverbay:before-navigate",requested);
      document.removeEventListener("click",click,true);
      document.removeEventListener("submit",submit,true);
    };
  },[dirty]);
  async function persist() {
    if (!formRef.current?.reportValidity()) return false;
    try {
      const result = await saveEntry(new FormData(formRef.current));
      setMessage(result.message); setFailed(!result.ok);
      if (result.ok) { baseline.current = { rating, observations, narrative }; setRevision(result.revision!); setDirty(false); }
      return result.ok;
    } catch {
      setMessage("Could not save. Your text is still here; please retry."); setFailed(true); return false;
    }
  }
  function continueNavigation() {
    if (!navigation) return;
    bypass.current = true;
    setDirty(false); setNavigation(null);
    if ("form" in navigation) { navigation.form.requestSubmit(); return; }
    const target = new URL(navigation.href,window.location.href);
    if (target.origin === window.location.origin && target.pathname === window.location.pathname) {
      // Another domain of this portfolio is already loaded: switch in the browser, no request.
      window.history.pushState(null, "", `${target.pathname}${target.search}${target.hash}`);
    } else if (target.origin === window.location.origin) {
      // Student switches use the small strip; leaving the portfolio uses the full loader.
      const kind: LoaderKind = target.pathname.startsWith("/portfolio/") ? "inline" : "page";
      const label = navigation.label ?? (kind === "inline" ? "Opening the portfolio…" : target.pathname === "/" ? "Opening your classes…" : "Loading…");
      setNavLoader({ label, kind });
      startNavigation(() => router.push(`${target.pathname}${target.search}${target.hash}`,{ scroll:false }));
    }
    else window.location.assign(target.href);
  }
  const changed = () => {
    bypass.current = false;
    setDirty(true);
    setMessage("Unsaved changes");
    setFailed(false);
  };
  return (<>
    <form
      ref={formRef}
      id={`${fieldId}-editor`}
      onChange={changed}
      onSubmit={event => { event.preventDefault(); startTransition(async () => { await persist(); }); }}
    >
      <input type="hidden" name="entry_id" value={entry.id} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="rating" value={rating ?? ""} />
      <input type="hidden" name="observations" value={JSON.stringify(observations.filter(o => o.text.trim()))} />
      <fieldset disabled={pending} className="editor-fields">
        <div className="editor-grid">
          <div className="input-column">
            <section className="panel">
              <div className="section-heading">
                <h2>Learning indicator</h2>
                <span className="hint">Sample scale</span>
              </div>
              <p className="hint">
                A quick indicator, alongside your observations.
              </p>
              <div
                className="rating-options"
                role="group"
                aria-label="Learning indicator"
              >
                {ratingLabels.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={`rating-option ${rating === i + 1 ? "selected" : ""}`}
                    aria-pressed={rating === i + 1}
                    onClick={() => {
                      setRating(rating === i + 1 ? null : i + 1);
                      changed();
                    }}
                  >
                    <RatingRing level={i + 1} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <button type="button" className={`unassessed-option ${rating === null ? "selected" : ""}`} aria-pressed={rating === null} onClick={() => { setRating(null); changed(); }}><RatingRing level={null} />Not yet assessed</button>
              {previousRating !== undefined && <PreviousRating rating={previousRating} portfolioId={previousPortfolioId ?? null} domain={entry.domain} />}
            </section>
            <ObservationTimeline observations={observations} chinese={entry.domain === "chinese"} onChange={items => { setObservations(items); changed(); }} />
            <DomainPhotos entryId={entry.id} domainLabel={domain.label} />
          </div>
          <section className="panel narrative-panel">
            <p className="eyebrow">THE LEARNING STORY</p>
            <label htmlFor={`${fieldId}-narrative`}>
              <h2>{domain.label} narrative</h2>
            </label>
            <p className="hint" id={`${fieldId}-narrative-help`}>
              Write or edit the report text here, or use your observations to draft a starting point.
            </p>
            <textarea
              id={`${fieldId}-narrative`}
              name="narrative"
              lang={domain.language}
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              rows={16}
              maxLength={10000}
              aria-describedby={`${fieldId}-narrative-help`}
              placeholder={
                entry.domain === "chinese"
                  ? "在这里撰写中文学习反馈……"
                  : "The child's learning story goes here…"
              }
            />
            <NarrativeDraft entryId={entry.id} revision={revision} rating={rating} observations={observations} narrative={narrative} language={domain.language} onAccept={text => {setNarrative(text);changed();}} />
          </section>
        </div>
        <div className="save-bar">
          <p
            role={failed ? "alert" : "status"}
            className={failed ? "error" : "hint"}
          >
            {pending ? "Saving…" : message}
          </p>
          <button className="primary" disabled={pending || !dirty}>
            <Icon name="check-circle" />{pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </fieldset>
    </form>
    {navigation && <Dialog tour="unsaved" title="Save your changes?" pending={pending} close={() => setNavigation(null)}>
      <p>You have unsaved changes in {domain.label}. Save them before continuing, or discard them and open your next page.</p>
      {failed && <p role="alert" className="error">{message}</p>}
      <div className="dialog-actions unsaved-actions">
        <button type="button" className="secondary stay-action" disabled={pending} onClick={() => setNavigation(null)}>Stay</button>
        <button type="button" className="secondary danger" disabled={pending} onClick={() => { setRating(baseline.current.rating); setObservations(baseline.current.observations); setNarrative(baseline.current.narrative); setMessage("All changes saved"); setFailed(false); continueNavigation(); }}>Discard changes</button>
        <button type="button" className="primary save-continue-action" disabled={pending} onClick={() => startTransition(async () => { if (await persist()) continueNavigation(); })}>{pending ? "Saving…" : "Save and continue"}</button>
      </div>
    </Dialog>}
  </>);
}

/** Semester 1's indicator; when that portfolio is open to this teacher, the whole line opens it on the same domain. */
function PreviousRating({ rating, portfolioId, domain }: { rating: number | null; portfolioId: string | null; domain: Entry["domain"] }) {
  const [resting, setResting] = useState(false);
  const content = <>
    Semester 1:
    {rating !== null && <RatingRing level={rating} />}
    <strong>{rating === null ? "Not available / not assessed" : ratingLabels[rating - 1]}</strong>
  </>;
  if (!portfolioId) return <div className="previous-rating">{content}</div>;
  // Load Semester 1 once the pointer rests on the line, so opening it is quick.
  return <div className="previous-rating">
    <Link className="previous-rating-link" href={`/portfolio/${portfolioId}?domain=${domain}`} prefetch={resting} onPointerEnter={() => setResting(true)} onFocus={() => setResting(true)} data-loader-label="Opening Semester 1…">
      {content}
      <span className="previous-rating-open">View Semester 1 report <Icon name="arrow-right" size={16} /></span>
      <LinkLoader label="Opening Semester 1…" />
    </Link>
  </div>;
}
