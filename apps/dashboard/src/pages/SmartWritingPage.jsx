import { useState } from 'react';
import ActionBar from '../components/ActionBar.jsx';
import { SparklesIcon } from '../components/Icons.jsx';
import StatusBanner from '../components/StatusBanner.jsx';

const EXAMPLE_PROMPTS = [
  {
    label: 'Leave Request',
    prompt:
      'Write a polite email to my manager asking for leave from Monday to Wednesday due to an urgent personal matter.',
    recipient: 'Manager',
    purpose: 'Leave request',
    tone: 'polite-professional',
    length: 'short',
  },
  {
    label: 'Polite Follow-Up',
    prompt:
      'Write a friendly follow-up message asking for an update on the project notes shared earlier this week.',
    recipient: 'Teammate',
    purpose: 'Follow-up',
    tone: 'friendly',
    length: 'short',
  },
  {
    label: 'Meeting Request',
    prompt:
      'Draft a concise message requesting a 20-minute review call tomorrow at 4:00 PM to finalize the demo script.',
    recipient: 'Team / Mentor',
    purpose: 'Meeting scheduling',
    tone: 'concise',
    length: 'short',
  },
];

export default function SmartWritingPage() {
  const [prompt, setPrompt] = useState('');
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('polite-professional');
  const [length, setLength] = useState('short');
  const [subject, setSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [generationNotice, setGenerationNotice] = useState('');

  function applyExample(example) {
    setPrompt(example.prompt);
    setRecipient(example.recipient);
    setPurpose(example.purpose);
    setTone(example.tone);
    setLength(example.length);
    setGenerationNotice(`Loaded "${example.label}" example prompt. Click Generate Draft when Step 4 templates are wired, or edit the draft area directly.`);
  }

  function handlePreviewGenerate(event) {
    event.preventDefault();
    setGenerationNotice(
      'Local Smart Writing template generation will be implemented in Step 4 (without requiring any API key). No placeholder draft was invented.'
    );
  }

  const combinedDraft = subject.trim() ? `Subject: ${subject.trim()}\n\n${draftBody}` : draftBody;

  return (
    <div className="stack">
      <StatusBanner tone="warning" title="UI Preview — Local Draft Generator Pending">
        Smart Writing template generation (Step 4) is not wired yet. EzWrite will use a dependable
        local fallback that works with zero API keys and never invents missing dates or names.
      </StatusBanner>

      <div className="two-col-grid">
        <form className="panel" onSubmit={handlePreviewGenerate}>
          <div className="panel-header">
            <h3>1. Describe What You Need</h3>
            <span className="pill pill-blue">Local Fallback Mode</span>
          </div>

          <div className="chip-row" aria-label="Example prompts">
            {EXAMPLE_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="chip"
                onClick={() => applyExample(item)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="smart-prompt">Instructions (plain language)</label>
            <textarea
              id="smart-prompt"
              className="text-area"
              rows={5}
              placeholder="Example: Write a polite email to my manager asking for leave from Monday to Wednesday because of an urgent personal matter."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="smart-recipient">Recipient (optional)</label>
              <input
                id="smart-recipient"
                type="text"
                placeholder="e.g., Manager, Client, Professor"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="smart-purpose">Purpose (optional)</label>
              <input
                id="smart-purpose"
                type="text"
                placeholder="e.g., Leave request, Follow-up"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="smart-tone">Tone</label>
              <select id="smart-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="polite-professional">Polite & Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise & Direct</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="smart-length">Length</label>
              <select id="smart-length" value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>

          <div className="panel-actions">
            <button type="submit" className="btn btn-primary" disabled={!prompt.trim()}>
              <SparklesIcon />
              <span>Generate Draft (Step 4)</span>
            </button>
          </div>

          {generationNotice ? (
            <p className="status-line" role="status" aria-live="polite">
              {generationNotice}
            </p>
          ) : null}
        </form>

        <section className="panel" aria-label="Editable draft preview">
          <div className="panel-header">
            <h3>2. Editable Draft Preview</h3>
            <span className="pill pill-neutral">User Controlled</span>
          </div>

          <div className="form-field">
            <label htmlFor="draft-subject">Subject (optional for emails)</label>
            <input
              id="draft-subject"
              type="text"
              placeholder="Generated or custom subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="draft-body">Message / Email Body</label>
            <textarea
              id="draft-body"
              className="text-area"
              rows={8}
              placeholder="Generated draft will appear here for review and editing. You can also type or edit text manually right now."
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
            />
          </div>

          <ActionBar text={combinedDraft} copyLabel="Copy Draft" />
        </section>
      </div>
    </div>
  );
}
