"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <h1>We couldn’t load that page.</h1>
        <p>
          Please try again. If the problem continues, check that the local
          database is running.
        </p>
        <button className="primary" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
