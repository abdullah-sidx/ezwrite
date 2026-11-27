import { useState } from 'react';
import { DEFAULT_SETTINGS, SUPPORTED_LANGUAGES } from '@ezwrite/core';
import StatusBanner from '../components/StatusBanner.jsx';

export default function SettingsPage({ settings, onUpdateSettings, onResetSettings }) {
  const [resetMessage, setResetMessage] = useState('');

  function handleReset() {
    onResetSettings();
    setResetMessage('Settings reset to default prototype values for this session.');
  }

  return (
    <div className="stack">
      <StatusBanner tone="info" title="Prototype Preferences (Session State)">
        Changes here update the dashboard UI immediately. Persistent browser/extension storage will
        be connected when Chrome extension integration is added.
      </StatusBanner>

      <div className="two-col-grid">
        <section className="panel" aria-label="Language and cleanup preferences">
          <h3>Language & Cleanup</h3>

          <div className="form-field">
            <label htmlFor="settings-language">Preferred Speech Language</label>
            <select
              id="settings-language"
              value={settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value })}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.autoCapitalize}
              onChange={(e) => onUpdateSettings({ autoCapitalize: e.target.checked })}
            />
            <span>
              <strong>Auto-capitalize sentence starts</strong>
              <small>Conservative rule — preserves names, URLs, and abbreviations (Step 3).</small>
            </span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.conservativePunctuation}
              onChange={(e) => onUpdateSettings({ conservativePunctuation: e.target.checked })}
            />
            <span>
              <strong>Conservative punctuation cleanup</strong>
              <small>Applies ending punctuation only when rules are clear (Step 3).</small>
            </span>
          </label>
        </section>

        <section className="panel" aria-label="AI provider and shortcuts">
          <h3>Smart Writing & Shortcuts</h3>

          <div className="form-field">
            <label htmlFor="settings-provider">Smart Writing Engine</label>
            <select
              id="settings-provider"
              value={settings.aiProvider}
              onChange={(e) => onUpdateSettings({ aiProvider: e.target.value })}
              disabled
            >
              <option value={DEFAULT_SETTINGS.aiProvider}>
                Local Template Fallback (No API Key Required)
              </option>
            </select>
            <p className="helper-text">
              Optional external AI providers will remain optional and disabled unless explicitly
              configured later.
            </p>
          </div>

          <div className="info-box">
            <strong>Keyboard Shortcuts Status</strong>
            <p>
              Chrome extension commands have browser-defined limits. True OS-wide hold-to-talk
              shortcuts belong to the future Windows desktop application, not this browser prototype.
            </p>
          </div>
        </section>
      </div>

      <section className="panel" aria-label="Privacy and limitations">
        <div className="panel-header">
          <h3>Privacy, Control & Honest Limitations</h3>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
        <ul className="check-list">
          <li>EzWrite never stores raw audio recordings by default.</li>
          <li>EzWrite never auto-sends, auto-submits, or publishes your text.</li>
          <li>
            Browser <code>SpeechRecognition</code> (when enabled in Step 7) depends on Chrome and
            may use a browser-managed speech service rather than offline recognition.
          </li>
          <li>
            Direct webpage insertion cannot run on protected browser pages or every custom editor;
            Copy to Clipboard always remains available as a fallback.
          </li>
        </ul>
        {resetMessage ? (
          <p className="status-line" role="status" aria-live="polite">
            {resetMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
