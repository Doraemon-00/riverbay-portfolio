import "server-only";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { domains, rosterSelect, scaleVersion, type Entry, type RosterItem } from "@/lib/portfolio";

/**
 * Portfolio PDF export (store, then link).
 *
 * Reads saved records with the viewer's own session (so row-level security applies),
 * writes the renderer's JSON contract (docs/pdf-concepts/claude/schema), runs the
 * deterministic renderer in a child process, stores the finished PDF in the private
 * `portfolio-exports` bucket and returns a short-lived signed link. No AI is involved:
 * narratives are copied exactly and ratings are never inferred.
 */

export type Orientation = "landscape" | "portrait";
export type ExportMode = "preview" | "final";
export type ExportResult = {
  url: string;
  bytes: number;
  pages: number;
  seconds: number;
  orientation: Orientation;
  mode: ExportMode;
  photos: number;
};

const PHOTO_BUCKET = "portfolio-photos";
const EXPORT_BUCKET = "portfolio-exports";
const MAX_PHOTOS = 4; // the template's current limit per learning area
const RENDERER_DIR = process.env.PDF_RENDERER_DIR ?? path.join(process.cwd(), "docs/pdf-concepts/claude");
const LINK_SECONDS = 10 * 60;

export class ExportBlocked extends Error {
  constructor(public reasons: string[]) {
    super(reasons.join(" "));
  }
}

type Prior = Pick<Entry, "domain" | "rating" | "rating_scale_version">;
type PhotoRow = { entry_id: string; storage_key: string; caption: string; position: number };

/**
 * Why a final (parent) export is not allowed yet. Export rule (user decision, 21 Oct 2026):
 * every area needs an indicator and a learning story. The prototype downloads directly;
 * there is no additional review/confirmation dialog or formal approval assertion.
 */
export function finalExportBlockers(entries: Pick<Entry, "domain" | "rating" | "narrative">[]) {
  const label = (id: string) => domains.find((d) => d.id === id)?.label ?? id;
  const reasons: string[] = [];
  for (const d of domains) {
    const e = entries.find((x) => x.domain === d.id);
    if (!e) reasons.push(`${d.label} has no saved entry.`);
    else {
      if (e.rating == null) reasons.push(`Choose a learning indicator for ${label(e.domain)}.`);
      if (!e.narrative.trim()) reasons.push(`${label(e.domain)} has no learning story.`);
    }
  }
  return reasons;
}

/** Vercel has no installed browser: use the bundled serverless Chromium and its required flags. */
async function rendererEnv(): Promise<NodeJS.ProcessEnv> {
  if (!process.env.VERCEL && !process.env.PDF_BUNDLED_CHROMIUM) return process.env;
  const { default: chromium } = await import("@sparticuz/chromium");
  const executable = await chromium.executablePath(); // also sets the library/font paths Chromium needs
  return { ...process.env, CHROME_PATH: executable, CHROME_ARGS: JSON.stringify(chromium.args) };
}

async function runRenderer(args: string[]) {
  const env = await rendererEnv();
  return new Promise<{ code: number; out: string }>((resolve) => {
    const child = spawn(process.execPath, ["tools/render.mjs", ...args], { cwd: RENDERER_DIR, env });
    let out = "";
    child.stdout.on("data", (b) => (out += b));
    child.stderr.on("data", (b) => (out += b));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

export async function exportPortfolioPdf(
  db: SupabaseClient,
  portfolioId: string,
  { orientation, mode }: { orientation: Orientation; mode: ExportMode },
): Promise<ExportResult> {
  const started = Date.now();
  const { data: portfolio, error: pErr } = await db.from("portfolios").select("enrolment_id").eq("id", portfolioId).maybeSingle();
  if (pErr || !portfolio) throw new ExportBlocked(["This portfolio is not available to you."]);
  const { data, error } = await db.from("enrolments").select(rosterSelect).eq("id", portfolio.enrolment_id).single();
  if (error) throw new Error("Could not load this portfolio.");
  const item = data as unknown as RosterItem;
  const entries = item.portfolios?.domain_entries ?? [];

  if (mode === "final") {
    const reasons = finalExportBlockers(entries);
    if (reasons.length) throw new ExportBlocked(reasons);
  } else {
    const missing = domains.filter((d) => !entries.find((e) => e.domain === d.id)?.narrative.trim());
    if (missing.length) throw new ExportBlocked(missing.map((d) => `${d.label} has no learning story yet.`));
  }

  const history = await db.rpc("previous_semester_ratings", { current_portfolio: portfolioId });
  if (history.error) throw new Error("Could not load semester history.");
  const prior = history.data as Prior[];

  const { data: photoRows, error: photoErr } = await db
    .from("photos")
    .select("entry_id,storage_key,caption,position")
    .in("entry_id", entries.map((e) => e.id))
    .order("position")
    .order("created_at")
    .order("id");
  if (photoErr) throw new Error("Could not load photos.");
  const byEntry = new Map<string, PhotoRow[]>();
  for (const p of photoRows as PhotoRow[]) byEntry.set(p.entry_id, [...(byEntry.get(p.entry_id) ?? []), p]);
  const tooMany = domains.filter((d) => (byEntry.get(entries.find((e) => e.domain === d.id)?.id ?? "")?.length ?? 0) > MAX_PHOTOS);
  if (tooMany.length) throw new ExportBlocked(tooMany.map((d) => `${d.label} has more than ${MAX_PHOTOS} photos; choose up to ${MAX_PHOTOS}.`));

  const work = path.join(tmpdir(), `riverbay-pdf-${randomUUID()}`);
  await mkdir(path.join(work, "photos"), { recursive: true });
  try {
    let photoCount = 0;
    const reportDomains: Record<string, unknown> = {};
    for (const d of domains) {
      const e = entries.find((x) => x.domain === d.id)!;
      const prev = prior.find((p) => p.domain === d.id);
      const photos: { src: string; kind: "photo" | "placeholder" | "fictional_illustration"; caption: string | null; alt: string }[] = [];
      for (const p of byEntry.get(e.id) ?? []) {
        const file = await db.storage.from(PHOTO_BUCKET).download(p.storage_key);
        if (file.error) throw new Error("Could not download a photo for the PDF.");
        const ext = file.data.type === "image/png" ? "png" : file.data.type === "image/webp" ? "webp" : "jpg";
        const name = `${d.id}-${photos.length + 1}.${ext}`;
        await writeFile(path.join(work, "photos", name), Buffer.from(await file.data.arrayBuffer()));
        photos.push({
          src: `photos/${name}`,
          // "demo-" files are neutral placeholders; "sample-" files are seeded fictional
          // illustrations. Both print with a sample label; real uploads print unlabelled.
          kind: p.storage_key.includes("/demo-") ? "placeholder" : p.storage_key.includes("/sample-") ? "fictional_illustration" : "photo",
          caption: p.caption.trim() ? p.caption : null,
          alt: `${d.label} photo ${photos.length + 1}`,
        });
      }
      photoCount += photos.length;
      reportDomains[d.id] = {
        rating: e.rating,
        rating_scale_version: e.rating_scale_version,
        previous: prev ? { semester: 1, rating: prev.rating, rating_scale_version: prev.rating_scale_version } : null,
        [`${d.id}_feedback`]: e.narrative,
        [`${d.id}_photos`]: photos,
      };
    }
    const report = {
      schema: "riverbay.portfolio-report.v1",
      child: { display_name: item.children.display_name, student_code: item.children.student_code, class_name: item.classes.name },
      period: { year: item.reporting_periods.year, semester: item.reporting_periods.semester },
      rating_scale_version: scaleVersion,
      domains: reportDomains,
    };
    const dataPath = path.join(work, "report.json");
    const outPath = path.join(work, `portfolio.${orientation}.pdf`);
    await writeFile(dataPath, JSON.stringify(report, null, 2));
    const args = ["--data", dataPath, "--out", outPath, "--orientation", orientation, "--domains", domains.map((d) => d.id).join(","), "--start-page", "2", "--closing"];
    if (mode === "preview") args.push("--preview");
    const run = await runRenderer(args);
    if (run.code !== 0) {
      const problem = run.out.split("\n").find((l) => l.startsWith("✗")) ?? "The PDF could not be created.";
      throw new ExportBlocked([problem.replace(/^✗\s*/, "")]);
    }
    const pdf = await readFile(outPath);
    const layout = JSON.parse(await readFile(outPath.replace(/\.pdf$/, ".layout.json"), "utf8"));

    // Keep only the newest export for this portfolio; older files are removed.
    const old = await db.storage.from(EXPORT_BUCKET).list(portfolioId);
    if (old.data?.length) await db.storage.from(EXPORT_BUCKET).remove(old.data.map((f) => `${portfolioId}/${f.name}`));
    const key = `${portfolioId}/${mode}-${orientation}-${randomUUID()}.pdf`;
    const up = await db.storage.from(EXPORT_BUCKET).upload(key, pdf, { contentType: "application/pdf", upsert: false });
    if (up.error) throw new Error("Could not store the PDF.");
    const name = `${item.children.display_name} ${item.reporting_periods.year} S${item.reporting_periods.semester}${mode === "preview" ? " preview" : ""}.pdf`;
    const signed = await db.storage.from(EXPORT_BUCKET).createSignedUrl(key, LINK_SECONDS, { download: name });
    if (signed.error) throw new Error("Could not create a download link.");
    return {
      url: signed.data.signedUrl,
      bytes: pdf.length,
      pages: layout.pageCount,
      seconds: Math.round((Date.now() - started) / 100) / 10,
      orientation,
      mode,
      photos: photoCount,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
