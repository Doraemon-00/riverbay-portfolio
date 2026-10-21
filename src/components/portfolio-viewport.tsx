"use client";

import { useLayoutEffect, useRef } from "react";

// The shared layout keeps this reservation when a tall editor becomes an empty
// class. Otherwise the document shrinks and the browser clamps scrollY to zero,
// even when every navigation link requests scroll:false.
export function PortfolioViewport({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    let reserved = 0;
    let width = window.innerWidth;
    function reserve() {
      if (!element) return;
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        reserved = 0;
        element.style.minHeight = "";
      }
      const height = Math.ceil(element.getBoundingClientRect().height);
      if (height > reserved) {
        reserved = height;
        element.style.minHeight = `${reserved}px`;
      }
    }
    reserve();
    const observer = new ResizeObserver(reserve);
    observer.observe(element);
    window.addEventListener("resize", reserve);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reserve);
    };
  }, []);
  return <div className="portfolio-viewport" ref={frame}>{children}</div>;
}
