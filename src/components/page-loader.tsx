"use client";
/* eslint-disable @next/next/no-img-element -- Tiny local flipbook frames swapped by src; the image optimiser would add a request per frame. */

import { useLinkStatus } from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

// Approved loader from docs/design-concepts/motion. It is decoration only: it appears
// after 250 ms of real waiting, stays at least 700 ms once shown and never takes input.
const SHOW_AFTER = 250, MIN_VISIBLE = 700, FADE = 160;
const FRAMES = "/assets/riverbay/motion/";
const run = [1, 2, 3, 4].map(n => `${FRAMES}run-f${n}.webp`);
const hop = [1, 2, 3, 4].map(n => `${FRAMES}hop-f${n}.webp`);

// Pending work registered by links and the sign-in form; the newest label wins.
// The last label is kept so the text does not vanish during the minimum display time.
let waits: { id: number; label: string }[] = [];
let lastLabel = "";
let nextId = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const isWaiting = () => waits.length > 0;
const currentLabel = () => lastLabel;
let preloaded = false;

function useWait(active: boolean, label: string) {
  useEffect(() => {
    if (!active) return;
    if (!preloaded) { preloaded = true; [...run, ...hop].forEach(src => { new Image().src = src; }); }
    const id = ++nextId;
    waits = [...waits, { id, label }];
    lastLabel = label;
    listeners.forEach(l => l());
    return () => {
      waits = waits.filter(w => w.id !== id);
      lastLabel = waits.at(-1)?.label ?? lastLabel;
      listeners.forEach(l => l());
    };
  }, [active, label]);
}

// Place inside a <Link>: reports that link's navigation while it is still waiting.
export function LinkLoader({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  useWait(pending, label);
  return null;
}

// Place inside a <form>: reports its server action while it is running.
export function FormLoader({ label }: { label: string }) {
  const { pending } = useFormStatus();
  useWait(pending, label);
  return null;
}

function useFlipbook(img: React.RefObject<HTMLImageElement | null>, files: string[], ms: number, on: boolean) {
  useEffect(() => {
    if (!on) return;
    let i = 0;
    const timer = setInterval(() => { i = (i + 1) % files.length; if (img.current) img.current.src = files[i]; }, ms);
    return () => clearInterval(timer);
  }, [img, files, ms, on]);
}

export function PageLoader() {
  const waiting = useSyncExternalStore(subscribe, isWaiting, () => false);
  const label = useSyncExternalStore(subscribe, currentLabel, () => "");
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");
  const [still, setStill] = useState(false);
  const shownAt = useRef(0);
  const squirrel = useRef<HTMLImageElement>(null);
  const rabbit = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (waiting) {
      if (phase === "shown") return;
      const timer = setTimeout(() => {
        shownAt.current = performance.now();
        setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
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
  }, [waiting, phase]);

  const moving = phase !== "hidden" && !still;
  useFlipbook(squirrel, run, 105, moving);
  useFlipbook(rabbit, hop, 162, moving);

  // The status region stays mounted so screen readers announce the text when it appears.
  return <div className="page-loader" role="status" aria-live="polite">
    {phase !== "hidden" && <div className={`page-loader-overlay${phase === "leaving" ? " leaving" : ""}`}>
      <div>
        <div className="page-loader-stage" aria-hidden="true">
          <div className="page-loader-ground" />
          {!still && <div className="page-loader-runner rabbit"><span className="shadow" /><img ref={rabbit} src={hop[0]} width={76} height={59} alt="" /></div>}
          <div className="page-loader-runner squirrel"><span className="shadow" /><img ref={squirrel} src={run[0]} width={74} height={59} alt="" /></div>
        </div>
        <p>{label}</p>
      </div>
    </div>}
  </div>;
}
