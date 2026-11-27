/**
 * Shared metadata, constants, and core writing utilities for EzWrite.
 * Kept independent of React and Chrome extension APIs so it can be reused
 * across the dashboard, extension, and future desktop app.
 */

export { cleanText, cleanTextWithMeta } from './cleanup/index.js';
export {
  classifySmartWritingIntent,
  createOpenAiCompatibleProvider,
  DRAFT_SOURCES,
  generateLocalDraft,
  generateSmartDraft,
  normalizeSmartWritingRequest,
  SMART_WRITING_LENGTHS,
  SMART_WRITING_MODES,
  SMART_WRITING_TONES,
} from './smart-writing/index.js';

export const APP_INFO = Object.freeze({
  name: 'EzWrite',
  tagline: 'Speak Naturally. Type Instantly.',
  prototypeStage: 'Step 4 — Smart Writing Engine',
  scopeLabel: 'Round 2 Browser Prototype (Chrome + Companion Dashboard)',
});

export const NAV_ITEMS = Object.freeze([
  { id: 'dashboard', label: 'Dashboard', description: 'Overview & prototype status' },
  { id: 'voice-typing', label: 'Voice Typing', description: 'Text cleanup & voice UI' },
  { id: 'smart-writing', label: 'Smart Writing', description: 'Instruction-to-draft engine' },
  { id: 'settings', label: 'Settings', description: 'Preferences, privacy & limits' },
]);

export const WRITING_MODES = Object.freeze([
  {
    id: 'voice-typing',
    title: 'Voice Typing',
    status: 'Cleanup Ready • Speech Pending',
    summary:
      'Type or paste text today (voice input coming in Step 7) to apply conservative capitalization and punctuation cleanup, edit, and copy.',
  },
  {
    id: 'smart-writing',
    title: 'Smart Writing',
    status: 'Local Engine Active',
    summary:
      'Describe what you want to write in plain words and generate an editable email or message draft locally without requiring an API key.',
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
