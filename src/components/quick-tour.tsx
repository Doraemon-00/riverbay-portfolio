"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Driver, DriveStep } from "driver.js";
import { Icon } from "./icon";
export function QuickTour() {
  const pathname = usePathname();
  const active = useRef<Driver | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.destroy(); }; }, [pathname]);
  async function start() {
    setLoading(true); setError(false);
    try {
      const { driver } = await import("driver.js");
      if (!mounted.current) return;
      const steps: DriveStep[] = pathname.startsWith("/portfolio/") ? [
        { element: ".child-nav", popover: { title: "Work through your class", description: "Move to the next child while staying in the same learning domain. Save any changes before moving on." } },
        { element: ".domain-tabs", popover: { title: "Four learning domains", description: "Switch between English, Chinese, Mathematics and Social-emotional Development." } },
        { element: ".rating-options", popover: { title: "A quick learning indicator", description: "Choose a labelled level, then add observations in your own words. The ring is not a percentage or a calculated score." } },
        { element: ".narrative-panel", popover: { title: "Shape the learning story", description: "Write or edit the narrative here. This build saves drafts; AI drafting and final review will be connected next." } },
        { element: ".save-bar", popover: { title: "Save before moving on", description: "Save feedback refers to this draft only. Saving is separate from reviewing or exporting a report." } },
      ] : pathname === "/admin" ? [
        { element: ".admin-grid", popover: { title: "Set up class access", description: "Assign staff to a class and semester, and enrol children. The database enforces these assignments." } },
      ] : [
        { element: ".page-heading", popover: { title: "Your portfolio workspace", description: "Start with an assigned class and reporting semester." } },
        { element: ".class-section .section-heading", popover: { title: "See the whole class", description: "Each domain shows its saved progress. A draft is not a reviewed report. Scroll sideways on a small screen to see every domain." } },
        { element: ".table-wrap .text-link", popover: { title: "Continue a child's story", description: "Open a portfolio to choose an indicator, add observations and save a narrative." } },
      ];
      active.current?.destroy();
      active.current = driver({ steps: steps.filter(step => !step.element || document.querySelector(step.element as string)), animate: false, smoothScroll: false, showProgress: true, allowClose: true, disableActiveInteraction: true, popoverClass: "riverbay-tour", nextBtnText: "Next", prevBtnText: "Back", doneBtnText: "Got it", onDestroyed: () => trigger.current?.focus() });
      active.current.drive();
    } catch { if (mounted.current) setError(true); }
    finally { if (mounted.current) setLoading(false); }
  }
  return <span className="tour-control"><button ref={trigger} type="button" className="tour-button" onClick={start} disabled={loading}><Icon name="book-open" size={18} />{loading ? "Opening…" : "Quick tour"}</button>{error && <span role="alert" className="hint">Tour unavailable. Try again.</span>}</span>;
}
