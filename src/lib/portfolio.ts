export const domains = [
  { id: "english", label: "English", short: "EN", language: "en" },
  { id: "chinese", label: "Chinese", short: "中文", language: "zh-Hans" },
  { id: "mathematics", label: "Mathematics", short: "MA", language: "en" },
  {
    id: "social_emotional",
    label: "Social-emotional",
    short: "SE",
    language: "en",
  },
] as const;
export const ratingLabels = ["Beginning", "Developing", "Consistently shown"];
export const scaleVersion = "sample-domain-ring-v1";
export type Domain = (typeof domains)[number]["id"];
export type Entry = {
  id: string;
  domain: Domain;
  rating: number | null;
  comments: string;
  narrative: string;
  revision: number;
  reviewed_revision: number | null;
  rating_scale_version: string;
};
export type RosterItem = {
  id: string;
  child_id: string;
  class_id: string;
  period_id: string;
  children: { display_name: string; archived_at: string | null };
  classes: { name: string; archived_at: string | null; academic_year: number };
  reporting_periods: { year: number; semester: number };
  portfolios: { id: string; domain_entries: Entry[] } | null;
};
export const rosterSelect =
  "id, child_id, class_id, period_id, children(display_name, archived_at), classes(name, archived_at, academic_year), reporting_periods(year, semester), portfolios(id, domain_entries(*))";
