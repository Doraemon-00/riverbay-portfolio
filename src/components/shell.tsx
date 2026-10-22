import Image from "next/image";
import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { QuickTour } from "./quick-tour";
import { WorkspaceMotion } from "./workspace-motion";
import { LinkLoader } from "./page-loader";
import type { Profile } from "@/lib/auth";
import { logout } from "@/app/actions";
export function Shell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to workspace</a>
      <header className="topbar">
        <Link href="/" className="brand">
          <Brand />
          {/* Easter egg: rest on the logo and the beaver peeks out from behind the wordmark (CSS only). */}
          <span className="logo-peek" aria-hidden="true"><Image src="/assets/riverbay/motion/beaver-peek.webp" width={38} height={56} alt="" loading="eager" unoptimized /></span>
          <LinkLoader label="Opening your classes…" />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">
            <Icon name="books" />
            My classes
            <LinkLoader label="Opening your classes…" />
          </Link>
          {profile.role === "admin" && (
            <Link href="/admin"><Icon name="note-pencil" />Administration<LinkLoader label="Opening administration…" /></Link>
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
      </header>
      <main className="page" id="main-content"><WorkspaceMotion>{children}</WorkspaceMotion></main>
    </>
  );
}
