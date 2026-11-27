import { APP_INFO, WRITING_MODES } from '@ezwrite/core';

export default function App() {
  return (
    <main className="page">
      <header className="header">
        <div className="brand-row">
          <div>
            <h1 className="title">{APP_INFO.name}</h1>
            <p className="tagline">{APP_INFO.tagline}</p>
          </div>
          <span className="status-badge">{APP_INFO.prototypeStage}</span>
        </div>

        <p className="scope-note">
          <strong>Prototype Scope:</strong> {APP_INFO.scopeLabel}. Starts locally without paid APIs
          or API keys. Generated text will never be sent or submitted automatically.
        </p>
      </header>

      <section className="grid" aria-label="Planned writing modes">
        {WRITING_MODES.map((mode) => (
          <article className="card" key={mode.id}>
            <div className="card-header">
              <h2>{mode.title}</h2>
              <span className="pill">{mode.status}</span>
            </div>
            <p>{mode.summary}</p>
          </article>
        ))}
      </section>

      <section className="footer-panel" aria-label="Current prototype status">
        <h3>What works right now (Step 1)</h3>
        <ul>
          <li>React + Vite companion dashboard is running and wired to <code>@ezwrite/core</code>.</li>
          <li>Chrome Extension (Manifest V3) foundation builds cleanly into <code>apps/extension/dist</code>.</li>
          <li>
            <strong>Future Direction (not in this browser prototype):</strong> Windows OS-level
            background assistant with system-wide shortcuts and desktop-wide insertion.
          </li>
        </ul>
      </section>
    </main>
  );
}
