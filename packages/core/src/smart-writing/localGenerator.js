import { cleanText } from '../cleanup/cleanText.js';
import {
  DRAFT_SOURCES,
  SMART_WRITING_LENGTHS,
  SMART_WRITING_MODES,
  SMART_WRITING_TONES,
  TONE_PROFILES,
} from './constants.js';
import { analyzeSmartWritingInput } from './inputAnalyzer.js';

const VALID_MODES = new Set(SMART_WRITING_MODES.map((m) => m.id));
const VALID_TONES = new Set(SMART_WRITING_TONES.map((t) => t.id));
const VALID_LENGTHS = new Set(SMART_WRITING_LENGTHS.map((l) => l.id));

const MODE_SUBJECT_MAP = {
  'professional-email': 'Regarding Your Request',
  'casual-message': '',
  'formal-message': 'Formal Communication',
  request: 'Request for Consideration',
  apology: 'Sincere Apology',
  'follow-up': 'Following Up',
  'general-writing': 'Draft Note',
};

const INSTRUCTION_NOISE_WORDS = new Set([
  'email',
  'mail',
  'message',
  'msg',
  'write',
  'draft',
  'ask',
  'tell',
  'inform',
  'send',
  'please',
  'hey',
  'hi',
  'sir',
  'madam',
  'bro',
  'him',
  'her',
  'them',
  'professor',
  'manager',
]);

/**
 * Validates and normalizes Smart Writing request parameters.
 */
export function normalizeSmartWritingRequest(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error('Smart Writing input must be an object.');
  }

  const instructions = typeof input.instructions === 'string' ? input.instructions.trim() : '';
  if (!instructions) {
    throw new Error('Please describe what you want to write before generating a draft.');
  }

  const mode = VALID_MODES.has(input.mode) ? input.mode : 'professional-email';
  const tone = VALID_TONES.has(input.tone) ? input.tone : 'polite';
  const length = VALID_LENGTHS.has(input.length) ? input.length : 'medium';
  const recipient = typeof input.recipient === 'string' ? input.recipient.trim() : '';
  const purpose = typeof input.purpose === 'string' ? input.purpose.trim() : '';
  const variant = Number.isInteger(input.variant) && input.variant >= 0 ? input.variant : 0;

  return { instructions, mode, tone, length, recipient, purpose, variant };
}

function toTitleCasePhrase(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function buildSubject(request, analysis) {
  const modeMeta = SMART_WRITING_MODES.find((m) => m.id === request.mode);
  if (!modeMeta?.hasSubject) return '';

  if (analysis.subjectTopic) {
    return analysis.subjectTopic;
  }

  // Fallback subject: filter out instruction verbs/noise so subjects reflect the topic.
  const filteredWords = analysis.rawCore
    .replace(/[.!?]+$/, '')
    .split(/\s+/)
    .filter((w) => !INSTRUCTION_NOISE_WORDS.has(w.toLowerCase()))
    .slice(0, 7);

  if (filteredWords.length >= 2) {
    return toTitleCasePhrase(filteredWords.join(' '));
  }
  return MODE_SUBJECT_MAP[request.mode] || 'Draft Message';
}

function buildGreeting(recipientInfo, mode, tone) {
  if (mode === 'casual-message') {
    return recipientInfo.isPlaceholder ? '' : `Hi ${recipientInfo.label},`;
  }
  if (mode === 'general-writing' && recipientInfo.isPlaceholder) {
    return '';
  }

  const recipientLabel = recipientInfo.label;
  if (tone === 'friendly') {
    return `Hi ${recipientLabel},`;
  }
  if (mode === 'formal-message' || mode === 'professional-email' || tone === 'formal' || tone === 'polite') {
    return `Dear ${recipientLabel},`;
  }
  if (tone === 'simple') {
    return `Hello ${recipientLabel},`;
  }
  return `Dear ${recipientLabel},`;
}

function buildClosing(mode, tone, variant, hasGreeting, rawInstructions) {
  if (mode === 'casual-message') {
    // Only keep a casual "Thanks!" if user asked for something or explicitly thanked.
    if (/\b(thanks|thank you|thx)\b/i.test(rawInstructions) && !/\bstart without me\b/i.test(rawInstructions)) {
      return 'Thanks!';
    }
    return '';
  }
  if (mode === 'general-writing' && !hasGreeting) {
    return '';
  }

  const profile = TONE_PROFILES[tone] || TONE_PROFILES.professional;
  const signOff = profile.signOffs[variant % profile.signOffs.length];
  return `${signOff}\n[Your Name]`;
}

function buildOpener(mode, tone, variant) {
  if (mode === 'casual-message') return '';
  const profile = TONE_PROFILES[tone] || TONE_PROFILES.professional;
  return profile.openers[variant % profile.openers.length];
}

function buildClosingNote(mode, tone, analysis, hasCommitments) {
  if (mode === 'casual-message') {
    return '';
  }
  if (analysis.communicationType === 'meeting-feedback') {
    if (tone === 'formal') return 'I would be grateful if you could let me know your availability.';
    if (tone === 'friendly') return 'Thanks so much in advance!';
    return 'Thank you for your time.';
  }
  if (mode === 'apology') {
    return tone === 'simple'
      ? 'I am sorry for any inconvenience caused.'
      : 'I sincerely apologize for any inconvenience this may have caused and appreciate your patience.';
  }
  if (mode === 'follow-up') {
    return 'Please let me know if there is any update whenever you have a moment.';
  }
  if (mode === 'request' || mode === 'professional-email' || mode === 'formal-message') {
    if (tone === 'formal') {
      return 'I would be grateful if you could kindly review this request and let me know your decision.';
    }
    if (tone === 'polite') {
      return 'Thank you for your time and understanding.';
    }
    if (tone === 'friendly') {
      return 'Thanks for understanding!';
    }
    if (tone === 'simple') {
      return 'Thank you for your help.';
    }
    return hasCommitments
      ? 'Please let me know if this works for you or if you need any further details.'
      : 'Please let me know if you need any additional information.';
  }
  return 'Please let me know if you have any questions.';
}

function joinSentences(sentences) {
  return sentences
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
}

function collectPlaceholderHints(subject, body, recipientInfo, request) {
  const { instructions, mode } = request;
  const combined = `${subject}\n${body}`;
  const hints = [];

  if (
    mode !== 'general-writing' &&
    mode !== 'casual-message' &&
    (recipientInfo.isPlaceholder || combined.includes('[Recipient Name]'))
  ) {
    hints.push('Replace [Recipient Name] with the recipient’s actual name.');
  }
  if (combined.includes('[Your Name]')) {
    hints.push('Replace [Your Name] before sending.');
  }
  if (
    /\b(leave|meeting|call|extension|deadline|submit)\b/i.test(instructions) &&
    !/\b(\d+|one|two|three|four|five|six|seven|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|days?|asap|as soon as possible|when)\b/i.test(
      instructions
    )
  ) {
    hints.push('No specific date or timeframe was mentioned—add exact dates if needed.');
  }

  return hints;
}

/**
 * Generates a structured, rewritten email or message draft locally without requiring
 * an API key or internet connection, preserving all user facts and intent.
 */
export function generateLocalDraft(input) {
  const request = normalizeSmartWritingRequest(input);
  const analysis = analyzeSmartWritingInput(request);

  const subject = buildSubject(request, analysis);
  const greeting = buildGreeting(analysis.recipientInfo, request.mode, request.tone);
  const opener = buildOpener(request.mode, request.tone, request.variant);
  const closing = buildClosing(
    request.mode,
    request.tone,
    request.variant,
    Boolean(greeting),
    request.instructions
  );

  const primarySentences = [
    ...analysis.situationClauses,
    ...analysis.requestClauses,
    ...analysis.otherClauses,
  ];
  const commitmentSentences = [...analysis.commitmentClauses];
  const closingNote = buildClosingNote(
    request.mode,
    request.tone,
    analysis,
    commitmentSentences.length > 0
  );

  if (primarySentences.length === 0 && commitmentSentences.length === 0) {
    primarySentences.push(analysis.rawCore);
  }

  const paragraphs = [];
  if (greeting) paragraphs.push(greeting);

  if (request.mode === 'casual-message') {
    const combinedCasual = joinSentences([...primarySentences, ...commitmentSentences]);
    const finalCasual =
      !greeting && analysis.hadCasualVocative && !/^(?:hey|hi)\b/i.test(combinedCasual)
        ? `Hey, ${combinedCasual}`
        : combinedCasual;
    paragraphs.push(finalCasual);
  } else if (request.length === 'short') {
    const bodySentences = [...primarySentences, ...commitmentSentences];
    const hasNonLatinScript = /[^\u0000-\u024F]/.test(analysis.rawCore);
    if (!hasNonLatinScript && bodySentences.length <= 1 && closingNote) {
      bodySentences.push(closingNote);
    }
    paragraphs.push(joinSentences(bodySentences));
  } else if (request.length === 'medium') {
    if (analysis.communicationType === 'meeting-feedback' && analysis.situationClauses.length && analysis.requestClauses.length) {
      if (request.tone === 'friendly' || request.tone === 'formal') {
        if (opener) paragraphs.push(opener);
      }
      paragraphs.push(joinSentences(analysis.situationClauses));
      paragraphs.push(joinSentences(analysis.requestClauses));
      if (closingNote) paragraphs.push(closingNote);
    } else {
      const firstParagraph = [];
      if (request.tone === 'friendly' || request.tone === 'formal') {
        if (opener) firstParagraph.push(opener);
      }
      firstParagraph.push(...primarySentences);
      if (firstParagraph.length > 0) {
        paragraphs.push(joinSentences(firstParagraph));
      }

      const secondParagraph = [...commitmentSentences];
      if (closingNote) {
        secondParagraph.push(closingNote);
      }
      if (secondParagraph.length > 0) {
        paragraphs.push(joinSentences(secondParagraph));
      }
    }
  } else {
    if (opener) paragraphs.push(opener);

    const contextParagraph = joinSentences([
      ...analysis.situationClauses,
      ...analysis.otherClauses,
    ]);
    if (contextParagraph) paragraphs.push(contextParagraph);

    const actionParagraph = joinSentences([
      ...analysis.requestClauses,
      ...commitmentSentences,
    ]);
    if (actionParagraph) paragraphs.push(actionParagraph);

    if (
      request.purpose &&
      !paragraphs.join(' ').toLowerCase().includes(request.purpose.toLowerCase())
    ) {
      paragraphs.push(cleanText(`Subject / Purpose: ${request.purpose}`));
    }

    if (closingNote) paragraphs.push(closingNote);
  }

  if (closing) paragraphs.push(closing);

  const body = paragraphs.filter(Boolean).join('\n\n');
  const warnings = collectPlaceholderHints(subject, body, analysis.recipientInfo, request);

  return {
    subject,
    body,
    source: DRAFT_SOURCES.LOCAL_TEMPLATE,
    providerName: 'local-template-fallback',
    usedFallback: false,
    fallbackReason: null,
    warnings,
    mode: request.mode,
    tone: request.tone,
    length: request.length,
  };
}
