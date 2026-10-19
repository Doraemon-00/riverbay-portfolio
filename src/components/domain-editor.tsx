"use client";
import { useEffect, useState, useTransition } from "react";
import { saveEntry } from "@/app/actions";
import { type Entry, domains, ratingLabels } from "@/lib/portfolio";
import { Icon } from "./icon";
import { RatingRing } from "./rating-ring";

export function DomainEditor({
  entry,
  previousRating,
}: {
  entry: Entry;
  previousRating: number | null;
}) {
  const [rating, setRating] = useState(entry.rating);
  const [revision, setRevision] = useState(entry.revision);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("All changes saved");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const domain = domains.find((d) => d.id === entry.domain)!;
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        link &&
        link.href !== window.location.href &&
        !window.confirm("You have unsaved changes. Leave without saving?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const submit = (event: SubmitEvent) => {
      if (
        (event.target as HTMLFormElement).id !== "domain-editor" &&
        !window.confirm("You have unsaved changes. Leave without saving?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
    };
  }, [dirty]);
  const changed = () => {
    setDirty(true);
    setMessage("Unsaved changes");
    setFailed(false);
  };
  return (
    <form
      id="domain-editor"
      onChange={changed}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            const result = await saveEntry(form);
            setMessage(result.message);
            setFailed(!result.ok);
            if (result.ok) {
              setRevision(result.revision!);
              setDirty(false);
            }
          } catch {
            setMessage(
              "Could not save. Your text is still here; please retry.",
            );
            setFailed(true);
          }
        });
      }}
    >
      <input type="hidden" name="entry_id" value={entry.id} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="rating" value={rating ?? ""} />
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
              <div className="previous-rating">
                Semester 1:{" "}
                <strong>
                  {previousRating === null
                    ? "Not available / not assessed"
                    : ratingLabels[previousRating - 1]}
                </strong>
              </div>
            </section>
            <section className="panel">
              <label htmlFor="comments">
                <h2>Your observations</h2>
              </label>
              <p className="hint" id="comments-help">
                Rough notes are welcome. Include what you observed and any
                support needed.
              </p>
              <textarea
                id="comments"
                name="comments"
                defaultValue={entry.comments}
                rows={7}
                maxLength={6000}
                aria-describedby="comments-help"
                placeholder={
                  entry.domain === "chinese"
                    ? "例如：在提示下，能用短句分享自己的想法。"
                    : "For example: shared an idea during group time, with a little prompting."
                }
              />
            </section>
            <section className="panel">
              <h2>Photos</h2>
              <p className="hint">
                Photo upload and placement are coming in the next build step.
                Use fictional illustrations only.
              </p>
            </section>
          </div>
          <section className="panel narrative-panel">
            <p className="eyebrow">THE LEARNING STORY</p>
            <label htmlFor="narrative">
              <h2>{domain.label} narrative</h2>
            </label>
            <p className="hint" id="narrative-help">
              Write or edit the report text here. AI drafting and guideline
              checks will be connected next.
            </p>
            <textarea
              id="narrative"
              name="narrative"
              lang={domain.language}
              defaultValue={entry.narrative}
              rows={16}
              maxLength={10000}
              aria-describedby="narrative-help"
              placeholder={
                entry.domain === "chinese"
                  ? "在这里撰写中文学习反馈……"
                  : "The child's learning story goes here…"
              }
            />
            <p className="hint">
              Draft only · Final review and PDF export are not connected yet.
            </p>
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
  );
}
