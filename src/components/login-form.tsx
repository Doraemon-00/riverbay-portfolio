"use client";

import { useState, type FormEvent } from "react";
import type { LoginError } from "@/app/api/auth/login/route";
import { Icon } from "./icon";
import { useLoaderWait } from "./page-loader";

const messages: Record<LoginError, string> = {
  invalid: "Enter your email and password.",
  credentials: "Unable to sign in. Check your email and password.",
  busy: "Too many sign-in attempts. Wait a minute, then try again.",
  service: "We couldn’t reach the sign-in service. Please try again.",
  inactive: "Your account is archived. Contact your administrator.",
  profile: "Your account needs a staff profile. Contact your administrator.",
  guest: "Guest sign-in isn’t available right now. Please try again later.",
};

/** Sign-in keeps the typed email after a failed attempt and hides the message once either field changes. */
export function LoginForm({ initialError, guest }: { initialError?: string; guest?: boolean }) {
  const [error, setError] = useState<LoginError | null>(initialError && initialError in messages ? initialError as LoginError : null);
  const [pending, setPending] = useState(false);
  useLoaderWait(pending, "Signing you in…");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const asGuest = form.dataset.guest === "true";
    setPending(true); setError(null);
    try {
      const response = await fetch(asGuest ? "/api/auth/guest" : "/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(asGuest ? {} : { email: fields.get("email"), password: fields.get("password") }),
      });
      const body = await response.json().catch(() => ({ ok: false, error: asGuest ? "guest" : "service" }));
      // A full page load, not router.replace: the router still holds the signed-out redirect from / to
      // this page and would send the teacher straight back here. Stay pending until My classes opens.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (body.ok) { window.location.assign("/"); return; }
      setError(body.error in messages ? body.error : "service");
      if (!asGuest) (form.elements.namedItem("password") as HTMLInputElement | null)?.select();
    } catch { setError(asGuest ? "guest" : "service"); }
    setPending(false);
  }

  return <>
    {error && <p role="alert" className="error">{messages[error]}</p>}
    {/* method and action make a submit before the script loads a POST to the endpoint, not a GET with the password in the URL. */}
    <form method="post" action="/api/auth/login" onSubmit={event => void submit(event)} onChange={() => setError(null)}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      <button className="primary" disabled={pending}>Sign in <Icon name="arrow-right" /></button>
    </form>
    {guest && <>
      <p className="login-divider"><span>or</span></p>
      <form className="guest-signin" method="post" action="/api/auth/guest" data-guest="true" onSubmit={event => void submit(event)}>
        <button className="guest-button" disabled={pending}>Sign in as guest</button>
      </form>
      <p className="hint guest-note">Opens a shared demo school as an administrator. Fictional data only; it resets every day at 3am SGT.</p>
    </>}
  </>;
}
