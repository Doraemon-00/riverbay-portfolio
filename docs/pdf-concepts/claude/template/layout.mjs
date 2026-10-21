// Deterministic layout engine (template v2). Runs inside headless Chrome after fonts
// and images have loaded. It never edits text: narratives are only split at
// word/character boundaries and the fragments are checked against the source.
//
// Per domain it tries layouts in a fixed order (theme.layout[orientation].order) and
// keeps the first that fits:
//   split  story column beside the photo column (landscape; photos on the right for
//          even domain positions, on the left for odd ones, so pages mirror)
//   stack  story in two balanced columns on top, photo row below
//   pages  story page(s) in two columns, then photo page(s)  (always succeeds)
// Decoration is placed relative to measured geometry and dropped whenever it would
// touch text, so it can never make a page unreadable.
import * as C from "./components.mjs";

const PX_PER_MM = 96 / 25.4;
const mm = (px) => px / PX_PER_MM;

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function rectMm(node, page) {
  const r = node.getBoundingClientRect();
  const p = page.getBoundingClientRect();
  return { x: mm(r.left - p.left), y: mm(r.top - p.top), w: mm(r.width), h: mm(r.height) };
}

const intersect = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// ---- Content access -----------------------------------------------------------

export function domainEntry(report, domainId) {
  const d = report.domains?.[domainId];
  if (!d) throw new Error(`Report has no ${domainId} domain`);
  return {
    rating: d.rating ?? null,
    rating_scale_version: d.rating_scale_version ?? report.rating_scale_version,
    previous: d.previous ?? null,
    feedback: d[`${domainId}_feedback`] ?? "",
    photos: d[`${domainId}_photos`] ?? [],
  };
}

function geometry(job) {
  const o = job.options.orientation;
  const P = job.theme.pages[o];
  return { o, P, L: job.theme.layout[o], x0: P.margin, x1: P.w - P.margin, top: P.top, bottom: P.h - P.bottom };
}

function makeCtx(job, domainId, index) {
  const domain = job.theme.domains[domainId];
  const t = job.strings[domain.strings];
  const secondaryKey = job.strings.secondary?.[domain.strings];
  return {
    ...geometry(job),
    domainId,
    index,
    domain,
    theme: job.theme,
    t,
    t2: secondaryKey ? job.strings[secondaryKey] : null,
    period: job.report.period,
    entry: domainEntry(job.report, domainId),
    options: job.options,
    sizes: job.sizes,
    meadowH: meadowHeight(job),
    chooser: job.chooser,
    rand: job.chooser.rand,
    log: [],
    decor: [],
  };
}

// The meadow border is drawn at full page width, keeping its proportions.
function meadowHeight(job) {
  return job.theme.art.meadowMm;
}

// ---- Preloading -----------------------------------------------------------------

function collectAssetPaths(obj, out) {
  if (typeof obj === "string" && obj.startsWith("assets/")) out.add(obj);
  else if (obj && typeof obj === "object") Object.values(obj).forEach((v) => collectAssetPaths(v, out));
}

async function preloadFonts(job) {
  const texts = [JSON.stringify(job.strings), JSON.stringify(job.theme.domains), job.report.child.display_name, job.report.child.class_name ?? ""];
  for (const id of job.options.domains) {
    const e = domainEntry(job.report, id);
    texts.push(e.feedback, ...e.photos.map((p) => p.caption ?? ""));
  }
  const all = texts.join(" ");
  const loads = [];
  for (const w of [400, 600]) loads.push(document.fonts.load(`${w} 12pt "Riverbay DM Sans"`, all));
  for (const w of [700, 800]) loads.push(document.fonts.load(`${w} 12pt "Riverbay Nunito"`, all));
  for (const w of [400, 700]) loads.push(document.fonts.load(`${w} 12pt "Riverbay Noto Sans SC"`, all));
  await Promise.all(loads);
  await document.fonts.ready;
}

async function preloadImages(job) {
  const urls = new Set();
  collectAssetPaths(job.theme, urls);
  for (const lane of Object.values(job.theme.art.lane)) {
    urls.delete(lane.src);
    urls.add(`${lane.src}.png`);
    urls.add(`${lane.src}.mirrored.png`);
  }
  for (const id of job.options.domains) for (const p of domainEntry(job.report, id).photos) urls.add(p.resolvedSrc);
  if (job.report.cover_photo?.resolvedSrc) urls.add(job.report.cover_photo.resolvedSrc);
  const sizes = {};
  await Promise.all(
    [...urls].map(async (u) => {
      const img = new Image();
      img.src = u;
      await img.decode();
      sizes[u] = { w: img.naturalWidth, h: img.naturalHeight, aspect: img.naturalWidth / img.naturalHeight };
    }),
  );
  return sizes;
}

// ---- Text flow --------------------------------------------------------------------

const CLOSING = new Set("，。、；：？！）》」』”’…—·．,.;:?!)]}%");
const OPENING = new Set("（《「『“‘([{");

function breakPoints(text, lang) {
  const out = [];
  if (lang.startsWith("zh")) {
    const seg = new Intl.Segmenter("zh-Hans", { granularity: "word" });
    for (const s of seg.segment(text)) {
      const i = s.index;
      if (i === 0) continue;
      if (CLOSING.has(text[i]) || OPENING.has(text[i - 1])) continue;
      out.push(i);
    }
  } else {
    for (let i = 1; i < text.length; i++) if (/\s/.test(text[i - 1]) && !/\s/.test(text[i])) out.push(i);
  }
  return out;
}

// A one-column flow overflows downwards; a two-column flow overflows into extra columns.
const overflows = (f) => (f.dataset.cols === "2" ? f.scrollWidth > f.clientWidth + 1 : f.scrollHeight > f.clientHeight + 0.5);

function lineCount(p) {
  const lh = parseFloat(getComputedStyle(p).lineHeight);
  return Math.round([...p.getClientRects()].reduce((s, r) => s + r.height, 0) / lh);
}

function makeParagraph(item) {
  const p = document.createElement("p");
  if (item.cont) p.classList.add("cont");
  p.textContent = item.text;
  return p;
}

// Place as much of `queue` as fits in `flow`. Mutates queue; returns placed fragments.
function fillFlow(flow, queue, lang, log) {
  const placed = [];
  while (queue.length) {
    const item = queue[0];
    const p = makeParagraph(item);
    flow.appendChild(p);
    if (!overflows(flow)) {
      placed.push(item);
      queue.shift();
      continue;
    }
    const points = breakPoints(item.text, lang);
    let lo = 0;
    let hi = points.length - 1;
    let best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      p.textContent = item.text.slice(0, points[mid]);
      if (!overflows(flow)) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (best >= 0) p.textContent = item.text.slice(0, points[best]);
    if (best < 0 || lineCount(p) < 2) {
      flow.removeChild(p);
      log.push(`moved whole paragraph to the next page (${item.text.length} chars)`);
      break;
    }
    const probe = makeParagraph({ text: item.text.slice(points[best]), cont: true });
    flow.appendChild(probe);
    const remainderLines = lineCount(probe);
    flow.removeChild(probe);
    if (remainderLines < 2) {
      const target = lineCount(p) - 1;
      while (best > 0 && lineCount(p) > target) {
        best--;
        p.textContent = item.text.slice(0, points[best]);
      }
    }
    const cut = points[best];
    p.classList.add("split");
    placed.push({ text: item.text.slice(0, cut), cont: item.cont });
    queue[0] = { text: item.text.slice(cut), cont: true };
    log.push(`split paragraph at char ${cut} of ${item.text.length}`);
    break;
  }
  return placed;
}

// Re-balance a two-column flow and shrink it to its content. Reverts if anything overflows.
// Short text (at most 4 lines per balanced column) reads better as one column of normal
// measure, so it is switched to a single column capped at singleColumnMm.
function balance(flow, singleColumnMm = 125) {
  if (flow.dataset.cols !== "2") return;
  const h = flow.clientHeight;
  flow.classList.add("balanced");
  flow.style.maxHeight = `${h}px`;
  if (overflows(flow)) {
    flow.classList.remove("balanced");
    flow.style.maxHeight = "";
    return;
  }
  const p = flow.querySelector("p");
  const lh = p ? parseFloat(getComputedStyle(p).lineHeight) : 0;
  if (lh && flow.clientHeight <= 4.5 * lh) {
    flow.dataset.cols = "1";
    flow.classList.remove("balanced");
    flow.classList.add("short");
    flow.style.maxWidth = `${singleColumnMm}mm`;
    flow.style.maxHeight = `${h}px`;
    if (overflows(flow)) {
      flow.dataset.cols = "2";
      flow.classList.remove("short");
      flow.classList.add("balanced");
      flow.style.maxWidth = "";
    }
  }
}

// ---- Photos ---------------------------------------------------------------------

const MAT_MM = 2.7; // mat padding 2.4mm + border 0.3mm (portfolio.css)

function rowPlan(photos, cfg, singleRow, widthMm = Infinity) {
  if (singleRow) return [photos.map((_, i) => i)];
  const plan = cfg.rowPlans[String(photos.length)];
  if (plan === "pairs") return photos.every((p) => p.aspect >= 1.05) && widthMm < cfg.pairRowMinWidthMm ? [[0], [1]] : [[0, 1]];
  return plan;
}

function rowHeight(row, photos, widthMm, cfg) {
  const sumAspect = row.reduce((s, i) => s + photos[i].frameAspect, 0);
  return (widthMm - row.length * 2 * MAT_MM - (row.length - 1) * cfg.gapMm) / sumAspect;
}

function buildPhotoBlock(ctx, photos, rows, heights, offset) {
  const block = el(`<div class="moments"></div>`);
  rows.forEach((row, r) => {
    const figs = row
      .map((i, j) => C.photoFigure(ctx, photos[i], { widthMm: heights[r] * photos[i].frameAspect + 2 * MAT_MM, heightMm: heights[r] }, offset + rows.slice(0, r).flat().length + j))
      .join("");
    block.appendChild(el(C.photoRow(figs)));
  });
  return block;
}

// Fit rows into `availMm`. Rows start at their natural height (full width, capped); if the
// block is too tall, a common height ceiling is lowered (binary search), so the tallest
// rows shrink first and short rows keep their size. No row goes below the minimum height
// (or its natural height, if that is smaller). Returns the placed block or null.
function fitRows(ctx, container, photos, rows, availMm, offset = 0) {
  const cfg = ctx.theme.photos;
  const widthMm = mm(container.clientWidth);
  const cap = cfg.maxRowHeightMm[String(Math.min(rows.length, 3))];
  const natural = rows.map((row) => Math.min(rowHeight(row, photos, widthMm, cfg), cap));
  const floor = natural.map((h) => Math.min(cfg.minRowHeightMm, h));
  const tryCeiling = (ceil) => {
    const heights = natural.map((h, r) => Math.max(floor[r], Math.min(h, ceil)));
    const block = buildPhotoBlock(ctx, photos, rows, heights, offset);
    container.appendChild(block);
    if (mm(block.getBoundingClientRect().height) <= availMm + 0.1) return block;
    container.removeChild(block);
    return null;
  };
  const top = Math.max(...natural);
  const full = tryCeiling(top);
  if (full) return full;
  let lo = cfg.minRowHeightMm;
  let hi = top;
  let ok = null;
  const atFloor = tryCeiling(lo);
  if (!atFloor) return null;
  container.removeChild(atFloor);
  ok = lo;
  for (let i = 0; i < 9 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    const block = tryCeiling(mid);
    if (block) {
      container.removeChild(block);
      ok = lo = mid;
    } else hi = mid;
  }
  return tryCeiling(ok);
}

// Candidate row arrangements for k photos, always in the teacher's order. The theme's
// default plan comes first. Two photos share a row unless both are landscape in a narrow
// column (theme photos.pairRowMinWidthMm); there is no other two-photo option.
function candidatePlans(group, cfg, widthMm, { singleRow = true } = {}) {
  const k = group.length;
  const seq = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
  const plans = [rowPlan(group, cfg, false, widthMm)];
  if (singleRow && k <= 4 && widthMm / k >= 55) plans.push([seq(0, k)]);
  if (k === 3) plans.push([[0, 1], [2]], [[0], [1], [2]]);
  if (k === 4) plans.push([[0], [1, 2, 3]]);
  if (k === 5) plans.push([[0, 1, 2], [3, 4]]);
  if (k === 6) plans.push([[0, 1], [2, 3], [4, 5]]);
  const seen = new Set();
  return plans.filter((pl) => !seen.has(JSON.stringify(pl)) && seen.add(JSON.stringify(pl)));
}

// Fit `group` using the arrangement that gives the photos the most printed area. Another
// arrangement replaces the default only when it is at least 15% larger, so the familiar
// default wins near-ties. Returns the placed block, or null when nothing fits.
function bestFit(ctx, container, group, availMm, offset = 0, opts = {}) {
  const plans = candidatePlans(group, ctx.theme.photos, mm(container.clientWidth), opts);
  let best = null;
  const tried = [];
  plans.forEach((plan, i) => {
    const block = fitRows(ctx, container, group, plan, availMm, offset);
    const name = plan.map((r) => r.length).join("+");
    if (!block) return tried.push(`${name}: no fit`);
    if (opts.minSide && smallestSide(block) < opts.minSide) {
      container.removeChild(block);
      return tried.push(`${name}: photos below ${opts.minSide} mm`);
    }
    const area = [...block.querySelectorAll(".photo")].reduce((a, img) => a + img.getBoundingClientRect().width * img.getBoundingClientRect().height, 0);
    container.removeChild(block);
    tried.push(`${name}: ${Math.round(mm(1) * mm(1) * area)} mm2`);
    const score = i === 0 ? area * 1.15 : area;
    if (!best || score > best.score) best = { plan, score, i };
  });
  if (!best) {
    if (opts.minSide) ctx.log.push(`no arrangement of ${group.length} keeps every photo at ${opts.minSide} mm or more [${tried.join("; ")}]`);
    return null;
  }
  ctx.log.push(`arranged ${group.length} photos as rows of ${best.plan.map((r) => r.length).join("+")} [${tried.join("; ")}]`);
  return fitRows(ctx, container, group, best.plan, availMm, offset);
}

function placeLeading(ctx, container, photos, start, availMm) {
  for (let k = photos.length - start; k >= 1; k--) {
    const group = photos.slice(start, start + k);
    if (bestFit(ctx, container, group, availMm, start)) return k;
  }
  return 0;
}

// Photos pulled up under a story sit side by side in one row. A group that would leave
// exactly one photo for its own page gives one up, so no photo is stranded alone.
function placeRow(ctx, container, photos, availMm) {
  const max = Math.min(photos.length, ctx.o === "landscape" ? 4 : 3);
  for (let k = max; k >= 1; k--) {
    if (k > 1 && photos.length - k === 1) continue;
    const group = photos.slice(0, k);
    const block = fitRows(ctx, container, group, rowPlan(group, ctx.theme.photos, true), availMm, 0);
    if (block && smallestSide(block) >= ctx.theme.photos.minPhotoMm[ctx.o]) return k;
    if (block) container.removeChild(block);
  }
  return 0;
}

function preparePhotos(ctx) {
  const cfg = ctx.theme.photos;
  return ctx.entry.photos.map((p) => {
    const s = ctx.sizes[p.resolvedSrc];
    const frameAspect = Math.min(cfg.maxAspect, Math.max(cfg.minAspect, s.aspect));
    return { ...p, aspect: s.aspect, frameAspect, cropLoss: 1 - Math.min(frameAspect / s.aspect, s.aspect / frameAspect), pixels: `${s.w}x${s.h}` };
  });
}

// ---- Seeded choices -------------------------------------------------------------------

// Every report gets its own seed (child, year, semester), so different children get
// slightly different booklets, while the same report always lays out identically and the
// preview matches the PDF. Choices lean away from repeats: once an option is used, its
// weight is multiplied by `damp`, so the alternatives become more likely but never certain.
function hashString(s) {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeChooser(seed, damp) {
  const rand = mulberry32(hashString(seed));
  const weights = {};
  const history = [];
  return {
    rand,
    history,
    // Seeded order of `options`: the first is the weighted pick (and is damped), the rest follow.
    order(group, options) {
      if (options.length < 2) return [...options];
      const w = (weights[group] ??= {});
      for (const o of options) w[o] ??= 1;
      const total = options.reduce((s, o) => s + w[o], 0);
      let r = rand() * total;
      let chosen = options[options.length - 1];
      for (const o of options) {
        r -= w[o];
        if (r < 0) {
          chosen = o;
          break;
        }
      }
      const odds = options.map((o) => `${o} ${Math.round((100 * w[o]) / total)}%`).join(", ");
      w[chosen] *= damp;
      history.push(`${group}: ${chosen} (odds ${odds})`);
      return [chosen, ...options.filter((o) => o !== chosen)];
    },
  };
}

// ---- Minimum photo size ---------------------------------------------------------------

// The shortest printed side of any photo in a block, in mm (layout size, before tilt).
function smallestSide(block) {
  const sides = [...block.querySelectorAll(".photo")].map((img) => Math.min(mm(img.offsetWidth), mm(img.offsetHeight)));
  return sides.length ? Math.min(...sides) : Infinity;
}

// ---- Slot (collage) placement ---------------------------------------------------------

// Slots are [x, y, w, h, ax, ay] as fractions of the region: each photo is fitted inside
// its slot keeping its shape (with its caption below), then positioned inside the slot by
// the anchor (ax, ay from 0 to 1). Slots never overlap, so photos never overlap. Each
// photo gets a seeded tilt, alternating direction. Returns the block, or null when a photo
// would print smaller than `minSide`.
function placeSlots(ctx, region, photos, slots, { minSide = 0, offset = 0, tiltMin = 1, tiltMax = 3.5 } = {}) {
  const R = { w: mm(region.clientWidth), h: mm(region.clientHeight) };
  const block = el(`<div class="moments collage"></div>`);
  region.appendChild(block);
  const sign = ctx.rand() < 0.5 ? -1 : 1;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const [sx, sy, sw0, sh0, ax, ay] = slots[i];
    const sw = sw0 * R.w;
    const sh = sh0 * R.h;
    const tilt = (i % 2 ? -sign : sign) * (tiltMin + ctx.rand() * (tiltMax - tiltMin));
    let w = Math.min(sw - 2 * MAT_MM, (sh - 2 * MAT_MM) * p.frameAspect);
    let fig = null;
    for (let iter = 0; iter < 4; iter++) {
      fig = el(C.photoFigure(ctx, p, { widthMm: w + 2 * MAT_MM, heightMm: w / p.frameAspect, tilt }, offset + i));
      fig.classList.add("moment--placed");
      block.appendChild(fig);
      const fh = mm(fig.getBoundingClientRect().height);
      if (fh <= sh + 0.1) break;
      block.removeChild(fig);
      const extra = fh - w / p.frameAspect; // mat and caption
      w = Math.min(w * 0.97, (sh - extra) * p.frameAspect);
      fig = null;
    }
    if (!fig || Math.min(w, w / p.frameAspect) < minSide) {
      ctx.log.push(`slot ${i + 1} of ${photos.length}: ${fig ? `photo would be ${Math.min(w, w / p.frameAspect).toFixed(0)} mm, below ${minSide} mm` : "does not fit its slot"}`);
      region.removeChild(block);
      return null;
    }
    const fw = mm(fig.getBoundingClientRect().width);
    const fh = mm(fig.getBoundingClientRect().height);
    fig.style.left = `${(sx * R.w + (sw - fw) * ax).toFixed(2)}mm`;
    fig.style.top = `${(sy * R.h + (sh - fh) * ay).toFixed(2)}mm`;
  }
  return block;
}

const mirrorSlots = (slots) => slots.map(([x, y, w, h, ax, ay]) => [1 - x - w, y, w, h, 1 - ax, ay]);
const transposeSlots = (slots) => slots.map(([x, y, w, h, ax, ay]) => [y, x, h, w, ay, ax]);

// Two photos beside the story, staggered down the column like a scrapbook (user decision,
// 21 Oct 2026). The seed picks which side the top photo sits on.
function placeStagger(ctx, region, photos, minSide) {
  if (photos.length !== 2) return null;
  const [s0, s1] = ctx.theme.photos.stagger;
  const side = ctx.chooser.order("stagger", ["top-left", "top-right"])[0];
  const slotsFor = (share) => {
    const base = [[s0[0], 0, s0[2], share, s0[4], s0[5]], [s1[0], share, s1[2], 1 - share, s1[4], s1[5]]];
    return side === "top-left" ? base : mirrorSlots(base);
  };
  // Split the column height between the two photos so the smaller one is as large as
  // possible (shape and caption length both matter), between 30% and 70%.
  let best = null;
  for (let share = 0.3; share <= 0.701; share += 0.05) {
    const block = placeSlots(ctx, region, photos, slotsFor(share));
    if (!block) continue;
    const side_ = smallestSide(block);
    region.removeChild(block);
    if (!best || side_ > best.side) best = { share, side: side_ };
  }
  if (!best || best.side < minSide) {
    ctx.log.push(`staggered pair would print a photo at ${best ? best.side.toFixed(0) : "?"} mm, below ${minSide} mm`);
    return null;
  }
  const block = placeSlots(ctx, region, photos, slotsFor(best.share), { minSide: minSide - 0.5, tiltMin: 1, tiltMax: 2.5 });
  if (block) ctx.log.push(`staggered 2 photos, top one ${side.replace("top-", "")}, height split ${Math.round(best.share * 100)}/${Math.round(100 - best.share * 100)}`);
  return block;
}

// Photos beside the story: the staggered pair for two, otherwise the best grid; every
// photo must stay above the minimum size.
function placeBeside(ctx, region, photos, availMm) {
  const minSide = ctx.theme.photos.minPhotoMm[ctx.o];
  return placeStagger(ctx, region, photos, minSide) ?? bestFit(ctx, region, photos, availMm, 0, { minSide });
}

// ---- Photos-only pages ----------------------------------------------------------------

function photoPageStyles(ctx) {
  const pp = ctx.theme.art.photoPage ?? {};
  const styles = [];
  if (pp.line && pp.peg && ctx.theme.anchors["rb2-photo-line"]?.curve) styles.push("line");
  if (Object.keys(pp.cameras ?? {}).length) styles.push("camera");
  return styles;
}

// The twine's height on the page at x (mm), from the curve measured on the asset.
function twineY(curve, box, xMm) {
  const f = Math.min(1, Math.max(0, (xMm - box.x) / box.w));
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (f <= x1) return box.y + (y0 + ((f - x0) / (x1 - x0 || 1)) * (y1 - y0)) * box.h;
  }
  return box.y + curve[curve.length - 1][1] * box.h;
}

// Washing-line style: twine across the page, photos hanging from it on pegs.
function hangOnLine(ctx, page, region, photos, offset, lineTop) {
  const pp = ctx.theme.art.photoPage;
  const anchor = ctx.theme.anchors["rb2-photo-line"];
  const box = { x: 0, y: lineTop, w: ctx.P.w, h: ctx.P.w / anchor.aspect };
  const twine = tryDecor(ctx, page, pp.line, box, "decor--bg decor--line", { why: "photo line" });
  if (!twine) return null;
  const R = rectMm(region, page);
  const n = photos.length;
  // Each photo hangs with its top edge level with the twine's lowest point over the
  // photo's width, so the twine never crosses the picture; the peg bridges the twine
  // and the photo's top edge.
  const slots = photos.map((_, i) => {
    const x0 = R.x + (i / n + 0.06) * R.w;
    const x1 = R.x + ((i + 1) / n - 0.06) * R.w;
    const low = Math.max(...Array.from({ length: 9 }, (_, k) => twineY(anchor.curve, box, x0 + (k / 8) * (x1 - x0))));
    const y = Math.max(0, (low + 0.5 - R.y) / R.h);
    return [i / n + 0.02, y, 1 / n - 0.04, Math.min(0.9, 1 - y), 0.5, 0];
  });
  const block = placeSlots(ctx, region, photos, slots, { minSide: ctx.theme.photos.minPhotoMm[ctx.o], offset, tiltMin: 0.5, tiltMax: 2 });
  // Pegs replace the paper tape on a washing line: one fastener per photo.
  block?.querySelectorAll(".tape").forEach((t) => t.remove());
  if (!block) {
    twine.remove();
    ctx.decor.splice(ctx.decor.lastIndexOf("photo line"), 1);
    return null;
  }
  // Each photo hangs from one front-facing peg at its centre. The photo pivots on its top
  // centre and tilts to the twine's slope there, so its top edge runs parallel to the twine
  // with an even gap; because the twine sags (it lies above its own tangent), it never
  // crosses the picture. The peg has one fixed size: its upper third covers the twine and
  // its lower third the photo's top edge.
  const peg = ctx.theme.art.photoPage.pegMm;
  const pa = ctx.sizes[pp.peg].aspect;
  for (const fig of block.querySelectorAll(".moment")) {
    const mat = fig.querySelector(".mat");
    const m = rectMm(mat, page);
    const f = rectMm(fig, page);
    const cx = m.x + m.w / 2;
    const ty = twineY(anchor.curve, box, cx);
    const slope = (twineY(anchor.curve, box, cx + 3) - twineY(anchor.curve, box, cx - 3)) / 6;
    // Follow the twine, but never more than maxTiltDeg; if the cap leaves the twine close
    // to a far corner, the photo hangs a little lower (the peg still reaches it).
    const cap = ctx.theme.art.photoPage.maxTiltDeg;
    const angle = Math.max(-cap, Math.min(cap, (Math.atan(slope) * 180) / Math.PI));
    const tan = Math.tan((angle * Math.PI) / 180);
    mat.style.transformOrigin = "50% 0";
    fig.style.setProperty("--tilt", `${angle.toFixed(2)}deg`);
    const clear = Math.max(...Array.from({ length: 11 }, (_, k) => {
      const x = m.x + (k / 10) * m.w;
      return twineY(anchor.curve, box, x) - (x - cx) * tan + 1;
    }));
    const want = Math.min(Math.max(ty + peg * 0.36, clear), ty + peg * 0.6);
    const dy = Math.min(want - m.y, R.y + R.h - (f.y + f.h));
    fig.style.top = `${(parseFloat(fig.style.top) + dy).toFixed(2)}mm`;
    const w = peg * pa;
    tryDecor(ctx, page, pp.peg, { x: cx - w / 2, y: ty - peg * 0.3, w, h: peg }, "decor--peg", {
      photoAllowance: 0.05, why: "peg", quiet: true, extra: `;transform:rotate(${angle.toFixed(2)}deg);transform-origin:50% 30%`,
    });
  }
  return block;
}

// Camera style: one camera animal in a free corner of the photo area, if one fits.
function cameraDecor(ctx, page, region) {
  const cams = ctx.theme.art.photoPage.cameras;
  for (const kind of ctx.chooser.order("camera", Object.keys(cams))) {
    const { src, side } = cams[kind];
    const R = rectMm(region, page);
    const a = ctx.sizes[src].aspect;
    for (const H of [56, 48, 40]) {
      const w = H * a;
      const left = [[R.x, R.y + R.h - H], [R.x, R.y]];
      const right = [[R.x + R.w - w, R.y + R.h - H], [R.x + R.w - w, R.y]];
      const spots = side === "right" ? [...right, ...left] : [...left, ...right];
      for (const [x, y] of spots) if (tryDecor(ctx, page, src, { x, y, w, h: H }, "decor--camera", { photoAllowance: 0.02, why: `${kind} with camera`, quiet: true })) return true;
    }
  }
  ctx.log.push("skipped camera animal (no free corner)");
  return false;
}

// A page of photos only: no grid. The seed picks a scattered arrangement (theme
// photos.collage) and a style: the washing line with pegs, or a camera animal; both lean
// away from repeats. Falls back to the plain grid if no arrangement keeps every photo
// above the minimum size.
function layoutPhotoPages(ctx, book, photos, offset, { heading = true } = {}) {
  const { L, P, x0, x1, top, bottom } = ctx;
  const pages = [];
  let start = 0;
  let first = heading;
  while (start < photos.length) {
    const page = newPage(ctx, book, "photos");
    pages.push(page);
    addRegion(page, "tab", { x: x0, y: top, w: x1 - x0, h: 8 }, C.areaTab(ctx));
    let pTop = top + 12;
    let lineTop = top + 9;
    if (first) {
      const ph = addRegion(page, "photo-heading", { x: x0, y: top + 8, w: x1 - x0, h: 14 }, C.heading(ctx, "photos"));
      const r = rectMm(ph.querySelector(".section-heading"), page);
      lineTop = r.y + r.h + 2;
      pTop = L.photoPageTopMm;
    }
    const styles = photoPageStyles(ctx);
    const style = styles.length ? ctx.chooser.order("photo page", styles)[0] : "plain";
    const remaining = photos.slice(start);
    let placed = 0;
    let used = style;
    if (style === "line") {
      const anchor = ctx.theme.anchors["rb2-photo-line"];
      const sag = Math.max(...anchor.curve.map(([, y]) => y)) * (P.w / anchor.aspect);
      const regionTop = Math.max(pTop, lineTop + sag * 0.5);
      const pr = addRegion(page, "photos", { x: x0, y: regionTop, w: x1 - x0, h: bottom - regionTop });
      for (let k = Math.min(remaining.length, 4); k >= 1 && !placed; k--) if (hangOnLine(ctx, page, pr, remaining.slice(0, k), offset + start, lineTop)) placed = k;
      if (!placed) {
        pr.remove();
        used = styles.includes("camera") ? "camera" : "plain";
        ctx.log.push("washing line did not fit; using the scattered arrangement");
      }
    }
    let pr = page.querySelector(".region.photos");
    if (!placed) {
      pr = addRegion(page, "photos", { x: x0, y: pTop, w: x1 - x0, h: bottom - pTop });
      const minSide = ctx.theme.photos.minPhotoMm[ctx.o];
      for (let k = Math.min(remaining.length, 4); k >= 1 && !placed; k--) {
        const group = remaining.slice(0, k);
        const templates = ctx.theme.photos.collage[String(k)] ?? {};
        for (const name of ctx.chooser.order(`collage-${k}`, Object.keys(templates))) {
          const slots = ctx.o === "portrait" ? transposeSlots(templates[name]) : templates[name];
          if (placeSlots(ctx, pr, group, slots, { minSide, offset: offset + start })) {
            placed = k;
            ctx.log.push(`photo page: ${k} photo(s) as "${name}"`);
            break;
          }
        }
      }
      if (!placed) {
        placed = placeLeading(ctx, pr, photos, start, bottom - pTop);
        pr.classList.add("photos--centred");
        used = "plain";
        ctx.log.push("photo page: grid fallback");
      }
      if (!placed) throw new Error("A photo cannot fit on an empty page");
    }
    // A camera animal joins the camera style always, and a washing-line page when it is sparse.
    if (styles.includes("camera") && (used === "camera" || (used === "line" && coverage(ctx, page) < ctx.theme.decor.sparseBelow))) cameraDecor(ctx, page, pr);
    ctx.log.push(`photo page style: ${used === "line" ? "washing line" : used === "camera" ? "camera animal" : "plain"}`);
    const offers = { runner: () => runnerDecor(ctx, page, { x: x0, w: x1 - x0 }) };
    if (used !== "line" && first) {
      const hr = rectMm(page.querySelector(".section-heading"), page);
      offers.top = () => topDecor(ctx, page, { x: hr.x + hr.w + 12, y: 0, w: x1 - (hr.x + hr.w + 12), h: pTop - 3 });
    }
    applyDecor(ctx, page, offers);
    start += placed;
    first = false;
  }
  return pages;
}

// ---- Pages and regions ----------------------------------------------------------

function newPage(ctx, book, kind) {
  const page = el(C.pageShell(ctx, kind, { w: ctx.P.w, h: ctx.P.h }));
  book.appendChild(page);
  return page;
}

function addRegion(page, cls, b, inner) {
  const r = el(C.region(cls, b, inner));
  page.appendChild(r);
  return r;
}

function storyRegion(ctx, page, b, cols, withHeading) {
  const r = addRegion(page, "story", b, C.storyBlock(ctx, { cols, withHeading }));
  return r.querySelector(".flow");
}

// ---- Decoration -----------------------------------------------------------------

const TEXT_SELECTOR = ".flow p, .caption, .dtitle, .rings, .section-heading, .area-tab, .folio-num, .cover-text > *, .closing-text > *";

// Add a decoration; keep it only if it touches no text and (for non-background art)
// covers at most `photoAllowance` of any photo. Returns the element or null.
function tryDecor(ctx, page, src, b, cls, { photoAllowance = 0, extra = "", before = null, why = "", quiet = false } = {}) {
  const img = el(C.decor(src, b, cls, extra));
  before ? page.insertBefore(img, before) : page.appendChild(img);
  const r = rectMm(img, page);
  const hitsText = [...page.querySelectorAll(TEXT_SELECTOR)].some((t) => intersect(r, rectMm(t, page)) > 0.5);
  const photoHit = cls.includes("decor--bg")
    ? 0
    : Math.max(0, ...[...page.querySelectorAll(".moment .photo")].map((p) => {
        const pr = rectMm(p, page);
        return intersect(r, pr) / (pr.w * pr.h);
      }));
  const offPage = r.x < -0.5 || r.y < -0.5 || r.x + r.w > ctx.P.w + 0.5 || r.y + r.h > ctx.P.h + 0.5;
  if (hitsText || photoHit > photoAllowance || offPage) {
    img.remove();
    if (!quiet) ctx.log.push(`skipped ${why || cls} (${hitsText ? "would touch text" : offPage ? "off page" : "would cover a photo"})`);
    return null;
  }
  ctx.decor.push(why || cls);
  return img;
}

// Each decoration function returns true when it placed something.

function topDecor(ctx, page, b) {
  const kind = ctx.domain.top;
  if (!kind || b.w < 30 || b.h < 10) return false;
  const src = ctx.theme.art[kind];
  const a = ctx.sizes[src].aspect;
  let w = b.w;
  let h = w / a;
  if (h > b.h) {
    h = b.h;
    w = h * a;
  }
  return !!tryDecor(ctx, page, src, { x: b.x + (b.w - w) / 2, y: 0, w, h }, `decor--top decor--${kind}`, { why: kind });
}

// A climbing vine must be rooted in the meadow and reach the top edge of the page, so it
// never starts or ends in mid-air. Copies are stacked; each copy is shifted so its stem
// base meets the stem tip of the copy below (stem positions measured in theme.json).
// If any copy would touch text, the whole vine is left out.
function climberDecor(ctx, page, lane, side, key, spec) {
  if (!spec.stem) {
    ctx.log.push(`skipped ${key} (no stem geometry for stacking)`);
    return false;
  }
  const src = `${spec.src}${side === "right" ? ".mirrored" : ""}.png`;
  const a = ctx.sizes[src].aspect;
  const yBottom = ctx.P.h - ctx.meadowH * 0.45;
  const step = spec.stem.top - spec.stem.bottom; // fraction of width per copy
  const wMax = lane.w - 4;
  let n = Math.max(1, Math.ceil(yBottom / (wMax / a)));
  let w = (yBottom / n) * a;
  while (w * (1 + (n - 1) * Math.abs(step)) > lane.w && n < 12) {
    n++;
    w = (yBottom / n) * a;
  }
  const h = yBottom / n;
  const dir = side === "right" ? -1 : 1;
  const baseX = side === "right" ? lane.x + lane.w - w - 1 : lane.x + 1; // lane reaches the page edge
  const placedEls = [];
  for (let i = 0; i < n; i++) {
    const img = tryDecor(ctx, page, src, { x: baseX + dir * i * step * w, y: yBottom - (i + 1) * h, w, h }, "decor--climber", { photoAllowance: 0.03, why: `${key} ${i + 1}/${n}`, quiet: true });
    if (!img) {
      placedEls.forEach((e) => e.remove());
      ctx.decor.splice(ctx.decor.length - placedEls.length, placedEls.length);
      ctx.log.push(`skipped ${key} (it could not reach from the meadow to the top edge without touching text)`);
      return false;
    }
    placedEls.push(img);
  }
  ctx.decor.splice(ctx.decor.length - n, n, key);
  return true;
}

// Lane beside the photos: a hanging animal gripping the outer photo's top corner (its
// strand drops from the top edge), or a climbing vine from the meadow to the top edge.
function laneDecor(ctx, page, lane, side, firstMat) {
  for (const key of ctx.domain.lane) {
    const spec = ctx.theme.art.lane[key];
    if (spec.kind === "hanging") {
      if (!firstMat) continue;
      const name = side === "right" ? `${spec.src}.mirrored` : spec.src;
      const anchor = ctx.theme.anchors[name.replace("assets/art/", "")];
      const corner = { x: side === "right" ? firstMat.x + firstMat.w : firstMat.x, y: firstMat.y };
      const h = corner.y / anchor.grip[1];
      if (h < spec.minMm || h > spec.maxMm) {
        ctx.log.push(`skipped ${key} (needs ${h.toFixed(0)} mm, allowed ${spec.minMm}-${spec.maxMm})`);
        continue;
      }
      const w = h * anchor.aspect;
      if (tryDecor(ctx, page, `${name}.png`, { x: corner.x - anchor.grip[0] * w, y: 0, w, h }, "decor--hanging", { photoAllowance: 0.03, why: key })) return true;
    } else if (climberDecor(ctx, page, lane, side, key, spec)) return true;
  }
  return false;
}

// The river winds behind the photos. If the photos would hide most of it, only stray
// blue fragments would show, so it is left out and the budget slot goes to the next piece.
function riverDecor(ctx, page, b, before) {
  if (!ctx.domain.river) return false;
  const src = b.w > b.h ? ctx.theme.art.riverLandscape : ctx.theme.art.riverPortrait;
  const img = tryDecor(ctx, page, src, b, "decor--bg decor--river", { extra: ";object-fit:cover", before, why: "river" });
  if (!img) return false;
  const r = rectMm(img, page);
  const covered = [...page.querySelectorAll(".moment .mat")].reduce((sum, m) => sum + intersect(r, rectMm(m, page)), 0);
  const visible = 1 - covered / (r.w * r.h);
  if (visible < ctx.theme.decor.riverMinVisible) {
    img.remove();
    ctx.decor.splice(ctx.decor.lastIndexOf("river"), 1);
    ctx.log.push(`skipped river (only ${Math.round(visible * 100)}% would show around the photos)`);
    return false;
  }
  return true;
}

function runnerDecor(ctx, page, range, which = ctx.domain.runner) {
  if (!which) return false;
  const src = ctx.theme.art.runner[which];
  const h = 12;
  const w = h * ctx.sizes[src].aspect;
  const y = ctx.P.h - ctx.meadowH * 0.5 - h;
  return !!tryDecor(ctx, page, src, { x: range.x + range.w * 0.55 - w / 2, y, w, h }, "decor--runner", { why: `${which} on the meadow` });
}

// Subject mascot in the free space under the story, aligned to `align` ("left"/"right").
function mascotDecor(ctx, page, flow, region, align) {
  const reg = rectMm(region, page);
  const pr = page.getBoundingClientRect();
  const rects = [...flow.querySelectorAll("p")].flatMap((p) => [...p.getClientRects()].map((r) => ({ x: mm(r.left - pr.left), bottom: mm(r.bottom - pr.top) })));
  if (!rects.length) return false;
  const unbalanced = flow.dataset.cols === "2" && !flow.classList.contains("balanced");
  const last = rects[rects.length - 1];
  const freeTop = unbalanced ? last.bottom : Math.max(...rects.map((r) => r.bottom));
  const freeX = unbalanced ? last.x : reg.x;
  return mascotInBox(ctx, page, { x: freeX, y: freeTop + 4, w: reg.x + reg.w - freeX, h: reg.y + reg.h - freeTop - 4 }, align);
}

// The subject mascot appears once per subject, at the bottom of a free box; scaled up
// (to 1.5x) on pages without photos, never below 75% of its normal size.
function mascotInBox(ctx, page, box, align, scale = 1) {
  const m = ctx.domain.mascot;
  if (!m || ctx.decor.includes("mascot")) return false;
  const a = ctx.sizes[m.src].aspect;
  const h = Math.min(m.heightMm * scale, box.h, (box.w - 2) / a);
  if (h < m.heightMm * 0.75) {
    ctx.log.push("skipped mascot (not enough free space)");
    return false;
  }
  const w = h * a;
  const x = align === "left" ? box.x : box.x + box.w - w;
  return !!tryDecor(ctx, page, m.src, { x, y: box.y + box.h - h, w, h }, "decor--mascot", { why: "mascot" });
}

function peekingDecor(ctx, page, region) {
  const mats = [...region.querySelectorAll(".mat")];
  if (!mats.length) return false;
  const mat = rectMm(mats[mats.length - 1], page);
  const src = ctx.theme.art.peeking;
  const w = Math.min(30, mat.w * 0.45);
  const h = w / ctx.sizes[src].aspect;
  return !!tryDecor(ctx, page, src, { x: mat.x + mat.w - w - 6, y: mat.y - h + 1.6, w, h }, "decor--peeking", { why: "peeking squirrel" });
}

// Share of the page body covered by text and photos.
function coverage(ctx, page) {
  const pr = page.getBoundingClientRect();
  let area = 0;
  page.querySelectorAll(".flow p, .caption").forEach((p) => {
    for (const r of p.getClientRects()) area += mm(r.width) * mm(r.height);
  });
  page.querySelectorAll(".moment .mat, .dhead").forEach((n) => {
    const r = rectMm(n, page);
    area += r.w * r.h;
  });
  return area / ((ctx.x1 - ctx.x0) * (ctx.bottom - ctx.top));
}

// Decoration is a budget, not a checklist: each subject lists its decorations in priority
// order (theme.domains.<id>.decor); a page takes at most `budget` of them, or `sparseBudget`
// when text and photos cover less than `sparseBelow` of the page body.
function applyDecor(ctx, page, offers) {
  const cfg = ctx.theme.decor;
  const cov = coverage(ctx, page);
  const sparse = cov < cfg.sparseBelow;
  const budget = sparse ? cfg.sparseBudget : cfg.budget;
  let used = 0;
  for (const kind of ctx.domain.decor) {
    if (!offers[kind]) continue;
    if (used >= budget) {
      ctx.log.push(`left out ${kind} (page budget of ${budget} reached)`);
      continue;
    }
    if (offers[kind]()) used++;
  }
  ctx.log.push(`page ${sparse ? "sparse" : "full"} (content ${Math.round(cov * 100)}% of body): ${used} of ${budget} decorations`);
}

// Add the domain header and return the y (mm) where the content below it may start.
function addHeader(ctx, page, b) {
  const header = addRegion(page, "header", b, C.domainHeader(ctx));
  const need = mm(header.querySelector(".dhead").scrollHeight);
  if (need > b.h) header.style.height = `${need.toFixed(2)}mm`;
  return { header, bottom: b.y + Math.max(b.h, need) };
}

// The photo a hanging animal grips: in the top row, the one nearest the lane.
function outerMat(region, page, side) {
  const mats = [...region.querySelectorAll(".mat")].map((m) => rectMm(m, page));
  if (!mats.length) return null;
  const top = Math.min(...mats.map((m) => m.y));
  const row = mats.filter((m) => m.y < top + 8);
  return row.reduce((a, b) => (side === "right" ? (b.x + b.w > a.x + a.w ? b : a) : b.x < a.x ? b : a));
}

function headerContentRight(page, header) {
  const parts = [...header.querySelectorAll(".dtitle, .rings")].map((n) => rectMm(n, page));
  return Math.max(...parts.map((r) => r.x + r.w));
}

const blockBottom = (page, region) => {
  const b = rectMm(region.querySelector(".moments"), page);
  return b.y + b.h;
};

// ---- Layout variants --------------------------------------------------------------

function trySplit(ctx, book, photos, queue) {
  const { L, x0, x1, top, bottom } = ctx;
  if (!photos.length || photos.length > L.maxSplitPhotos) return null;
  const side = ctx.index % 2 === 0 ? "right" : "left"; // side the photos sit on
  const S = L.splitStoryMm;
  let storyX, photoX, laneX, photoW;
  if (side === "right") {
    storyX = x0;
    laneX = x1 - L.laneMm;
    photoX = x0 + S + L.gapMm;
    photoW = laneX - photoX;
  } else {
    laneX = x0;
    photoX = x0 + L.laneMm;
    storyX = x1 - S;
    photoW = storyX - L.gapMm - photoX;
  }
  const page = newPage(ctx, book, "domain");
  const sTop = addHeader(ctx, page, { x: storyX, y: top, w: S, h: L.headerMm }).bottom + 3;
  const flow = storyRegion(ctx, page, { x: storyX, y: sTop, w: S, h: bottom - sTop }, 1, true);
  const q = queue.map((x) => ({ ...x }));
  const placed = fillFlow(flow, q, ctx.domain.lang, []);
  if (q.length) return page.remove(), null;
  const pTop = L.splitPhotoTopMm;
  const pr = addRegion(page, "photos", { x: photoX, y: pTop, w: photoW, h: bottom - pTop });
  // All photos beside the story if every one stays above the minimum size; otherwise the
  // first few stay and the rest move to a photo page. The seed picks how many stay
  // (4 photos: 1+3 or 2+2), leaning away from the split used last time.
  let lead = placeBeside(ctx, pr, photos, bottom - pTop) ? photos.length : 0;
  if (!lead && photos.length > 1) {
    const n = photos.length;
    const options = Array.from({ length: Math.min(2, n - 1) }, (_, i) => `${i + 1}+${n - i - 1}`);
    for (const o of ctx.chooser.order(`overflow-${n}`, options)) {
      const k = Number(o.split("+")[0]);
      if (placeBeside(ctx, pr, photos.slice(0, k), bottom - pTop)) {
        lead = k;
        ctx.log.push(`${n} photos as ${o}: ${k} beside the story, ${n - k} on a photo page`);
        break;
      }
    }
  }
  if (!lead) return page.remove(), null;
  queue.length = 0;
  const firstMat = outerMat(pr, page, side);
  // The lane runs out to the page edge so a vine can hug it.
  const edgeLane = side === "right" ? { x: laneX, y: 0, w: ctx.P.w - laneX, h: bottom } : { x: 0, y: 0, w: laneX + L.laneMm, h: bottom };
  applyDecor(ctx, page, {
    river: () => riverDecor(ctx, page, { x: photoX - 6, y: pTop - 10, w: photoW + 12, h: blockBottom(page, pr) - pTop + 14 }, pr),
    top: () => topDecor(ctx, page, { x: side === "right" ? photoX : laneX, y: 0, w: photoW + L.laneMm, h: pTop - 2 }),
    lane: () => laneDecor(ctx, page, edgeLane, side, firstMat),
    mascot: () => mascotDecor(ctx, page, flow, flow.parentElement, side === "right" ? "left" : "right"),
    runner: () => runnerDecor(ctx, page, { x: photoX, w: photoW }),
  });
  const pages = [page];
  if (lead < photos.length) pages.push(...layoutPhotoPages(ctx, book, photos.slice(lead), lead));
  const variant = `split, photos ${side}${lead < photos.length ? `, ${lead}+${photos.length - lead} with a photo page` : ""}`;
  return { variant, pages, placed };
}

// Story in balanced columns on top, photos across the full width below. There is no lane
// here: a vine could not reach the top edge past the story, so nothing would hold it.
function tryStack(ctx, book, photos, queue) {
  const { L, P, x0, x1, top, bottom, o } = ctx;
  if (!photos.length || photos.length > L.maxStackPhotos) return null;
  const page = newPage(ctx, book, "domain");
  const hd = addHeader(ctx, page, { x: x0, y: top, w: x1 - x0, h: L.headerMm });
  const sTop = hd.bottom + 3;
  const maxH = L.stackStoryMaxFraction * (bottom - top);
  const flow = storyRegion(ctx, page, { x: x0, y: sTop, w: x1 - x0, h: maxH }, 2, true);
  const q = queue.map((x) => ({ ...x }));
  const placed = fillFlow(flow, q, ctx.domain.lang, []);
  if (q.length) return page.remove(), null;
  balance(flow);
  const storyBottom = rectMm(flow, page).y + rectMm(flow, page).h;
  const pTop = storyBottom + L.gapMm + 6;
  const pr = addRegion(page, "photos", { x: x0, y: pTop, w: x1 - x0, h: bottom - pTop });
  // Keep room for the subject mascot under the photos when the photos still fit at a
  // comfortable size (at least 38% of the page body); otherwise use the whole space.
  const m = ctx.domain.mascot;
  const reserve = m && ctx.domain.decor.includes("mascot") ? m.heightMm + 4 : 0;
  // Keep that room only if the photos keep at least 75% of the area they would get without it.
  const photoArea = (block) => [...block.querySelectorAll(".photo")].reduce((a, i) => a + i.getBoundingClientRect().width * i.getBoundingClientRect().height, 0);
  const minSide = ctx.theme.photos.minPhotoMm[o];
  let fitted = bestFit(ctx, pr, photos, bottom - pTop, 0, { minSide });
  if (fitted && reserve && bottom - pTop - reserve >= 0.38 * (bottom - top)) {
    const fullArea = photoArea(fitted);
    pr.removeChild(fitted);
    const reserved = bestFit(ctx, pr, photos, bottom - pTop - reserve, 0, { minSide });
    if (reserved && photoArea(reserved) >= 0.75 * fullArea) {
      fitted = reserved;
      ctx.log.push(`kept ${reserve.toFixed(0)} mm under the photos for the mascot`);
    } else {
      if (reserved) pr.removeChild(reserved);
      fitted = bestFit(ctx, pr, photos, bottom - pTop, 0, { minSide });
    }
  }
  if (!fitted) return page.remove(), null;
  queue.length = 0;
  const hr = headerContentRight(page, hd.header);
  const bb = blockBottom(page, pr);
  applyDecor(ctx, page, {
    river: () => riverDecor(ctx, page, { x: x0 - 4, y: pTop - 8, w: x1 - x0 + 8, h: bb - pTop + 12 }, pr),
    top: () => topDecor(ctx, page, { x: hr + 12, y: 0, w: P.w - P.margin / 2 - (hr + 12), h: top + L.headerMm - 2 }),
    mascot: () => {
      const align = ctx.index % 2 === 0 ? "right" : "left";
      if (bottom - (bb + 3) >= ctx.domain.mascot.heightMm * 0.75)
        return mascotInBox(ctx, page, { x: x0, y: bb + 3, w: x1 - x0, h: bottom - (bb + 3) }, align);
      // No room under the photos: use the free margin beside a narrow photo block.
      const mats = [...pr.querySelectorAll(".mat")].map((n) => rectMm(n, page));
      const left = Math.min(...mats.map((r) => r.x));
      const right = Math.max(...mats.map((r) => r.x + r.w));
      const box = align === "right" ? { x: right + 6, y: pTop, w: x1 - right - 6, h: bb - pTop } : { x: x0, y: pTop, w: left - 6 - x0, h: bb - pTop };
      return mascotInBox(ctx, page, box, align);
    },
    peeking: () => peekingDecor(ctx, page, pr),
    runner: () => runnerDecor(ctx, page, { x: x0, w: x1 - x0 }),
  });
  return { variant: "stack", pages: [page], placed };
}

// Story page(s) in two columns, then photos. Photos first fill any room left under the
// story on its last page, so a short story is not followed by a mostly empty page.
function layoutPages(ctx, book, photos, queue) {
  const { L, P, x0, x1, top, bottom } = ctx;
  const pages = [];
  const placed = [];
  let page = newPage(ctx, book, "domain");
  pages.push(page);
  const firstPage = page;
  const hd = addHeader(ctx, page, { x: x0, y: top, w: x1 - x0, h: L.headerMm });
  const hr = headerContentRight(page, hd.header);
  const sTop = hd.bottom + 3;
  let flow = storyRegion(ctx, page, { x: x0, y: sTop, w: x1 - x0, h: bottom - sTop }, 2, true);
  placed.push(...fillFlow(flow, queue, ctx.domain.lang, ctx.log));
  while (queue.length) {
    page = newPage(ctx, book, "follow");
    pages.push(page);
    addRegion(page, "tab", { x: x0, y: top, w: x1 - x0, h: 8 }, C.areaTab(ctx));
    flow = storyRegion(ctx, page, { x: x0, y: top + 10, w: x1 - x0, h: bottom - top - 10 }, 2, false);
    const before = queue.length;
    const more = fillFlow(flow, queue, ctx.domain.lang, ctx.log);
    if (!more.length && queue.length === before) throw new Error("A narrative paragraph cannot fit on an empty page");
    placed.push(...more);
    ctx.log.push("story continued on a follow page");
  }
  balance(flow);
  const lastStory = page;
  const storyFlow = flow;
  const f = rectMm(flow, page);
  let start = 0;
  let pulled = null;
  const room = bottom - (f.y + f.h + L.gapMm + 4);
  if (photos.length && room >= ctx.theme.photos.minRowHeightMm + 12) {
    pulled = addRegion(page, "photos", { x: x0, y: f.y + f.h + L.gapMm + 4, w: x1 - x0, h: room });
    start = placeRow(ctx, pulled, photos, room);
    if (start) ctx.log.push(`placed ${start} photo(s) under the story`);
    else pulled = pulled.remove() ?? null;
  }
  const storyOffers = (p) => {
    const offers = {};
    if (p === firstPage) offers.top = () => topDecor(ctx, p, { x: hr + 12, y: 0, w: P.w - P.margin / 2 - (hr + 12), h: top + L.headerMm - 2 });
    if (p === lastStory) {
      if (pulled) {
        const bb = blockBottom(p, pulled);
        offers.river = () => riverDecor(ctx, p, { x: x0 - 4, y: rectMm(pulled, p).y - 8, w: x1 - x0 + 8, h: bb - rectMm(pulled, p).y + 12 }, pulled);
        offers.mascot = () => mascotInBox(ctx, p, { x: x0, y: bb + 3, w: x1 - x0, h: bottom - (bb + 3) }, "right");
        offers.peeking = () => peekingDecor(ctx, p, pulled);
      } else if (photos.length) offers.mascot = () => mascotDecor(ctx, p, storyFlow, storyFlow.parentElement, "right");
      else offers.mascot = () => mascotInBox(ctx, p, { x: x0, y: f.y + f.h + 4, w: x1 - x0, h: bottom - (f.y + f.h + 4) }, "right", 1.5);
      offers.runner = () => runnerDecor(ctx, p, { x: x0, w: x1 - x0 });
    }
    return offers;
  };
  for (const p of pages) applyDecor(ctx, p, storyOffers(p));

  if (start < photos.length) pages.push(...layoutPhotoPages(ctx, book, photos.slice(start), start, { heading: start === 0 }));
  if (!photos.length) ctx.log.push("no photos: story page only");
  queue.length = 0;
  return { variant: photos.length ? (pages.length === 1 ? "pages (story and photos on one page)" : "pages") : "pages (story only)", pages, placed };
}

function layoutDomain(job, ctx, book) {
  const source = ctx.entry.feedback;
  const paragraphs = source.length ? source.split(/\n{2,}/) : [];
  const queue = paragraphs.map((text) => ({ text, cont: false }));
  const photos = preparePhotos(ctx);
  const forced = job.options.layouts?.[ctx.domainId];
  const order = forced ? [forced] : ctx.L.order;
  let result = null;
  for (const v of order) {
    if (v === "split" && ctx.o === "landscape") result = trySplit(ctx, book, photos, queue);
    else if (v === "stack") result = tryStack(ctx, book, photos, queue);
    else if (v === "pages") result = layoutPages(ctx, book, photos, queue);
    if (result) break;
    ctx.log.push(`${v} did not fit`);
  }
  if (!result) result = layoutPages(ctx, book, photos, queue);
  return {
    domain: ctx.domainId,
    variant: result.variant,
    pages: result.pages.length,
    log: ctx.log,
    decor: ctx.decor,
    photos: photos.map((p) => ({ src: p.src, pixels: p.pixels, aspect: +p.aspect.toFixed(3), frameAspect: +p.frameAspect.toFixed(3), cropPercent: +(p.cropLoss * 100).toFixed(1) })),
    source,
    fragments: result.placed,
  };
}

// ---- Cover ------------------------------------------------------------------------

function layoutCover(job, book) {
  const g = geometry(job);
  const { P, o } = g;
  const t = job.strings.en;
  const cfg = job.theme.cover;
  const ctx = { ...g, theme: job.theme, t, tint: cfg.tint, tintDeep: cfg.tintDeep, sizes: job.sizes, meadowH: meadowHeight(job), log: [], decor: [], domain: { runner: cfg.runner, lang: "en" } };
  const page = newPage(ctx, book, "cover");
  const photo = job.report.cover_photo;
  const chip = photo && photo.kind !== "photo" ? t.sample[photo.kind] : null;
  if (o === "landscape") {
    const panelW = P.w * 0.42;
    // Bottom border only under the name panel, matching the garland at the top; across the
    // illustration it read as noise (user review, 21 Oct 2026).
    page.querySelector(".meadow").style.right = `${(P.w - panelW + 8).toFixed(2)}mm`;
    if (photo) {
      // fit "width": show the whole image across the page, bottom-aligned, with the paper
      // continuing above it (for wide illustrations); default "cover" fills the page.
      const a = job.sizes[photo.resolvedSrc].aspect;
      const b = photo.fit === "width" ? { x: 0, y: P.h - P.w / a, w: P.w, h: P.w / a } : { x: 0, y: 0, w: P.w, h: P.h };
      page.appendChild(el(C.coverPhoto(photo.resolvedSrc, b, photo.focus, chip)));
    }
    else {
      tryDecor(ctx, page, job.theme.art.riverLandscape, { x: panelW - 4, y: 0, w: P.w - panelW + 4, h: P.h }, "decor--bg decor--river", { extra: ";object-fit:cover", why: "river" });
      const a = job.sizes[job.theme.art.coverPair].aspect;
      const h = 92;
      tryDecor(ctx, page, job.theme.art.coverPair, { x: panelW + (P.w - panelW - h * a) / 2, y: P.h - ctx.meadowH * 0.7 - h, w: h * a, h }, "decor--cover-pair", { why: "friends waving" });
    }
    page.appendChild(el(C.wavePanel({ x: 0, y: 0, w: panelW, h: P.h }, "right-edge")));
    page.appendChild(el(C.region("cover-text", { x: P.margin + 6, y: 30, w: panelW - P.margin - 24 }, C.coverText(job, t))));
    const ga = job.sizes[job.theme.art.garland].aspect;
    tryDecor(ctx, page, job.theme.art.garland, { x: 0, y: 0, w: panelW - 8, h: (panelW - 8) / ga }, "decor--top", { why: "garland" });
    runnerDecor(ctx, page, { x: 0, w: panelW * 0.8 });
  } else {
    const photoH = P.h * 0.6;
    if (photo) {
      const a = job.sizes[photo.resolvedSrc].aspect;
      const b = photo.fit === "width" ? { x: 0, y: photoH + 6 - P.w / a, w: P.w, h: P.w / a } : { x: 0, y: 0, w: P.w, h: photoH + 6 };
      page.appendChild(el(C.coverPhoto(photo.resolvedSrc, b, photo.focus, chip)));
    }
    else {
      tryDecor(ctx, page, job.theme.art.riverPortrait, { x: 0, y: 0, w: P.w, h: photoH + 6 }, "decor--bg decor--river", { extra: ";object-fit:cover", why: "river" });
      const a = job.sizes[job.theme.art.coverPair].aspect;
      const w = P.w * 0.62;
      tryDecor(ctx, page, job.theme.art.coverPair, { x: (P.w - w) / 2, y: photoH - w / a - 6, w, h: w / a }, "decor--cover-pair", { why: "friends waving" });
    }
    page.appendChild(el(C.wavePanel({ x: 0, y: photoH - 10, w: P.w, h: P.h - photoH + 10 }, "top-edge")));
    page.appendChild(el(C.region("cover-text", { x: P.margin + 6, y: photoH + 8, w: P.w - 2 * P.margin - 12 }, C.coverText(job, t))));
    const ga = job.sizes[job.theme.art.garland].aspect;
    tryDecor(ctx, page, job.theme.art.garland, { x: 0, y: 0, w: P.w * 0.62, h: (P.w * 0.62) / ga }, "decor--top", { why: "garland" });
    runnerDecor(ctx, page, { x: P.w * 0.45, w: P.w * 0.5 });
  }
  return { decor: ctx.decor, log: ctx.log };
}

// ---- Closing page -------------------------------------------------------------------

// The friends waving goodbye by the river, under a centred thank-you line. Decoration
// only; nothing about the child. Pieces that would touch the text are dropped as usual.
function layoutClosing(job, book) {
  const g = geometry(job);
  const { P, o } = g;
  const t = job.strings.en;
  const cfg = job.theme.cover;
  const ctx = { ...g, theme: job.theme, t, tint: cfg.tint, tintDeep: cfg.tintDeep, sizes: job.sizes, meadowH: meadowHeight(job), log: [], decor: [], domain: { runner: "rabbit", lang: "en" } };
  const page = newPage(ctx, book, "closing");
  // No bottom border here: the river and the friends reach the page edge (user review).
  page.querySelector(".meadow").remove();
  const textTop = o === "landscape" ? 34 : 52;
  page.appendChild(el(C.region("closing-text", { x: P.margin, y: textTop, w: P.w - 2 * P.margin }, C.closingText(job, t))));
  const textBottom = rectMm(page.querySelector(".closing-text"), page);
  const below = textBottom.y + textBottom.h + 6;
  const ga = job.sizes[job.theme.art.garland].aspect;
  const gw = P.w * (o === "landscape" ? 0.62 : 0.8);
  tryDecor(ctx, page, job.theme.art.garland, { x: (P.w - gw) / 2, y: 0, w: gw, h: Math.min(gw / ga, textTop - 4) }, "decor--top", { why: "garland" });
  const river = o === "landscape" ? job.theme.art.riverLandscape : job.theme.art.riverPortrait;
  const rb = { x: 0, y: below, w: P.w, h: P.h - below };
  if (tryDecor(ctx, page, river, rb, "decor--bg decor--river", { extra: ";object-fit:cover;object-position:center bottom", why: "river" })) {
    // The crop cuts the river at its top; a paper-coloured veil lets it ease in instead.
    // (A CSS mask leaves a 1 px line at the crop edge in Chrome's PDF output.)
    page.appendChild(el(`<div class="fade-veil" style="left:0;top:${(rb.y - 0.5).toFixed(2)}mm;width:${P.w}mm;height:${(rb.h * 0.3).toFixed(2)}mm"></div>`));
  }
  const a = job.sizes[job.theme.art.coverPair].aspect;
  const maxH = P.h - ctx.meadowH * 0.7 - below - 4;
  const h = Math.min(o === "landscape" ? 96 : 110, maxH, (P.w * 0.7) / a);
  tryDecor(ctx, page, job.theme.art.coverPair, { x: (P.w - h * a) / 2, y: P.h - ctx.meadowH * 0.7 - h, w: h * a, h }, "decor--cover-pair", { why: "friends waving" });
  return { decor: ctx.decor, log: ctx.log };
}

// ---- Checks -----------------------------------------------------------------------

function verify(book, results) {
  const problems = [];
  const pages = [...book.querySelectorAll(".page")];
  pages.forEach((page, n) => {
    const where = `page ${n + 1}`;
    const pr = page.getBoundingClientRect();
    page.querySelectorAll(".text-block").forEach((b) => {
      if (b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1) problems.push(`${where}: clipped text block`);
    });
    const texts = [...page.querySelectorAll(TEXT_SELECTOR)].map((t) => ({ t, r: rectMm(t, page) }));
    for (const { t, r } of texts) {
      if (r.x < -0.5 || r.y < -0.5 || r.x + r.w > mm(pr.width) + 0.5 || r.y + r.h > mm(pr.height) + 0.5) problems.push(`${where}: ${t.className || t.tagName} outside the page`);
    }
    page.querySelectorAll(".region.header, .region.tab, .region.photo-heading").forEach((reg) => {
      if (reg.scrollHeight > reg.clientHeight + 1) problems.push(`${where}: ${reg.className} content taller than its region`);
    });
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i];
        const b = texts[j];
        if (a.t.contains(b.t) || b.t.contains(a.t) || a.t.closest(".region") === b.t.closest(".region")) continue;
        if (intersect(a.r, b.r) > 0.5) problems.push(`${where}: ${a.t.className || a.t.tagName} overlaps ${b.t.className || b.t.tagName}`);
      }
    // Story text must stay inside its region.
    page.querySelectorAll(".region.story").forEach((reg) => {
      const rr = rectMm(reg, page);
      reg.querySelectorAll(".flow p").forEach((p) => {
        for (const c of p.getClientRects()) {
          const top = mm(c.top - pr.top);
          const bottom = mm(c.bottom - pr.top);
          if (bottom > rr.y + rr.h + 0.5 || top < rr.y - 0.5) problems.push(`${where}: story text outside its region`);
        }
      });
    });
    // Decoration never touches text, and only grazes photos.
    page.querySelectorAll(".decor").forEach((d) => {
      const dr = rectMm(d, page);
      for (const { t, r } of texts) if (intersect(dr, r) > 0.5) problems.push(`${where}: decoration ${d.className} touches ${t.className || t.tagName}`);
      if (!d.classList.contains("decor--bg"))
        page.querySelectorAll(".moment .photo").forEach((p) => {
          const r = rectMm(p, page);
          if (intersect(dr, r) / (r.w * r.h) > 0.031) problems.push(`${where}: decoration ${d.className} covers a photo`);
        });
    });
    // Photos stay inside the page body and above the meadow.
    page.querySelectorAll(".moment").forEach((m) => {
      const r = rectMm(m, page);
      if (r.y + r.h > mm(pr.height) - 4) problems.push(`${where}: photo runs into the meadow`);
    });
  });
  for (const r of results) {
    const rebuilt = [];
    for (const f of r.fragments) {
      if (f.cont) rebuilt[rebuilt.length - 1] += f.text;
      else rebuilt.push(f.text);
    }
    r.textPreserved = rebuilt.join("\n\n") === r.source;
    if (!r.textPreserved) problems.push(`${r.domain}: rendered fragments differ from source text`);
    const domText = [...book.querySelectorAll(`.page[data-domain="${r.domain}"] .flow p`)].map((p) => p.textContent);
    if (domText.join("") !== r.fragments.map((f) => f.text).join("")) problems.push(`${r.domain}: DOM text differs from placed fragments`);
    r.fragments = r.fragments.map((f) => ({ cont: !!f.cont, text: f.text }));
    delete r.source;
  }
  return problems;
}

function numberPages(book, start) {
  book.querySelectorAll(".page:not(.page--cover):not(.page--closing)").forEach((page, i) => {
    page.dataset.page = String(start + i);
    page.querySelector(".folio-num").textContent = String(start + i);
  });
}

export async function run(job) {
  const book = document.getElementById("book");
  await preloadFonts(job);
  job.sizes = await preloadImages(job);
  const c = job.report.child;
  job.chooser = makeChooser(`${c.student_code ?? c.display_name}|${job.report.period.year}|${job.report.period.semester}`, job.theme.photos.variety.damp);
  const results = [];
  let cover = null;
  if (job.options.cover) cover = layoutCover(job, book);
  job.options.domains.forEach((domainId, index) => {
    const d = Object.keys(job.theme.domains).indexOf(domainId);
    results.push(layoutDomain(job, makeCtx(job, domainId, d), book));
  });
  let closing = null;
  if (job.options.closing) closing = layoutClosing(job, book);
  numberPages(book, job.options.startPage);
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode().catch(() => null)));
  const problems = verify(book, results);
  const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
  return {
    ok: problems.length === 0,
    problems,
    orientation: job.options.orientation,
    pageCount: book.querySelectorAll(".page").length,
    cover,
    closing,
    choices: job.chooser.history,
    domains: results,
    loadedFontFaces: fonts.length,
    loadedFamilies: [...new Set(fonts.map((f) => f.replace(/ \d.*$/, "")))],
  };
}
