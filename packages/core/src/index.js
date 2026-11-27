/**
 * Shared metadata and constants for EzWrite.
 * Kept independent of React and Chrome extension APIs so it can be reused
 * across the dashboard, extension, and future desktop app.
 */

export const APP_INFO = Object.freeze({
  name: 'EzWrite',
  tagline: 'Speak Naturally. Type Instantly.',
  prototypeStage: 'Step 2 — Dashboard UI & Navigation',
  scopeLabel: 'Round 2 Browser Prototype (Chrome + Companion Dashboard)',
});

export const NAV_ITEMS = Object.freeze([
  { id: 'dashboard', label: 'Dashboard', description: 'Overview & prototype status' },
  { id: 'voice-typing', label: 'Voice Typing', description: 'Speech-to-text & cleanup UI' },
  { id: 'smart-writing', label: 'Smart Writing', description: 'Instruction-to-draft UI' },
  { id: 'settings', label: 'Settings', description: 'Preferences, privacy & limits' },
]);

export const WRITING_MODES = Object.freeze([
  {
    id: 'voice-typing',
    title: 'Voice Typing',
    status: 'UI Ready • Speech Pending',
    summary:
      'Speak naturally or paste text, apply conservative capitalization and punctuation cleanup, edit the result, and insert or copy it.',
  },
  {
    id: 'smart-writing',
    title: 'Smart Writing',
    status: 'UI Ready • Templates Pending',
    summary:
      'Describe what you want to write in plain words and generate an editable message or email draft without requiring an API key.',
  },
]);

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'en-IN', label: 'English (India) — en-IN' },
  { code: 'en-US', label: 'English (US) — en-US' },
  { code: 'hi-IN', label: 'Hindi / Hinglish — hi-IN (Experimental)' },
]);

export const DEFAULT_SETTINGS = Object.freeze({
  language: 'en-IN',
  autoCapitalize: true,
  conservativePunctuation: true,
  aiProvider: 'local-fallback',
});
