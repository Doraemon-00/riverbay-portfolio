import Image from "next/image";
import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { MainNav } from "./main-nav";
import { QuickTour } from "./quick-tour";
import { WorkspaceMotion } from "./workspace-motion";
import { LinkLoader } from "./page-loader";
import type { Profile } from "@/lib/auth";
import { logout } from "@/app/actions";

/** The logo heads a full-height left column that holds each page's own list; the top bar spans only the content. */
export function Shell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">Skip to workspace</a>
      <div className="frame-rail">
        <div className="frame-brand">
          <Link href="/" className="brand">
            <Brand />
            {/* Easter egg: rest on the logo and the beaver peeks out from behind the wordmark (CSS only). */}
            <span className="logo-peek" aria-hidden="true"><Image src="/assets/riverbay/motion/beaver-peek.webp" width={38} height={56} alt="" loading="eager" unoptimized /></span>
            <LinkLoader label="Opening your classes…" />
          </Link>
        </div>
      </div>
      <header className="topbar frame-topbar">
        <MainNav admin={profile.role === "admin"} />
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
      </header>
      <main className="frame-page" id="main-content">
        {profile.guest && <p className="guest-banner" role="note"><strong>Guest demo.</strong> Other visitors share this school, and it resets every day at 3am SGT. Use fictional names and placeholder images only.</p>}
        <WorkspaceMotion>{children}</WorkspaceMotion>
      </main>
    </div>
  );
}
