// Pure HTML components for the Riverbay portfolio template (v2).
// Every function takes plain data and returns an HTML string. No measuring and
// no I/O: the layout engine (layout.mjs) decides which component goes where and
// positions regions and decoration in millimetres.

export const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

const mmBox = (b) =>
  `left:${b.x.toFixed(2)}mm;top:${b.y.toFixed(2)}mm;width:${b.w.toFixed(2)}mm;` + (b.h != null ? `height:${b.h.toFixed(2)}mm;` : "");

// ---- Learning indicator: Semester 1 → Semester 2 rings beside the title ----------

// The comparison ring is shown only for a Semester 2 report with a Semester 1 rating on
// the same scale. Otherwise only the current ring appears (no "Not recorded" text).
export function previousRating(ctx) {
  const prev = ctx.entry.previous;
  if (ctx.period.semester < 2 || !prev || prev.rating == null) return null;
  if (prev.rating_scale_version !== ctx.entry.rating_scale_version) return null;
  return { semester: prev.semester, rating: prev.rating };
}

function ring(ctx, semester, rating) {
  const { t, t2, theme } = ctx;
  const asset = rating == null ? theme.ratingAssets.unassessed : theme.ratingAssets[String(rating)];
  const hole = t.ringSemester
    ? `<span class="hole-zh">${esc(fill(t.ringSemester, { n: semester }))}</span>`
    : `<span class="hole-sem">${esc(t.ringSem)}</span><span class="hole-n">${esc(semester)}</span>`;
  const label = rating == null ? t.notAssessed : t.levels[String(rating)];
  const label2 = t2 ? (rating == null ? t2.notAssessed : t2.levels[String(rating)]) : null;
  return `<figure class="ring" data-rating="${rating ?? "none"}">
    <span class="ring-art"><img src="${esc(asset)}" alt=""><span class="hole">${hole}</span></span>
    <figcaption class="ring-label"><span class="ring-label-1">${esc(label)}</span>${label2 ? `<span class="ring-label-2" lang="en">${esc(label2)}</span>` : ""}</figcaption>
  </figure>`;
}

const ARROW = `<svg class="ring-arrow" viewBox="0 0 48 24" aria-hidden="true"><path d="M3 13 C 15 10, 28 14, 40 12 M31 5 C 36 8, 40 10, 43 12 C 39 15, 35 17, 31 20" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function ringRow(ctx) {
  const prev = previousRating(ctx);
  const now = ring(ctx, ctx.period.semester, ctx.entry.rating);
  return `<div class="rings">${prev ? ring(ctx, prev.semester, prev.rating) + ARROW : ""}${now}</div>`;
}

export function domainHeader(ctx) {
  const d = ctx.domain;
  return `<div class="dhead">
    <div class="dtitle">
      <p class="eyebrow">${esc(ctx.t.learningArea)}${ctx.t2 ? ` <span lang="en">${esc(ctx.t2.learningArea)}</span>` : ""}</p>
      <h1 class="domain-title">${esc(d.title)}${d.subtitle ? ` <span class="domain-subtitle" lang="en">${esc(d.subtitle)}</span>` : ""}</h1>
    </div>
    ${ringRow(ctx)}
  </div>`;
}

// ---- Page pieces ------------------------------------------------------------------

export function pageShell(ctx, kind, size) {
  const d = ctx.domain;
  return `<section class="page page--${kind}" data-domain="${esc(ctx.domainId ?? "cover")}" lang="${esc(d?.lang ?? "en")}"
    style="width:${size.w}mm;height:${size.h}mm;--tint:${d?.tint ?? ctx.tint};--tint-deep:${d?.tintDeep ?? ctx.tintDeep}">
    <div class="meadow" aria-hidden="true" style="background-image:url('${esc(ctx.theme.art.meadow)}');height:${ctx.meadowH.toFixed(2)}mm"></div>
    ${kind === "cover" || kind === "closing" ? "" : `<footer class="folio"><span class="folio-num"></span></footer>`}
  </section>`;
}

export function region(cls, b, inner = "") {
  return `<div class="region ${cls}" style="${mmBox(b)}">${inner}</div>`;
}

export function heading(ctx, key) {
  const text = ctx.t.headings?.[ctx.domainId]?.[key];
  return `<h2 class="section-heading"><img class="h-icon" src="${esc(ctx.theme.art.headingIcon)}" alt="">${esc(text)}</h2>`;
}

export function storyBlock(ctx, { cols, withHeading }) {
  return `${withHeading ? heading(ctx, "story") : ""}<div class="flow text-block" data-cols="${cols}"></div>`;
}

export function areaTab(ctx) {
  const d = ctx.domain;
  return `<p class="area-tab">${esc(d.title)}${d.subtitle ? ` <span lang="en">${esc(d.subtitle)}</span>` : ""}</p>`;
}

export function decor(src, b, cls, extra = "") {
  return `<img class="decor ${cls}" src="${esc(src)}" alt="" aria-hidden="true" style="${mmBox(b)}${extra}">`;
}

// ---- Photos -----------------------------------------------------------------------

export function photoFigure(ctx, photo, frame, index) {
  const sample = photo.kind && photo.kind !== "photo" ? ctx.t.sample[photo.kind] : null;
  const [fx, fy] = photo.focus ?? [0.5, 0.5];
  const tilt = frame.tilt ?? [-0.7, 0.5, -0.35, 0.65, -0.5, 0.4][index % 6];
  return `<figure class="moment" style="width:${frame.widthMm.toFixed(2)}mm;--tilt:${tilt.toFixed(2)}deg">
    <div class="mat">
      <span class="tape" aria-hidden="true"></span>
      <img class="photo" src="${esc(photo.resolvedSrc)}" alt="${esc(photo.alt ?? "")}"
        style="height:${frame.heightMm.toFixed(2)}mm;object-position:${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%">
      ${sample ? `<span class="sample-chip">${esc(sample)}</span>` : ""}
    </div>
    ${photo.caption ? `<figcaption class="caption text-block">${esc(photo.caption)}</figcaption>` : ""}
  </figure>`;
}

export function photoRow(figuresHtml) {
  return `<div class="moment-row">${figuresHtml}</div>`;
}

// ---- Closing page ------------------------------------------------------------------

// Option 1 (user decision, 21 Oct 2026): a fixed thank-you line, no child-specific content.
export function closingText(job, t) {
  return `<p class="closing-line">${esc(t.closingLine)}</p>
    <img class="closing-logo" src="${esc(job.theme.art.logo)}" alt="Riverbay Preschool">`;
}

// ---- Cover ------------------------------------------------------------------------

export function coverText(job, t) {
  const r = job.report;
  const period = fill(t.coverPeriod, { year: r.period.year, n: r.period.semester });
  const meta = [r.child.class_name, period].filter(Boolean).map(esc).join(" · ");
  return `<img class="cover-logo" src="${esc(job.theme.art.logo)}" alt="Riverbay Preschool">
    <p class="eyebrow">${esc(t.coverEyebrow)}</p>
    <h1 class="cover-name">${esc(r.child.display_name)}</h1>
    <p class="cover-meta">${meta}</p>
    <p class="cover-tagline">${esc(t.coverTagline)}</p>`;
}

export function coverPhoto(src, b, focus, chip) {
  const [fx, fy] = focus ?? [0.5, 0.5];
  return `<div class="region cover-photo" style="${mmBox(b)}"><img src="${esc(src)}" alt="" style="object-position:${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%">${chip ? `<span class="sample-chip">${esc(chip)}</span>` : ""}</div>`;
}

// A cream panel whose inner edge is a soft hand-drawn wave (the "half mask").
export function wavePanel(b, side) {
  const path =
    side === "right-edge"
      ? "M0 0 H86 C 92 14, 82 26, 90 40 C 98 54, 84 66, 92 80 C 99 92, 88 100, 94 100 H0 Z"
      : "M0 14 C 18 4, 36 18, 52 8 C 70 0, 84 12, 100 6 V100 H0 Z"; // "top-edge": panel below a photo
  return `<svg class="region wave-panel" style="${mmBox(b)}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="var(--paper)"/></svg>`;
}
