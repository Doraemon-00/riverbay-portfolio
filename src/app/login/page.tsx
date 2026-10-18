import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { isConfigured } from "@/lib/supabase/server";
export const instant = false;
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isConfigured()) redirect("/setup");
  const { error } = await searchParams;
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">RIVERBAY PRESCHOOL</p>
        <h1>
          Little moments.
          <br />
          Growing stories.
        </h1>
        <p>Sign in to your learning portfolio workspace.</p>
        {error && (
          <p role="alert" className="error">
            {error === "profile"
              ? "Your account needs a staff profile. Contact your administrator."
              : "Unable to sign in. Check your email and password."}
          </p>
        )}
        <form action={login}>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
            />
          </label>
          <button className="primary">Sign in</button>
        </form>
        <p className="hint">Prototype · fictional children only</p>
      </section>
    </main>
  );
}
