import Image from "next/image";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { WorkspaceMotion } from "@/components/workspace-motion";
import { FormLoader } from "@/components/page-loader";
import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { isConfigured } from "@/lib/supabase/server";

export const instant = false;

export default async function Login({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isConfigured()) redirect("/setup");
  const { error } = await searchParams;
  return (
    <main className="auth-page login-page">
      <WorkspaceMotion>
        <div className="login-layout">
          <section className="login-story">
            <Brand />
            <h1>Little moments.<br />Growing stories.</h1>
            <div className="login-illustration">
              <Image src="/assets/riverbay/signin-scrapbook-v1.png" width={1536} height={1024}
                sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 52vw, 650px"
                alt="" loading="eager" />
            </div>
          </section>
          <section className="panel auth-panel login-auth" aria-labelledby="signin-heading">
            <p className="eyebrow">YOUR TEACHING WORKSPACE</p>
            <div className="login-form-heading">
              <h2 id="signin-heading">Welcome back</h2>
              <p>Every little observation, part of their story.</p>
            </div>
            {error && (
              <p role="alert" className="error">
                {error === "inactive" ? "Your account is archived. Contact your administrator." : error === "profile"
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
                <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
              </label>
              <button className="primary">Sign in <Icon name="arrow-right" /></button>
              <FormLoader label="Signing you in…" />
            </form>
            <div className="login-help"><p className="hint login-demo-note">Prototype · fictional children only</p></div>
          </section>
        </div>
      </WorkspaceMotion>
    </main>
  );
}
