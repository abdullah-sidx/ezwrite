/**
 * Constants, option definitions, and tone profiles for EzWrite Smart Writing.
 * Kept pure JS so both browser and future desktop apps can share them.
 */

export const SMART_WRITING_MODES = Object.freeze([
  { id: 'professional-email', label: 'Professional Email', hasSubject: true },
  { id: 'casual-message', label: 'Casual Message', hasSubject: false },
  { id: 'formal-message', label: 'Formal Message', hasSubject: true },
  { id: 'request', label: 'Request', hasSubject: true },
  { id: 'apology', label: 'Apology', hasSubject: true },
  { id: 'follow-up', label: 'Follow-up', hasSubject: true },
  { id: 'general-writing', label: 'General Writing', hasSubject: true },
]);

export const SMART_WRITING_TONES = Object.freeze([
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'simple', label: 'Simple' },
  { id: 'polite', label: 'Polite' },
]);

export const SMART_WRITING_LENGTHS = Object.freeze([
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'detailed', label: 'Detailed' },
]);

export const DRAFT_SOURCES = Object.freeze({
  LOCAL_TEMPLATE: 'local-template',
  AI_PROVIDER: 'ai-provider',
});

export const TONE_PROFILES = Object.freeze({
  formal: {
    register: 'formal',
    greetingPrefix: 'Dear',
    openers: [
      'I hope this message finds you well.',
      'I am writing to formally bring the following matter to your attention.',
    ],
    signOffs: ['Sincerely,', 'Respectfully,'],
  },
  professional: {
    register: 'professional',
    greetingPrefix: 'Dear',
    openers: [
      'I hope you are doing well.',
      'I hope your week is going smoothly.',
    ],
    signOffs: ['Best regards,', 'Kind regards,'],
  },
  polite: {
    register: 'polite',
    greetingPrefix: 'Dear',
    openers: [
      'I hope you are doing well.',
      'I hope everything is going well with you.',
    ],
    signOffs: ['Warm regards,', 'Kind regards,'],
  },
  friendly: {
    register: 'friendly',
    greetingPrefix: 'Hi',
    openers: [
      'Hope you are having a good day!',
      'Hope everything is going well!',
    ],
    signOffs: ['Thanks so much,', 'Best,'],
  },
  simple: {
    register: 'simple',
    greetingPrefix: 'Hello',
    openers: [
      'I hope you are doing well.',
      'Hope you are well.',
    ],
    signOffs: ['Thank you,', 'Regards,'],
  },
});
