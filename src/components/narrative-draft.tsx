"use client";

import { useEffect, useId, useRef, useState } from "react";
import { observationSnapshot, type DraftResponse } from "@/lib/drafting";
import type { Observation } from "@/lib/portfolio";
import { Icon } from "./icon";

export function NarrativeDraft({ entryId, revision, rating, observations, narrative, language, onAccept }: {
  entryId:string; revision:number; rating:number | null; observations:Observation[]; narrative:string; language:string; onAccept:(text:string) => void;
}) {
  const id = useId();
  const [generating,setGenerating] = useState(false);
  const [error,setError] = useState("");
  const [candidate,setCandidate] = useState<{ result:DraftResponse; source:string; previousText:string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(),[]);
  const snapshot = observationSnapshot(rating,observations);
  const fingerprint = JSON.stringify(snapshot);
  const outdated = !!candidate && (candidate.source !== fingerprint || candidate.previousText !== narrative);
  async function generate() {
    if (controller.current || !snapshot.observations.length) return;
    const request = new AbortController();
    controller.current = request;
    setGenerating(true); setError("");
    try {
      const response = await fetch("/api/narrative/draft",{ method:"POST", headers:{"Content-Type":"application/json"}, signal:request.signal,
        body:JSON.stringify({entryId,revision,...snapshot}),
      });
      const body = await response.json();
      if (!response.ok) { setError(typeof body.error === "string" ? body.error : "Could not generate a draft. Please try again."); return; }
      if (typeof body.narrative !== "string" || typeof body.clarification !== "string" || (!body.narrative && !body.clarification)) {
        setError("The AI could not return a usable draft. Your text is unchanged; please try again."); return;
      }
      setCandidate({ result:body, source:fingerprint, previousText:narrative });
    } catch {
      if (!request.signal.aborted) setError("Could not connect to the drafting service. Your text is unchanged; please try again.");
    } finally { controller.current=null; setGenerating(false); }
  }
  return <div className="narrative-drafting">
    <div className="draft-toolbar"><button type="button" className="secondary" disabled={generating || !snapshot.observations.length} onClick={generate}><Icon name="sparkle" />{generating ? "Drafting…" : "Draft narrative"}</button>
      {generating && <button type="button" className="text-action" onClick={() => { controller.current?.abort(); setError(""); }}>Cancel</button>}
    </div>
    <p className="hint" role="status">{generating ? "Drafting from your current observations. You can keep editing." : !snapshot.observations.length ? "Add an observation to draft a narrative." : "Uses your current observations, including unsaved notes. Your narrative stays unchanged until you choose Use draft."}</p>
    {error && <p className="error" role="alert">{error}</p>}
    {candidate && <section className="draft-preview" aria-labelledby={`${id}-title`} aria-busy={generating}>
      <h3 id={`${id}-title`}>{candidate.result.clarification ? "The AI needs more detail" : "Proposed AI draft"}</h3>
      {outdated && <p role="status" className="draft-warning">Your observations or narrative have changed since this request. Generate a fresh draft before using it.</p>}
      {candidate.result.clarification ? <p role="status">{candidate.result.clarification}</p> : <p className="draft-prose" lang={language}>{candidate.result.narrative}</p>}
      {candidate.result.clarification ? <p className="hint">Add what it asks for to your observations, then try again.</p> : <p className="hint">Check the wording and facts before using this draft.{narrative.trim() ? " Use draft replaces the narrative above; it does not save it." : " Use draft places it in the narrative above; it does not save it."}</p>}
      <div className="draft-actions">
        {!!candidate.result.narrative && <button type="button" className="primary" disabled={generating || outdated} onClick={() => { onAccept(candidate.result.narrative); setCandidate(null); setError(""); }}>Use draft</button>}
        <button type="button" className="secondary" disabled={generating || !snapshot.observations.length} onClick={generate}>Try again</button>
        <button type="button" className="text-action" disabled={generating} onClick={() => {setCandidate(null);setError("");}}>Dismiss</button>
      </div>
    </section>}
  </div>;
}
