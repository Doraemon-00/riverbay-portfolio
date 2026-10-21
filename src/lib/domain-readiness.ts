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
