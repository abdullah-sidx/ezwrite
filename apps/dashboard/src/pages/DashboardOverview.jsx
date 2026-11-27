import { APP_INFO, WRITING_MODES } from '@ezwrite/core';
import StatusBanner from '../components/StatusBanner.jsx';

export default function DashboardOverview({ onNavigate }) {
  return (
    <div className="stack">
      <StatusBanner tone="info" title="Round 2 Prototype — Step 2 UI Ready">
        {APP_INFO.scopeLabel}. Speech recognition, cleanup rules, local Smart Writing templates,
        and Chrome page insertion are planned in upcoming steps and clearly labeled below.
      </StatusBanner>

      <section className="hero-card" aria-labelledby="overview-heading">
        <div className="hero-content">
          <span className="eyebrow">Voice-First Writing Workspace</span>
          <h2 id="overview-heading" className="hero-title">
            Speak naturally, review clearly, stay in control.
          </h2>
          <p className="hero-text">
            EzWrite helps students, professionals, and everyday writers turn spoken thoughts or
            simple instructions into clear, editable text—without auto-sending messages or requiring
            paid API keys to launch.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('voice-typing')}
            >
              Open Voice Typing
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('smart-writing')}
            >
              Open Smart Writing
            </button>
          </div>
        </div>
      </section>

      <section className="mode-grid" aria-label="Core writing modes">
        {WRITING_MODES.map((mode) => (
          <article className="panel mode-card" key={mode.id}>
            <div className="panel-header">
              <h3>{mode.title}</h3>
              <span className="pill pill-blue">{mode.status}</span>
            </div>
            <p className="muted-text">{mode.summary}</p>
            <div className="mode-card-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onNavigate(mode.id)}
              >
                Open {mode.title} →
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="two-col-grid" aria-label="Prototype status and roadmap">
        <article className="panel">
          <h3>Implemented Today (Steps 1–2)</h3>
          <ul className="check-list">
            <li>React + Vite dashboard running locally and via Docker Compose.</li>
            <li>Accessible navigation across Dashboard, Voice Typing, Smart Writing, and Settings.</li>
            <li>Shared <code>@ezwrite/core</code> package and Chrome MV3 extension build foundation.</li>
          </ul>
        </article>

        <article className="panel">
          <h3>Upcoming vs. Future Desktop Vision</h3>
          <ul className="check-list">
            <li>
              <strong>Next in Round 2:</strong> Conservative text cleanup, local Smart Writing
              templates, Chrome content-script insertion, and browser <code>SpeechRecognition</code>.
            </li>
            <li>
              <strong>Future OS Product (not built here):</strong> Windows desktop background app
              with system-wide shortcuts and desktop-wide insertion.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
