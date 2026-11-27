import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@ezwrite/core';
import ActionBar from '../components/ActionBar.jsx';
import { MicIcon } from '../components/Icons.jsx';
import StatusBanner from '../components/StatusBanner.jsx';

export default function VoiceTypingPage({ settings, onUpdateSettings }) {
  const [rawText, setRawText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [micNotice, setMicNotice] = useState(
    'Idle — Browser SpeechRecognition will be wired in Step 7. You can test the editable draft area by typing below.'
  );

  function handlePreviewMic() {
    setMicNotice(
      'Speech capture is not connected yet (planned for Step 7). Use the raw text field below to preview the editing layout.'
    );
  }

  function handleTransferToEditor() {
    if (!rawText.trim()) return;
    setEditedText(rawText);
    setMicNotice(
      'Copied raw text into the editable result box without altering it. Conservative cleanup rules will be added in Step 3.'
    );
  }

  function handleClear() {
    setRawText('');
    setEditedText('');
    setMicNotice('Cleared fields. Ready for input.');
  }

  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;

  return (
    <div className="stack">
      <StatusBanner tone="warning" title="UI Preview — Speech & Cleanup Pending">
        Microphone speech capture (Step 7), conservative text cleanup rules (Step 3), and active
        webpage field insertion (Steps 5–6) are not wired yet. No fake transcription is simulated.
      </StatusBanner>

      <section className="panel" aria-label="Microphone controls and language">
        <div className="controls-row">
          <div className="mic-group">
            <button type="button" className="btn btn-primary" onClick={handlePreviewMic}>
              <MicIcon />
              <span>Start Voice Typing (Step 7)</span>
            </button>
            <span className="pill pill-neutral">Status: Standby</span>
          </div>

          <div className="field-inline">
            <label htmlFor="voice-lang">Speech Language</label>
            <select
              id="voice-lang"
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
        </div>

        <p className="status-line" role="status" aria-live="polite">
          {micNotice}
        </p>
      </section>

      <section className="two-col-grid" aria-label="Voice typing editor workspace">
        <div className="panel">
          <div className="panel-header">
            <h3>1. Recognized / Typed Input</h3>
            <span className="pill pill-neutral">Fallback Input</span>
          </div>
          <label htmlFor="raw-speech-input" className="sr-only">
            Recognized or typed input
          </label>
          <textarea
            id="raw-speech-input"
            className="text-area"
            rows={7}
            placeholder="When Step 7 is wired, spoken text appears here. You can also type or paste raw text right now as a fallback..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="panel-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTransferToEditor}
              disabled={!rawText.trim()}
            >
              Move to Editable Result →
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClear}
              disabled={!rawText && !editedText}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>2. Cleaned & Editable Result</h3>
            <span className="pill pill-neutral">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <label htmlFor="cleaned-result-input" className="sr-only">
            Cleaned and editable result
          </label>
          <textarea
            id="cleaned-result-input"
            className="text-area"
            rows={7}
            placeholder="Your editable text appears here. You always review and approve text before copying or inserting."
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <ActionBar text={editedText} copyLabel="Copy Result" />
        </div>
      </section>
    </div>
  );
}
