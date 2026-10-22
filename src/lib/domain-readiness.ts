import { domains, type Entry } from "./portfolio";

/** Readiness describes saved fields only; it does not certify teacher review. */
export function domainReadiness(hasIndicator: boolean, hasStory: boolean) {
  return {
    ready: hasIndicator && hasStory,
    description: hasIndicator && hasStory ? "Ready for PDF"
      : hasIndicator ? "Indicator saved · learning story missing"
      : hasStory ? "Learning story saved · indicator missing"
      : "Indicator and learning story missing",
  };
}

export function savedDomainProgress(entry?: Entry) {
  const indicator = entry?.rating != null;
  const story = Boolean(entry?.narrative.trim());
  const readiness = domainReadiness(indicator, story);
  const started = indicator || story || Boolean(entry?.comments.trim())
    || Boolean(entry?.observations?.some(note => note.text.trim())) || Boolean(entry?.photos?.length);
  return {
    ...readiness,
    label: readiness.ready ? "Ready for PDF" : started ? "In progress" : "Not started",
    tone: readiness.ready ? "is-ready" : started ? "has-input" : "",
  };
}

export function readyDomainCount(entries: Entry[] = []) {
  return domains.filter(domain => savedDomainProgress(entries.find(entry => entry.domain === domain.id)).ready).length;
}
