import Image from "next/image";
import { Brand } from "@/components/brand";
import { WorkspaceMotion } from "@/components/workspace-motion";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
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
            {/* ?error= comes from a sign-in posted before the script loaded, or from other pages (inactive, profile). */}
            <LoginForm initialError={error} />
            <div className="login-help"><p className="hint login-demo-note">Prototype · fictional children only</p></div>
          </section>
        </div>
      </WorkspaceMotion>
    </main>
  );
}
