"use client";
import { useId, useRef, useState } from "react";
import { Icon } from "./icon";
import { domainReadiness } from "@/lib/domain-readiness";

export type AreaStatus = { id: string; label: string; indicator: string | null; hasStory: boolean; savedAt: string };
type Result = { url: string; bytes: number; pages: number; orientation: string };
const size = (bytes: number) => bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;

/** Prototype flow: choose orientation and download saved content in one click. */
export function PdfExport({ portfolioId, areas }: { portfolioId: string; areas: AreaStatus[] }) {
  const instanceId = useId();
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<string[] | null>(null);
  const lock = useRef(false);
  const canDownload = areas.every(area => domainReadiness(Boolean(area.indicator), area.hasStory).ready);

  async function download() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setProblem(null); setResult(null);
    try {
      const response = await fetch(`/api/portfolio/${portfolioId}/pdf`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orientation, mode: "final" }),
      });
      const body = await response.json();
      if (!response.ok) { setProblem(body.reasons ?? [body.error ?? "The PDF could not be created."]); return; }
      setResult(body);
      // The private signed URL carries Content-Disposition: attachment. No blank tab.
      const link = document.createElement("a");
      link.href = body.url; link.download = "";
      document.body.appendChild(link); link.click(); link.remove();
    } catch { setProblem(["The PDF could not be created. Check your connection and try again."]); }
    finally { lock.current = false; setBusy(false); }
  }

  return <section className="panel pdf-export" aria-label="Portfolio PDF">
    <div className="pdf-export-row">
      <div>
        <h2>{canDownload ? "Let’s bring their story together." : "Their story is taking shape."}</h2>
        <p className="hint">{canDownload ? "Thank you for the care you’ve put into recording their journey." : "Thank you for capturing the little moments that make it theirs."}</p>
      </div>
      <div className="pdf-create-controls">
        {canDownload && <fieldset className="pdf-orientation" disabled={busy}><legend className="sr-only">Page orientation</legend>{(["landscape", "portrait"] as const).map(value => <label key={value} className={orientation === value ? "selected" : undefined}><input type="radio" name={`pdf-orientation-${instanceId}`} value={value} checked={orientation === value} onChange={() => setOrientation(value)} />{value === "landscape" ? "Landscape" : "Portrait"}</label>)}</fieldset>}
        <button type="button" className="primary" disabled={busy || !canDownload} onClick={() => void download()}><Icon name="printer" />{busy ? "Creating PDF…" : "Create PDF"}</button>
      </div>
    </div>
    {busy && <p className="hint" role="status">Bringing their story together… Your download will start when it’s ready.</p>}
    {problem && <div className="error pdf-problem" role="alert"><p>The PDF could not be created:</p><ul>{problem.map(text => <li key={text}>{text}</li>)}</ul></div>}
    {result && <p className="hint pdf-download-result" role="status">{result.orientation === "portrait" ? "Portrait" : "Landscape"} PDF ready · {result.pages} pages · {size(result.bytes)}. <a className="text-link" href={result.url} download>Download again</a></p>}
  </section>;
}
