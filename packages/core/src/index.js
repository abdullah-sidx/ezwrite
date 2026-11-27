/**
 * Shared metadata and constants for EzWrite.
 * Kept independent of React and Chrome extension APIs so it can be reused
 * across the dashboard, extension, and future desktop app.
 */

export const APP_INFO = Object.freeze({
  name: 'EzWrite',
  tagline: 'Speak Naturally. Type Instantly.',
  prototypeStage: 'Step 1 — Project Skeleton',
  scopeLabel: 'Round 2 Browser Prototype (Chrome + Companion Dashboard)',
});

export const WRITING_MODES = Object.freeze([
  {
    id: 'voice-typing',
    title: 'Voice Typing',
    status: 'Planned (Upcoming Step)',
    summary:
      'Speak naturally, apply conservative capitalization and punctuation cleanup, edit the text, and insert or copy it.',
  },
  {
    id: 'smart-writing',
    title: 'Smart Writing',
    status: 'Planned (Upcoming Step)',
    summary:
      'Describe what you want to write in plain words and generate an editable message or email draft without requiring an API key.',
  },
]);
