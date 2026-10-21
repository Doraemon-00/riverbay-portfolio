// Input contract checks for riverbay.portfolio-report.v1 (see schema/portfolio-report.schema.json).
// The renderer refuses data it cannot place faithfully instead of guessing.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const SCHEMA_ID = "riverbay.portfolio-report.v1";
export const DOMAIN_IDS = ["english", "chinese", "mathematics", "social_emotional"];
const PHOTO_KINDS = ["photo", "fictional_illustration", "placeholder"];
const TOP_KEYS = new Set(["$comment", "schema", "fixture", "child", "period", "rating_scale_version", "domains", "cover_photo"]);

const isRating = (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 3);

export function validateReport(report, { dataPath, domains, maxPhotos, allowUnassessed = false }) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (report.schema !== SCHEMA_ID) err(`schema must be "${SCHEMA_ID}"`);
  for (const k of Object.keys(report)) if (!TOP_KEYS.has(k)) err(`unexpected top-level field "${k}"`);
  if (typeof report.child?.display_name !== "string") err("child.display_name is required");
  if (!Number.isInteger(report.period?.year)) err("period.year must be an integer");
  if (![1, 2].includes(report.period?.semester)) err("period.semester must be 1 or 2");
  if (typeof report.rating_scale_version !== "string") err("rating_scale_version is required");
  if (report.cover_photo != null) {
    const p = report.cover_photo;
    if (typeof p.src !== "string") err("cover_photo.src is required");
    else if (!existsSync(resolve(dirname(dataPath), p.src))) err(`cover_photo.src not found: ${p.src}`);
    if (!PHOTO_KINDS.includes(p.kind)) err(`cover_photo.kind must be one of ${PHOTO_KINDS.join(", ")}`);
    if ("caption" in p) err("cover_photo takes no caption");
    if (p.fit != null && !["cover", "width"].includes(p.fit)) err('cover_photo.fit must be "cover" or "width"');
  }
  for (const id of domains) {
    if (!DOMAIN_IDS.includes(id)) {
      err(`unknown domain "${id}"`);
      continue;
    }
    const d = report.domains?.[id];
    if (!d) {
      err(`domains.${id} is missing`);
      continue;
    }
    // Allow-list: raw observations, notes, previews and workflow states never reach the PDF.
    const allowed = new Set(["rating", "rating_scale_version", "previous", `${id}_feedback`, `${id}_photos`]);
    for (const k of Object.keys(d)) if (!allowed.has(k)) err(`domains.${id}.${k} is not a parent-facing field`);
    if (!("rating" in d) || !isRating(d.rating)) err(`domains.${id}.rating must be 1, 2, 3 or null (not assessed)`);
    // Export block (user decision, 21 Oct 2026): a parent PDF cannot show "not assessed".
    else if (d.rating === null && !allowUnassessed)
      err(`domains.${id}.rating is not set: choose a learning indicator before creating the PDF (use --preview to look at a draft)`);
    if (d.previous != null) {
      const p = d.previous;
      if (!Number.isInteger(p.semester)) err(`domains.${id}.previous.semester must be an integer`);
      if (!isRating(p.rating ?? null)) err(`domains.${id}.previous.rating must be 1, 2, 3 or null`);
      if (typeof p.rating_scale_version !== "string") err(`domains.${id}.previous.rating_scale_version is required`);
    }
    const text = d[`${id}_feedback`];
    if (typeof text !== "string" || !text.trim()) err(`domains.${id}.${id}_feedback must be non-empty approved text`);
    const photos = d[`${id}_photos`] ?? [];
    if (!Array.isArray(photos)) err(`domains.${id}.${id}_photos must be an array`);
    else {
      if (photos.length > maxPhotos) err(`domains.${id} has ${photos.length} photos; the template allows at most ${maxPhotos}`);
      photos.forEach((p, i) => {
        const at = `domains.${id}.${id}_photos[${i}]`;
        if (typeof p.src !== "string") err(`${at}.src is required`);
        else if (!existsSync(resolve(dirname(dataPath), p.src))) err(`${at}.src not found: ${p.src}`);
        if (!(p.caption === null || p.caption === undefined || typeof p.caption === "string")) err(`${at}.caption must be text or null`);
        if (!PHOTO_KINDS.includes(p.kind)) err(`${at}.kind must be one of ${PHOTO_KINDS.join(", ")}`);
        if (p.focus && !(Array.isArray(p.focus) && p.focus.length === 2 && p.focus.every((v) => v >= 0 && v <= 1)))
          err(`${at}.focus must be [x, y] between 0 and 1`);
      });
    }
  }
  return errors;
}
