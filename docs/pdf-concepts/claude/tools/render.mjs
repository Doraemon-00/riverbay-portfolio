#!/usr/bin/env node
// Riverbay portfolio PDF renderer (template v2).
//
//   node tools/render.mjs                    render every case in tools/cases.json, both orientations
//   node tools/render.mjs avery-lim-2026-s2  render one named case
//   node tools/render.mjs --data report.json --out out/x.pdf [--orientation landscape|portrait]
//        [--domains english,chinese] [--start-page 2] [--no-cover] [--closing] [--preview]
//
// Pipeline: validate data -> serve template, local assets and photos from 127.0.0.1 ->
// headless Chrome lays out pages (template/layout.mjs) -> layout checks -> Page.printToPDF.
// No AI calls, no remote requests: any non-local request fails the render.
// --preview allows a not-yet-assessed indicator (dashed ring) for teacher preview only;
// export (the default) refuses it.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, openPage } from "./chrome.mjs";
import { validateReport } from "./validate.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2",
};
const ORIENTATIONS = ["landscape", "portrait"];

function parseArgs(argv) {
  const args = { names: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--data") args.data = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--domains") args.domains = argv[++i].split(",");
    else if (a === "--start-page") args.startPage = Number(argv[++i]);
    else if (a === "--orientation") args.orientation = argv[++i];
    else if (a === "--no-cover") args.cover = false;
    else if (a === "--preview") args.preview = true;
    else if (a === "--closing") args.closing = true;
    else args.names.push(a);
  }
  return args;
}

// Expand cases into one job per orientation.
function loadJobs(args) {
  let cases;
  if (args.data) {
    const name = basename(args.out ?? args.data, extname(args.out ?? args.data));
    cases = [{ name, data: args.data, out: args.out, domains: args.domains ?? ["english", "chinese"], startPage: args.startPage ?? 2, cover: args.cover ?? true, closing: !!args.closing, preview: !!args.preview, orientations: [args.orientation ?? "landscape"] }];
  } else {
    const all = JSON.parse(readFileSync(join(ROOT, "tools/cases.json"), "utf8")).cases;
    cases = args.names.length ? all.filter((c) => args.names.includes(c.name)) : all;
    if (args.names.length && cases.length !== args.names.length) throw new Error(`Unknown case in: ${args.names.join(", ")}`);
  }
  return cases.flatMap((c) => {
    const os = c.orientations ?? (args.orientation ? [args.orientation] : ORIENTATIONS);
    return os.map((o) => {
      if (!ORIENTATIONS.includes(o)) throw new Error(`Unknown orientation ${o}`);
      const out = c.out ?? `out/${c.name}.${o}.pdf`;
      return { ...c, orientation: o, out, label: `${c.name} (${o})` };
    });
  });
}

function buildHtml(job) {
  const json = JSON.stringify(job).replaceAll("</", "<\\/");
  const c = job.report.child;
  const title = `${c.display_name} · ${job.report.period.year} Semester ${job.report.period.semester} · Riverbay portfolio`;
  const P = job.theme.pages[job.options.orientation];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><base href="/">
<title>${title.replace(/[<&]/g, "")}</title>
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="assets/brand/tokens/riverbay-tokens.css">
<link rel="stylesheet" href="template/portfolio.css">
<style>@page { size: ${P.w}mm ${P.h}mm; margin: 0; }</style>
</head><body class="o-${job.options.orientation}"><main id="book"></main>
<script type="application/json" id="job">${json}</script>
<script type="module">
import { run } from "/template/layout.mjs";
const job = JSON.parse(document.getElementById("job").textContent);
run(job).then((r) => (window.__RIVERBAY_RESULT = r), (e) => (window.__RIVERBAY_RESULT = { ok: false, error: String(e && e.stack || e) }));
</script></body></html>`;
}

function startServer(routes) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = routes.media.get(path);
    if (routes.pages.has(path)) {
      res.writeHead(200, { "content-type": TYPES[".html"] });
      return res.end(routes.pages.get(path));
    }
    if (!file) {
      const candidate = resolve(ROOT, "." + path);
      const inside = candidate.startsWith(join(ROOT, "assets") + sep) || candidate.startsWith(join(ROOT, "template") + sep);
      if (inside && existsSync(candidate) && statSync(candidate).isFile()) file = candidate;
    }
    if (!file) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function waitFor(page, expr, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await page.evaluate(expr);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Timed out waiting for layout");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jobs = loadJobs(args);
  const theme = JSON.parse(readFileSync(join(ROOT, "template/theme.json"), "utf8"));
  theme.anchors = JSON.parse(readFileSync(join(ROOT, "assets/art/anchors.json"), "utf8"));
  // Photo-page art switches on only once its files exist (generated art may still be pending).
  const pp = theme.art.photoPage ?? {};
  for (const k of ["line", "peg"]) if (pp[k] && !existsSync(join(ROOT, pp[k]))) delete pp[k];
  for (const [k, v] of Object.entries(pp.cameras ?? {})) if (!existsSync(join(ROOT, v.src))) delete pp.cameras[k];
  const strings = JSON.parse(readFileSync(join(ROOT, "template/strings.json"), "utf8"));
  const routes = { media: new Map(), pages: new Map() };
  const server = await startServer(routes);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const chrome = await launch();
  let failures = 0;
  const validated = new Set();
  try {
    for (const c of jobs) {
      const dataPath = resolve(ROOT, c.data);
      const outPdf = resolve(ROOT, c.out);
      const report = JSON.parse(readFileSync(dataPath, "utf8"));
      const errors = validateReport(report, { dataPath, domains: c.domains, maxPhotos: theme.photos.maxPerDomain, allowUnassessed: !!c.preview });
      if (c.expectInvalid) {
        if (validated.has(c.name)) continue; // validation does not depend on orientation
        validated.add(c.name);
        const vPath = resolve(ROOT, `out/${c.name}.validation.json`);
        mkdirSync(dirname(vPath), { recursive: true });
        writeFileSync(vPath, JSON.stringify({ case: c.name, rejected: errors.length > 0, errors }, null, 2) + "\n");
        if (errors.length) console.log(`✓ ${c.name}: rejected as expected (${errors.length} errors, no PDF)`);
        else {
          failures++;
          console.error(`✗ ${c.name}: invalid data was accepted`);
        }
        continue;
      }
      if (errors.length) {
        console.error(`✗ ${c.label}: invalid report data\n  - ${errors.join("\n  - ")}`);
        failures++;
        continue;
      }
      // Photos resolve relative to the data file and are served under /media/.
      let n = 0;
      for (const id of c.domains) {
        for (const p of report.domains[id][`${id}_photos`] ?? []) {
          const file = resolve(dirname(dataPath), p.src);
          const route = `/media/${c.name}/${n++}-${basename(file)}`;
          routes.media.set(route, file);
          p.resolvedSrc = route;
        }
      }
      const cover = c.cover ?? true;
      if (cover && report.cover_photo) {
        const file = resolve(dirname(dataPath), report.cover_photo.src);
        const route = `/media/${c.name}/cover-${basename(file)}`;
        routes.media.set(route, file);
        report.cover_photo.resolvedSrc = route;
      }
      const job = {
        report, theme, strings,
        options: { domains: c.domains, cover, closing: c.closing ?? false, orientation: c.orientation, startPage: c.startPage ?? 2, layouts: c.layouts ?? null },
      };
      const pagePath = `/render/${c.name}.${c.orientation}.html`;
      routes.pages.set(pagePath, buildHtml(job));

      const page = await openPage(chrome.browser);
      await page.send("Emulation.setEmulatedMedia", { media: "print" });
      await page.goto(origin + pagePath);
      const result = await waitFor(page, "window.__RIVERBAY_RESULT", 90000);
      const remote = page.requests.filter((u) => !u.startsWith(origin) && !u.startsWith("data:") && u !== "about:blank");
      if (remote.length) result.problems = [...(result.problems ?? []), ...remote.map((u) => `non-local request: ${u}`)];
      result.ok = !result.error && !(result.problems ?? []).length;
      Object.assign(result, { case: c.name, orientation: c.orientation, data: relative(ROOT, dataPath).split(sep).join("/"), chrome: chrome.version.product, requests: page.requests.length, console: page.consoleMessages });
      mkdirSync(dirname(outPdf), { recursive: true });
      if (result.ok) {
        const pdf = await page.send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, generateTaggedPDF: true, generateDocumentOutline: false });
        writeFileSync(outPdf, Buffer.from(pdf.data, "base64"));
      }
      writeFileSync(outPdf.replace(/\.pdf$/, ".layout.json"), JSON.stringify(result, null, 2) + "\n");
      await page.close();
      if (result.ok) {
        const v = (result.domains ?? []).map((d) => `${d.domain}: ${d.variant}`).join(", ");
        console.log(`✓ ${c.label}: ${result.pageCount} pages -> ${relative(ROOT, outPdf)}${v ? `  [${v}]` : ""}`);
      } else {
        failures++;
        console.error(`✗ ${c.label}: ${result.error ?? result.problems.join("; ")}`);
      }
    }
  } finally {
    await chrome.close();
    server.close();
  }
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
