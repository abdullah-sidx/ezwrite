import { useState } from 'react';
import {
  DRAFT_SOURCES,
  SMART_WRITING_LENGTHS,
  SMART_WRITING_MODES,
  SMART_WRITING_TONES,
} from '@ezwrite/core';
import ActionBar from '../components/ActionBar.jsx';
import { CopyIcon, SparklesIcon } from '../components/Icons.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import { requestSmartDraft } from '../services/smartWritingClient.js';

const EXAMPLE_PROMPTS = [
  {
    label: 'Assignment Extension',
    prompt:
      'Write an email to my professor asking for two extra days to submit my assignment because I was sick.',
    recipient: 'Professor',
    purpose: 'Assignment Submission Extension',
    mode: 'professional-email',
    tone: 'polite',
    length: 'medium',
  },
  {
    label: 'Leave Request',
    prompt:
      'Write a polite email to my manager asking for leave from Monday to Wednesday because I have an urgent personal matter.',
    recipient: 'Manager',
    purpose: 'Leave Request',
    mode: 'request',
    tone: 'polite',
    length: 'short',
  },
  {
    label: 'Apology Message',
    prompt:
      'Say sorry to Riya for missing today’s 4:00 PM call because my internet connection went down.',
    recipient: 'Riya',
    purpose: 'Apology for Missed Call',
    mode: 'apology',
    tone: 'friendly',
    length: 'short',
  },
  {
    label: 'Follow-up',
    prompt:
      'Follow up with the HR team about my interview status from last Tuesday.',
    recipient: 'HR Team',
    purpose: 'Interview Status Follow-Up',
    mode: 'follow-up',
    tone: 'professional',
    length: 'medium',
  },
];

export default function SmartWritingPage({ settings }) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('professional-email');
  const [tone, setTone] = useState('polite');
  const [length, setLength] = useState('medium');
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');

  const [subject, setSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [variant, setVariant] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMeta, setStatusMeta] = useState(null);
  const [subjectCopied, setSubjectCopied] = useState('');

  function applyExample(example) {
    setPrompt(example.prompt);
    setRecipient(example.recipient);
    setPurpose(example.purpose);
    setMode(example.mode);
    setTone(example.tone);
    setLength(example.length);
    setErrorMessage('');
    setSubjectCopied('');
  }

  async function runGeneration(nextVariant) {
    setErrorMessage('');
    setSubjectCopied('');
    setIsLoading(true);

    try {
      const preferLocal = settings?.aiProvider !== 'server-ai';
      const result = await requestSmartDraft(
        {
          instructions: prompt,
          mode,
          tone,
          length,
          recipient,
          purpose,
          variant: nextVariant,
        },
        { preferLocal }
      );

      setSubject(result.subject);
      setDraftBody(result.body);
      setVariant(nextVariant);
      setHasGenerated(true);
      setStatusMeta({
        source: result.source,
        providerName: result.providerName,
        usedFallback: result.usedFallback,
        fallbackReason: result.fallbackReason,
        warnings: result.warnings || [],
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to generate a draft from the current instructions.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    runGeneration(0);
  }

  function handleRegenerate() {
    runGeneration(variant + 1);
  }

  async function handleCopySubject() {
    if (!subject.trim()) return;
    try {
      await navigator.clipboard.writeText(subject);
      setSubjectCopied('Subject copied.');
    } catch {
      setSubjectCopied('Select subject and press Ctrl+C.');
    }
  }

  const combinedDraft = subject.trim() ? `Subject: ${subject.trim()}\n\n${draftBody}` : draftBody;

  const sourceBadgeLabel = statusMeta
    ? statusMeta.source === DRAFT_SOURCES.AI_PROVIDER
      ? `AI Provider (${statusMeta.providerName})`
      : 'Local Template Fallback (No API Key)'
    : 'Local Template Ready (No API Key)';

  return (
    <div className="stack">
      <StatusBanner
        tone={statusMeta?.usedFallback ? 'warning' : 'info'}
        title={
          statusMeta?.usedFallback
            ? 'Fell Back to Local Template Generator'
            : 'Smart Writing Active — Works Offline Without API Keys'
        }
      >
        {statusMeta?.usedFallback
          ? `${statusMeta.fallbackReason} Generated a structured draft locally instead without inventing missing facts.`
          : 'Describe what you want to write in ordinary language. Local templates generate an editable draft without an API key, and never invent missing names or dates.'}
      </StatusBanner>

      <div className="two-col-grid">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-header">
            <h3>1. Describe What You Need</h3>
            <span className="pill pill-blue">{sourceBadgeLabel}</span>
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
              placeholder="Example: Write an email to my professor asking for two extra days to submit my assignment because I was sick."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="smart-mode">Writing Mode</label>
              <select id="smart-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                {SMART_WRITING_MODES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="smart-tone">Tone</label>
              <select id="smart-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                {SMART_WRITING_TONES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="smart-length">Length</label>
              <select id="smart-length" value={length} onChange={(e) => setLength(e.target.value)}>
                {SMART_WRITING_LENGTHS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="smart-recipient">Recipient (optional)</label>
              <input
                id="smart-recipient"
                type="text"
                placeholder="e.g., Professor, Manager, Riya"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="smart-purpose">Subject Hint / Purpose (optional)</label>
            <input
              id="smart-purpose"
              type="text"
              placeholder="e.g., Assignment Submission Extension, Leave Request"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="panel-actions">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <SparklesIcon />
              <span>{isLoading ? 'Generating Draft...' : 'Generate Draft'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRegenerate}
              disabled={isLoading || !hasGenerated || !prompt.trim()}
            >
              Regenerate Draft
            </button>
          </div>

          {errorMessage ? (
            <p className="error-line" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <section className="panel" aria-label="Editable draft preview">
          <div className="panel-header">
            <h3>2. Editable Draft Preview</h3>
            <span className="pill pill-neutral">User Controlled • Never Auto-Sent</span>
          </div>

          <div className="form-field">
            <div className="label-row">
              <label htmlFor="draft-subject">Subject (for emails & formal notes)</label>
              <button
                type="button"
                className="btn btn-ghost btn-compact"
                onClick={handleCopySubject}
                disabled={!subject.trim()}
              >
                <CopyIcon />
                <span>Copy Subject</span>
              </button>
            </div>
            <input
              id="draft-subject"
              type="text"
              placeholder="Generated or custom subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            {subjectCopied ? (
              <span className="helper-text" role="status" aria-live="polite">
                {subjectCopied}
              </span>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="draft-body">Message / Email Body</label>
            <textarea
              id="draft-body"
              className="text-area"
              rows={9}
              placeholder="Your generated draft appears here so you can review and edit every word before copying or inserting."
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
            />
          </div>

          {statusMeta?.warnings?.length ? (
            <div className="info-box" role="status" aria-live="polite">
              <strong>Review Placeholders Before Sending</strong>
              <ul className="check-list">
                {statusMeta.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <ActionBar
            text={combinedDraft}
            copyLabel="Copy Full Draft"
            secondaryText={draftBody}
            secondaryLabel="Copy Body"
          />
        </section>
      </div>
    </div>
  );
}
