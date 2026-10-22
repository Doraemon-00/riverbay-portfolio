"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Driver, DriveStep } from "driver.js";
import { dialogGuide, introductionSteps, pageGuide, visibleTarget, type Guide } from "@/lib/quick-tours";
import { hasSeenTourIntro, rememberTourIntro, tourOnboardingKey } from "@/lib/tour-onboarding";
import { Icon } from "./icon";

type Context = { root: HTMLElement; guide: Guide };
function context(trigger: HTMLElement | null): Context | null {
  const dialog = trigger?.closest<HTMLDialogElement>("dialog[open]");
  if (dialog) { const guide = dialogGuide(dialog.dataset.tourDialog ?? "dialog"); return guide ? { root: dialog, guide } : null; }
  const root = visibleTarget(document, "[data-tour-page]");
  return root ? { root, guide: pageGuide(root.dataset.tourPage ?? "", root) } : null;
}

export function QuickTour({ inline = false, disabled = false, viewerId, admin = false }: { inline?: boolean; disabled?: boolean; viewerId?: string; admin?: boolean }) {
  const pathname = usePathname();
  const active = useRef<Driver | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const version = useRef(0);
  const mounted = useRef(false);
  const cleanup = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    mounted.current = true;
    version.current++;
    return () => { mounted.current = false; active.current?.destroy(); cleanup.current?.(); };
  }, [pathname]);
  const start = useCallback(async (guide: Guide, root: HTMLElement) => {
    const request = ++version.current;
    setLoading(true); setError(false);
    try {
      const { driver } = await import("driver.js");
      if (!mounted.current || version.current !== request || !root.isConnected || !root.getClientRects().length) return;
      active.current?.destroy(); cleanup.current?.();
      const introductions = !inline && viewerId ? introductionSteps(root.dataset.tourPage ?? "", admin,
        hasSeenTourIntro(viewerId, "workspace"), hasSeenTourIntro(viewerId, "administration")) : [];
      const resolved = [...introductions, ...guide.steps].flatMap(step => {
        const element = step.selector ? visibleTarget(step.documentTarget ? document : root, step.selector) : undefined;
        return step.selector && !element ? [] : [{ step, element }];
      });
      const steps: DriveStep[] = resolved.map(({step, element}) => ({ element, popover: {
        title:step.title, description:step.description, side:"bottom", align:"start",
      } }));
      if (!steps.length) steps.push({ popover:{ title:guide.label, description:"There are no controls to highlight in this view yet. Choose an available class or close the current dialog, then reopen Quick tour for that page." } });
      const originalKey = root.dataset.tourKey;
      const dialog = root instanceof HTMLDialogElement ? root : null;
      const page = root.closest<HTMLElement>("[data-tour-page]");
      const pageKey = page?.dataset.tourKey;
      const origin = { x:window.scrollX, y:window.scrollY };
      const dialogScroll = dialog?.querySelector<HTMLElement>(".admin-dialog-content");
      const scrollTop = dialogScroll?.scrollTop;
      const stop = () => active.current?.destroy();
      const resized = () => { const element = active.current?.getActiveElement(); if (element && !element.getClientRects().length) stop(); };
      // Escape ends the tour before the browser can cancel an underlying native dialog.
      const escape = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault(); event.stopImmediatePropagation(); stop();
      };
      const observer = new MutationObserver(() => {
        const element = active.current?.getActiveElement();
        if (!root.isConnected || root.dataset.tourKey !== originalKey || (page && page.dataset.tourKey !== pageKey)
          || (dialog && !dialog.open) || (element && (!element.isConnected || !element.getClientRects().length))) stop();
      });
      const dispose = () => { observer.disconnect(); window.removeEventListener("keydown",escape,true); window.removeEventListener("resize",resized); root.removeEventListener("close",stop); cleanup.current = null; };
      cleanup.current = dispose;
      let previousIndex = -1;
      active.current = driver({
        steps, animate:!window.matchMedia("(prefers-reduced-motion: reduce)").matches, duration:160,
        smoothScroll:false, showProgress:true, progressText:"{{current}} of {{total}}", allowClose:true,
        overlayClickBehavior:"none", disableActiveInteraction:true, skipMissingElement:true,
        stagePadding:6, stageRadius:12, overlayColor:"#2B3631", overlayOpacity:dialog ? 0.18 : 0.42,
        popoverClass:"riverbay-tour", nextBtnText:"Next", prevBtnText:"Back", doneBtnText:"Done", closeBtnLabel:"Close quick tour",
        onHighlighted:(_element, _step, { driver: current }) => {
          const index = current.getActiveIndex() ?? 0;
          const intro = resolved[previousIndex]?.step.intro;
          // Advancing past the introduction acknowledges it; closing or going Back does not.
          if (index > previousIndex && intro && viewerId) rememberTourIntro(viewerId, intro);
          previousIndex = index;
        },
        onPopoverRender:popover => {
          const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
          svg.setAttribute("width","18"); svg.setAttribute("height","18"); svg.setAttribute("viewBox","0 0 256 256"); svg.setAttribute("fill","currentColor"); svg.setAttribute("aria-hidden","true");
          const use = document.createElementNS("http://www.w3.org/2000/svg","use"); use.setAttribute("href","/assets/icons.svg#x"); svg.append(use);
          popover.closeButton.replaceChildren(svg);
        },
        onDestroyed:() => {
          dispose(); active.current = null;
          if (!mounted.current || !root.isConnected || !root.getClientRects().length || (dialog && !dialog.open)) return;
          if (dialogScroll && scrollTop !== undefined) dialogScroll.scrollTop = scrollTop;
          window.scrollTo({ left:origin.x, top:origin.y, behavior:"instant" });
          trigger.current?.focus({ preventScroll:true });
        },
      });
      window.addEventListener("keydown",escape,true);
      window.addEventListener("resize",resized);
      root.addEventListener("close",stop);
      observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","open","data-tour-key"]});
      window.dispatchEvent(new Event("riverbay:tour-started"));
      active.current.drive();
      requestAnimationFrame(() => active.current?.refresh());
    } catch { active.current?.destroy(); cleanup.current?.(); if (mounted.current) setError(true); }
    finally { if (mounted.current && version.current === request) setLoading(false); }
  }, [inline, viewerId, admin]);

  useEffect(() => {
    if (inline) return;
    const startWelcome = () => {
      const current = context(trigger.current);
      if (current) void start(current.guide, current.root);
    };
    window.addEventListener("riverbay:start-tour", startWelcome);
    return () => window.removeEventListener("riverbay:start-tour", startWelcome);
    // The event always resolves the current DOM context, not a stale route snapshot.
  }, [inline, pathname, start]);

  function open() {
    const current = context(trigger.current);
    if (!current) { setError(true); return; }
    void start(current.guide, current.root);
  }
  return <span className={`tour-control${inline ? " tour-inline" : ""}`}>
    <button ref={trigger} type="button" className="tour-button" onClick={open} disabled={loading || disabled} aria-label={inline ? "Quick tour" : undefined} title={inline ? "Quick tour" : undefined} aria-haspopup="dialog"><Icon name="book-open" size={inline ? 16 : 18} /><span className="tour-button-label">{loading ? "Opening…" : "Quick tour"}</span></button>
    {error && <span role="alert" className="hint">Tour unavailable. Try again.</span>}
  </span>;
}

/** A once-per-account invitation, not an automatic or blocking tour. */
export function TourWelcome({ viewerId }: { viewerId:string }) {
  const key = tourOnboardingKey(viewerId, "welcome");
  const [open,setOpen] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setOpen(localStorage.getItem(key) !== "dismissed"); } catch { setOpen(true); }
    });
    const dismissed = () => { setOpen(false); try { localStorage.setItem(key,"dismissed"); } catch { /* Guidance still works without storage. */ } };
    window.addEventListener("riverbay:tour-started",dismissed);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("riverbay:tour-started",dismissed); };
  },[key]);
  function dismiss() { setOpen(false); try { localStorage.setItem(key,"dismissed"); } catch { /* Optional preference only. */ } }
  if (!open) return null;
  return <aside className="tour-welcome" aria-label="Welcome help"><span><strong>New here?</strong> A short tour can help you find your way. Replay it anytime from Quick tour.</span><div><button type="button" className="text-action" onClick={() => { dismiss(); window.dispatchEvent(new Event("riverbay:start-tour")); }}>Show me around</button><button type="button" className="icon-button" aria-label="Dismiss welcome help" onClick={dismiss}><Icon name="x" size={18} /></button></div></aside>;
}
