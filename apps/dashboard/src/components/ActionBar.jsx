import { useState } from 'react';
import { CopyIcon } from './Icons.jsx';

export default function ActionBar({ text, copyLabel = 'Copy Text' }) {
  const [feedback, setFeedback] = useState('');
  const hasText = text.trim().length > 0;

  async function handleCopy() {
    if (!hasText) return;
    try {
      if (!navigator.clipboard?.writeText) {
        setFeedback('Clipboard API unavailable here. Select the text above and press Ctrl+C.');
        return;
      }
      await navigator.clipboard.writeText(text);
      setFeedback('Copied to clipboard. Nothing was sent automatically.');
    } catch {
      setFeedback('Could not access clipboard. Select the text above and press Ctrl+C.');
    }
  }

  return (
    <div className="action-bar">
      <div className="action-buttons">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCopy}
          disabled={!hasText}
        >
          <CopyIcon />
          <span>{copyLabel}</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          disabled
          title="Chrome extension webpage insertion will be connected in Steps 5–6"
        >
          Insert into Active Field (Pending Extension)
        </button>
      </div>

      <p className="action-hint" role="status" aria-live="polite">
        {feedback ||
          'Direct webpage insertion connects in Steps 5–6. Copy works now whenever text is present.'}
      </p>
    </div>
  );
}
