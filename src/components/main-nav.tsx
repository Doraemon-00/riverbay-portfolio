"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { LinkLoader } from "./page-loader";

/** Highlights the section you are in: portfolios belong to My classes. */
export function MainNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const section = path.startsWith("/admin") ? "administration" : path === "/" || path.startsWith("/portfolio") ? "classes" : null;
  return <nav aria-label="Main navigation">
    <Link href="/" aria-current={section === "classes" ? "page" : undefined}>
      <Icon name="books" />
      My classes
      <LinkLoader label="Opening your classes…" />
    </Link>
    {admin && (
      <Link href="/admin" aria-current={section === "administration" ? "page" : undefined}><Icon name="note-pencil" />Administration<LinkLoader label="Opening administration…" /></Link>
    )}
  </nav>;
}
