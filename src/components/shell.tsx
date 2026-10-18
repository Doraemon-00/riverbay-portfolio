import Link from "next/link";
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
      <div className="demo-strip">
        RIVERBAY DESIGN PROTOTYPE{" "}
        <span>Fictional people · placeholder content</span>
      </div>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <svg
              width="29"
              height="29"
              viewBox="0 0 256 256"
              fill="currentColor"
              aria-hidden="true"
            >
              <use href="/assets/icons.svg#book-open" />
            </svg>
          </span>
          <span>
            <strong>Riverbay</strong>
            <small>PRESCHOOL · LEARNING PORTFOLIOS</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">
            <svg
              width="17"
              height="17"
              viewBox="0 0 256 256"
              fill="currentColor"
              aria-hidden="true"
            >
              <use href="/assets/icons.svg#book-open" />
            </svg>{" "}
            My classes
          </Link>
          {profile.role === "admin" && (
            <Link href="/admin">Class administration</Link>
          )}
        </nav>
        <div className="account">
          <span>
            {profile.display_name}
            <small>
              {profile.role === "admin" ? "Administrator" : "Teacher"}
            </small>
          </span>
          <form action={logout}>
            <button className="quiet">Sign out</button>
          </form>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
