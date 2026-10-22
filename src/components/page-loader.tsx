"use client";
/* eslint-disable @next/next/no-img-element -- Tiny local flipbook frames swapped by src; the image optimiser would add a request per frame. */

import { useLinkStatus } from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

// Approved loader from docs/design-concepts/motion. It is decoration only: it appears
// after 250 ms of real waiting, stays at least 700 ms once shown and never takes input.
// "page" covers the screen (sign-in, My classes, opening a portfolio); "inline" is a small
// strip under the domain tabs for the frequent domain and student switches.
const SHOW_AFTER = 250, MIN_VISIBLE = 700, FADE = 160;
const FRAMES = "/assets/riverbay/motion/";
const frames = (name: string) => [1, 2, 3, 4].map(n => `${FRAMES}${name}-f${n}.webp`);
const run = frames("run"), hop = frames("hop"), swim = frames("swim");

export type LoaderKind = "page" | "inline";
type Scene = "runners" | "beaver";

// Pending work registered by links, forms and transitions; the newest label of each kind wins.
// The last label is kept so the text does not vanish during the minimum display time.
let waits: { id: number; label: string; kind: LoaderKind }[] = [];
const lastLabel: Record<LoaderKind, string> = { page: "", inline: "" };
let nextId = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const notify = () => listeners.forEach(l => l());
// Frames download quietly soon after any page opens, so the animals are ready before the first
// wait. The images are kept in memory; a scene counts as ready once all its frames have decoded.
const meadow = `${FRAMES}meadow-border.webp`;
const sceneFrames: Record<Scene, string[]> = { runners: [...run, ...hop, meadow], beaver: [...swim, meadow] };
const decoded = new Set<string>();
const kept: HTMLImageElement[] = [];
let preloaded = false;
function preload() {
  if (preloaded) return;
  preloaded = true;
  for (const src of new Set([...sceneFrames.runners, ...sceneFrames.beaver])) {
    const img = new Image();
    img.src = src;
    kept.push(img);
    img.decode().then(() => decoded.add(src), () => {});
  }
}
const sceneReady = (scene: Scene) => sceneFrames[scene].every(src => decoded.has(src));

export function useLoaderWait(active: boolean, label: string, kind: LoaderKind = "page") {
  useEffect(() => {
    if (!active) return;
    preload();
    const id = ++nextId;
    waits = [...waits, { id, label, kind }];
    lastLabel[kind] = label;
    notify();
    return () => {
      waits = waits.filter(w => w.id !== id);
      lastLabel[kind] = waits.filter(w => w.kind === kind).at(-1)?.label ?? lastLabel[kind];
      notify();
    };
  }, [active, label, kind]);
}

// Place inside a <Link>: reports that link's navigation while it is still waiting.
export function LinkLoader({ label, kind = "page" }: { label: string; kind?: LoaderKind }) {
  const { pending } = useLinkStatus();
  useLoaderWait(pending, label, kind);
  return null;
}

// Place inside a <form>: reports its server action while it is running.
export function FormLoader({ label }: { label: string }) {
  const { pending } = useFormStatus();
  useLoaderWait(pending, label);
  return null;
}

// A coin flip between the two scenes, but never the same one three times in a row.
const history: Record<LoaderKind, Scene[]> = { page: [], inline: [] };
function pickScene(kind: LoaderKind): Scene {
  const [a, b] = history[kind].slice(-2);
  let scene: Scene = a && a === b ? (a === "runners" ? "beaver" : "runners") : Math.random() < 0.5 ? "runners" : "beaver";
  const other: Scene = scene === "runners" ? "beaver" : "runners";
  if (!sceneReady(scene) && sceneReady(other)) scene = other; // never show an animal that has not downloaded yet
  history[kind] = [...history[kind].slice(-1), scene];
  return scene;
}

function useLoaderPhase(kind: LoaderKind) {
  const waiting = useSyncExternalStore(subscribe, () => waits.some(w => w.kind === kind), () => false);
  const label = useSyncExternalStore(subscribe, () => lastLabel[kind], () => "");
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");
  const [look, setLook] = useState<{ scene: Scene; still: boolean }>({ scene: "runners", still: false });
  const shownAt = useRef(0);
  // Next keeps the previous page mounted but hidden for instant Back navigation. Its effects are
  // cleaned up when it is hidden: reset there, so Back never reveals a loader frozen mid-show.
  useEffect(() => () => setPhase("hidden"), []);

  useEffect(() => {
    if (waiting) {
      if (phase === "shown") return;
      const timer = setTimeout(() => {
        shownAt.current = performance.now();
        setLook({ scene: pickScene(kind), still: matchMedia("(prefers-reduced-motion: reduce)").matches });
        setPhase("shown");
      }, phase === "leaving" ? 0 : SHOW_AFTER);
      return () => clearTimeout(timer);
    }
    if (phase === "shown") {
      const timer = setTimeout(() => setPhase("leaving"), Math.max(0, MIN_VISIBLE - (performance.now() - shownAt.current)));
      return () => clearTimeout(timer);
    }
    if (phase === "leaving") {
      const timer = setTimeout(() => setPhase("hidden"), FADE);
      return () => clearTimeout(timer);
    }
  }, [waiting, phase, kind]);

  return { phase, label, ...look, moving: phase !== "hidden" && !look.still };
}

function useFlipbook(img: React.RefObject<HTMLImageElement | null>, files: string[], ms: number, on: boolean) {
  useEffect(() => {
    if (!on) return;
    let i = 0;
    // Only step to frames that have decoded, so a slow download never blanks the animal mid-run.
    const timer = setInterval(() => { const n = (i + 1) % files.length; if (!decoded.has(files[n])) return; i = n; if (img.current) img.current.src = files[i]; }, ms);
    return () => clearInterval(timer);
  }, [img, files, ms, on]);
}

// Squirrel runs and rabbit hops across the meadow; the compact strip keeps only the squirrel.
function Runners({ moving, still, compact }: { moving: boolean; still: boolean; compact: boolean }) {
  const squirrel = useRef<HTMLImageElement>(null);
  const rabbit = useRef<HTMLImageElement>(null);
  // Each animal (and its shadow) stays hidden until its picture has loaded.
  const [shown, setShown] = useState({ squirrel: false, rabbit: false });
  useFlipbook(squirrel, run, 105, moving);
  useFlipbook(rabbit, hop, 162, moving && !compact);
  return <>
    <div className="loader-ground" />
    {!still && !compact && <div className={`loader-runner rabbit${shown.rabbit ? "" : " pending"}`}><span className="shadow" /><img ref={rabbit} src={hop[0]} width={76} height={59} alt="" onLoad={() => setShown(v => ({ ...v, rabbit: true }))} /></div>}
    <div className={`loader-runner squirrel${shown.squirrel ? "" : " pending"}`}><span className="shadow" /><img ref={squirrel} src={run[0]} width={74} height={59} alt="" onLoad={() => setShown(v => ({ ...v, squirrel: true }))} /></div>
  </>;
}

// The beaver swims along the stream at the foot of the same meadow; its frames are cut at the waterline.
function Beaver({ moving }: { moving: boolean }) {
  const beaver = useRef<HTMLImageElement>(null);
  const [shown, setShown] = useState(false);
  useFlipbook(beaver, swim, 225, moving);
  return <>
    <div className="loader-ground" />
    <div className={`loader-swimmer${shown ? "" : " pending"}`}><span className="wake" /><span className="wake w2" /><img ref={beaver} src={swim[0]} width={110} height={34} alt="" onLoad={() => setShown(true)} /></div>
  </>;
}

function Stage({ scene, still, moving, compact }: { scene: Scene; still: boolean; moving: boolean; compact: boolean }) {
  return <div className={`loader-stage ${compact ? "compact" : ""} ${still ? "still" : ""}`} aria-hidden="true">
    {scene === "beaver" ? <Beaver moving={moving} /> : <Runners moving={moving} still={still} compact={compact} />}
  </div>;
}

export function PageLoader() {
  const { phase, label, scene, still, moving } = useLoaderPhase("page");
  // Mounted on every page (root layout): start the background download once the page has settled.
  useEffect(() => { const timer = setTimeout(preload, 1500); return () => clearTimeout(timer); }, []);
  // The status region stays mounted so screen readers announce the text when it appears.
  return <div className="page-loader" role="status" aria-live="polite">
    {phase !== "hidden" && <div className={`page-loader-overlay${phase === "leaving" ? " leaving" : ""}`}>
      <div>
        <Stage scene={scene} still={still} moving={moving} compact={false} />
        <p>{label}</p>
      </div>
    </div>}
  </div>;
}

// Small strip for domain and student switches: the page stays visible underneath.
export function InlineLoader() {
  const { phase, label, scene, still, moving } = useLoaderPhase("inline");
  return <div className="inline-loader" role="status" aria-live="polite">
    {phase !== "hidden" && <div className={`inline-loader-pill${phase === "leaving" ? " leaving" : ""}`}>
      <Stage scene={scene} still={still} moving={moving} compact />
      <span>{label}</span>
    </div>}
  </div>;
}
