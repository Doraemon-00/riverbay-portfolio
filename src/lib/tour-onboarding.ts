/** Bump this public build setting when a deployment should replay introductions. */
const release = process.env.NEXT_PUBLIC_TOUR_ONBOARDING_VERSION || "1";
/** Or bump this date in code: it replays every tour and tour offer on every browser, whatever the build setting says. */
const replay = "2026-10-24";
const version = `${release}.${replay}`;
export type TourIntro = "workspace" | "administration";
export function tourOnboardingKey(viewerId: string, part: TourIntro | `offer:${string}`) {
  return `riverbay:tour-onboarding:${version}:${viewerId}:${part}`;
}
export function hasSeenTourIntro(viewerId: string, part: TourIntro) {
  try { return localStorage.getItem(tourOnboardingKey(viewerId, part)) === "seen"; }
  catch { return false; }
}
export function rememberTourIntro(viewerId: string, part: TourIntro) {
  try { localStorage.setItem(tourOnboardingKey(viewerId, part), "seen"); }
  catch { /* Storage is optional; replaying guidance remains safe. */ }
}
