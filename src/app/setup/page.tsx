import Link from "next/link";
export default function Setup() {
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">RIVERBAY · LOCAL SETUP</p>
        <h1>A home for learning stories.</h1>
        <p>Connect the local database to start the working prototype.</p>
        <ol>
          <li>
            Run <code>npm run db:start</code> with Docker running.
          </li>
          <li>
            Run <code>npm run setup:local</code> to create local environment
            settings and fictional demo accounts.
          </li>
          <li>
            Restart <code>npm run dev</code>.
          </li>
        </ol>
        <p>
          Demo access details are written to the ignored{" "}
          <code>.demo-access.txt</code> file. See the repository README for the
          full instructions.
        </p>
        <Link className="button primary" href="/login">
          Continue to sign in
        </Link>
      </section>
    </main>
  );
}
