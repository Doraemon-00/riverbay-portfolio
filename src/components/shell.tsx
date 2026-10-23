import Image from "next/image";
import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { QuickTour } from "./quick-tour";
import { WorkspaceMotion } from "./workspace-motion";
import { LinkLoader } from "./page-loader";
import type { Profile } from "@/lib/auth";
import { logout } from "@/app/actions";
/**
 * framed: the logo heads a full-height left column that holds the page's own list (classes, students),
 * and the top bar spans only the content beside it. Trial layout, used by My classes only.
 */
export function Shell({
  profile,
  children,
  framed = false,
  current,
}: {
  profile: Profile;
  children: React.ReactNode;
  framed?: boolean;
  current?: "classes" | "administration";
}) {
  const brand = (
    <Link href="/" className="brand">
      <Brand />
      {/* Easter egg: rest on the logo and the beaver peeks out from behind the wordmark (CSS only). */}
      <span className="logo-peek" aria-hidden="true"><Image src="/assets/riverbay/motion/beaver-peek.webp" width={38} height={56} alt="" loading="eager" unoptimized /></span>
      <LinkLoader label="Opening your classes…" />
    </Link>
  );
  const controls = <>
    <nav aria-label="Main navigation">
      <Link href="/" aria-current={current === "classes" ? "page" : undefined}>
        <Icon name="books" />
        My classes
        <LinkLoader label="Opening your classes…" />
      </Link>
      {profile.role === "admin" && (
        <Link href="/admin" aria-current={current === "administration" ? "page" : undefined}><Icon name="note-pencil" />Administration<LinkLoader label="Opening administration…" /></Link>
      )}
    </nav>
    <QuickTour viewerId={profile.id} admin={profile.role === "admin"} />
    <div className="account">
      <span>
        {profile.display_name}
        <small>
          {profile.role === "admin" ? "Administrator" : "Teacher"}
        </small>
      </span>
      <form action={logout}>
        <button className="quiet"><Icon name="sign-out" size={18} />Sign out</button>
      </form>
    </div>
  </>;
  if (framed) return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">Skip to workspace</a>
      <div className="frame-rail"><div className="frame-brand">{brand}</div></div>
      <header className="topbar frame-topbar">{controls}</header>
      <main className="frame-page" id="main-content"><WorkspaceMotion>{children}</WorkspaceMotion></main>
    </div>
  );
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to workspace</a>
      <header className="topbar">{brand}{controls}</header>
      <main className="page" id="main-content"><WorkspaceMotion>{children}</WorkspaceMotion></main>
    </>
  );
}
