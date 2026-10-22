"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, type MouseEvent } from "react";
import { domains, type Domain, type Entry } from "@/lib/portfolio";
import { DomainEditor } from "./domain-editor";
import { DomainStamp } from "./domain-stamp";
import { InlineLoader } from "./page-loader";

// Student links (Previous, Next, sidebar) carry no domain, so one prefetch of a student serves every
// tab. The open domain is remembered here instead, and written back to the address bar on arrival.
let rememberedDomain: Domain | null = null;

/** The open domain: the address bar wins, then the domain remembered from the last portfolio. */
export function useCurrentDomain(fallback: Domain): Domain {
  const value = useSearchParams().get("domain");
  return domains.find(d => d.id === value)?.id ?? rememberedDomain ?? fallback;
}

const plainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * All four domains of the open portfolio are already loaded, so switching tabs only swaps the editor
 * and updates the address bar: no server request. Unsaved changes are still caught by the editor's
 * guard, which intercepts the click before it reaches the tab.
 */
export function PortfolioDomains({ portfolioId, entries, priorRatings, fallback }: {
  portfolioId: string;
  entries: Entry[];
  priorRatings: Partial<Record<Domain, number>>;
  fallback: Domain;
}) {
  const current = useCurrentDomain(fallback);
  const entry = entries.find(e => e.domain === current);
  useEffect(() => {
    rememberedDomain = current;
    // Keep reloads, bookmarks and Back/Forward on this domain.
    const url = new URL(window.location.href);
    if (url.searchParams.get("domain") !== current) {
      url.searchParams.set("domain", current);
      window.history.replaceState(null, "", url);
    }
  }, [current]);
  return <>
    <nav className="domain-tabs" aria-label="Learning domains">
      {domains.map(d => {
        const saved = entries.find(e => e.domain === d.id);
        const href = `/portfolio/${portfolioId}?domain=${d.id}`;
        return <Link
          key={d.id}
          scroll={false} href={href}
          aria-current={current === d.id ? "page" : undefined}
          aria-describedby={`readiness-${portfolioId}-${current}-${d.id}`}
          onClick={event => {
            if (!plainClick(event)) return;
            event.preventDefault();
            if (d.id !== current) window.history.pushState(null, "", href);
          }}
        >
          <span className={`domain-badge ${d.id}`}>{d.short}</span>
          <span className="domain-tab-label">{d.label}</span>
          <DomainStamp domain={d.id} tooltipId={`readiness-${portfolioId}-${current}-${d.id}`} hasIndicator={Boolean(saved?.rating)} hasStory={Boolean(saved?.narrative.trim())} />
        </Link>;
      })}
    </nav>
    <InlineLoader />
    {entry && <DomainEditor key={entry.id} entry={entry} previousRating={priorRatings[current] ?? null} />}
  </>;
}
