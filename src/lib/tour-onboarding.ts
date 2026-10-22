/** Bump only this public build setting when deployment should replay introductions. */
const version = process.env.NEXT_PUBLIC_TOUR_ONBOARDING_VERSION || "1";
export type TourIntro = "workspace" | "administration";
export function tourOnboardingKey(viewerId: string, part: TourIntro | "welcome") {
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
