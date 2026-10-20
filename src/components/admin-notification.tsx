"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icon";

export type AdminNotice = { message: string; error?: boolean; action?: { label: string; run: () => void } };
export type NotifyAdmin = (notice: AdminNotice) => void;

/** Mounted with a fresh key for each notice, so replacement resets its lifetime. */
export function AdminNotification({ notice, dismiss }: { notice: AdminNotice; dismiss: () => void }) {
  const remaining = useRef(5000);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (notice.error || hovered || focused) return;
    const started = Date.now();
    const timer = setTimeout(dismiss, remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [dismiss, notice.error, hovered, focused]);
  return createPortal(<div className={`admin-notification ${notice.error ? "is-error" : ""}`} role={notice.error ? "alert" : "status"} aria-atomic="true"
    onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <Icon name={notice.error ? "x" : "check-circle"} />
    <div className="notice-content"><p>{notice.message}</p>{notice.action && <button type="button" className="notice-action" onClick={() => { notice.action!.run(); dismiss(); }}>{notice.action.label}</button>}</div>
    <button type="button" className="icon-button" aria-label="Dismiss notification" onClick={dismiss}><Icon name="x" size={18} /></button>
  </div>, document.body);
}
