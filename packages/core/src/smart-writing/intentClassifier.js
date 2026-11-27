/**
 * Intent classification and telegraphic instruction parsing for EzWrite Smart Writing.
 * Distinguishes between writing instructions ("email professor ...") and direct messages
 * ("hey sir i need 2 more days..."), and identifies communication type, recipient, and purpose.
 */

const ROLE_NOUNS = [
  'hr team',
  'professor',
  'manager',
  'teacher',
  'instructor',
  'supervisor',
  'mentor',
  'client',
  'customer',
  'team',
  'hr',
  'colleague',
  'doctor',
];

const ROLE_PATTERN = ROLE_NOUNS.map((r) => r.replace(/\s+/g, '\\s+')).join('|');

const VERBOSE_META_PREFIX_RE =
  /^(?:please\s+)?(?:can you\s+|could you\s+)?(?:write|draft|compose|create|prepare|make)\s+(?:me\s+)?(?:a|an)?\s*(?:short|brief|quick|medium|detailed|polite|formal|friendly|casual|professional|simple)?\s*(?:email|message|note|letter|reply|response|apology|follow[- ]?up|request|draft)\s*/i;

const TELEGRAPHIC_META_PREFIX_RE = new RegExp(
  `^(?:please\\s+)?(?:send\\s+(?:an?\\s+)?(?:email|message|note|update|reply|reminder)\\s+(?:to\\s+)?|(?:email|mail|msg|message|text|reply\\s+to|respond\\s+to|apologize\\s+to|follow\\s*up\\s+with|ask|tell|inform|remind|thank)\\s+(?:my\\s+|the\\s+|to\\s+)?)(?:(${ROLE_PATTERN})\\b|([A-Z][a-z]{1,25})\\b)?[,:\\s]*`,
  'i'
);

const RECIPIENT_CLAUSE_RE =
  /^(?:to|addressed\s+to|with)\s+(?:my\s+|the\s+)?([A-Za-z][A-Za-z0-9 '&.-]{1,40}?)(?=\s+(?:asking|requesting|saying|telling|informing|letting|apologizing|following|about|regarding|for|that|to)\b|[,.]|$)/i;

const INLINE_ROLE_RE = new RegExp(`\\b(${ROLE_PATTERN})\\b`, 'i');

const GENDERED_OR_CASUAL_VOCATIVES = new Set([
  'sir',
  'madam',
  "ma'am",
  'maam',
  'bro',
  'dude',
  'man',
  'guys',
  'buddy',
  'friend',
  'boss',
  'there',
  'all',
  'everyone',
]);

const NON_NAME_WORDS = new Set([
  'i',
  'my',
  'we',
  'our',
  'the',
  'a',
  'an',
  'this',
  'that',
  'it',
  'assignment',
  'project',
  'leave',
  'meeting',
  'feedback',
  'today',
  'tomorrow',
  'about',
  'for',
  'to',
  'him',
  'her',
  'them',
]);

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

function classifyCommunicationType(text, mode) {
  const lower = text.toLowerCase();

  if (
    lower.includes('assignment') &&
    (lower.includes('feedback') ||
      (lower.includes('meet') && lower.includes('discuss')) ||
      lower.includes('completed'))
  ) {
    return 'meeting-feedback';
  }
  if (
    lower.includes('assignment') &&
    (lower.includes('extra') ||
      lower.includes('extension') ||
      lower.includes('more day') ||
      lower.includes('on time') ||
      lower.includes('unable') ||
      lower.includes('cant submit'))
  ) {
    return 'assignment-extension';
  }
  if (/\bleave\b/.test(lower)) {
    return 'leave-request';
  }
  if (/\b(?:late|running behind|traffic|stuck)\b/.test(lower) && /\b(?:today|now|minute|hour|late)\b/.test(lower)) {
    return 'late-notice';
  }
  if (/\b(?:project\s+(?:progress\s+)?update|progress\s+update|status\s+update)\b/.test(lower)) {
    return 'project-update';
  }
  if (mode === 'apology' || /\b(?:sorry|apologize|apology|missed)\b/.test(lower)) {
    return 'apology';
  }
  if (mode === 'follow-up' || /\bfollow\s*up\b/.test(lower)) {
    return 'follow-up';
  }
  if (/\b(?:meet|meeting|schedule\s+a\s+call|call)\b/.test(lower)) {
    return 'meeting-request';
  }
  if (/\bremind(?:er|ing)?\b/.test(lower)) {
    return 'reminder';
  }
  return 'general';
}

export function buildPurposeSubject(communicationType, rawInstructions, explicitPurpose, mode) {
  if (mode === 'casual-message') return '';
  if (explicitPurpose) return toTitleCasePhrase(explicitPurpose);

  const lower = rawInstructions.toLowerCase();
  switch (communicationType) {
    case 'assignment-extension':
      return 'Request for Assignment Extension';
    case 'meeting-feedback':
      return lower.includes('assignment')
        ? 'Request for a Meeting to Discuss Assignment Feedback'
        : 'Request for a Meeting to Discuss Feedback';
    case 'leave-request':
      return 'Leave Request';
    case 'project-update':
      return 'Project Progress Update';
    case 'meeting-request':
      return 'Meeting Request';
    case 'apology':
      return /\b(?:call|meeting)\b/.test(lower)
        ? 'Apology Regarding Our Call / Meeting'
        : 'Sincere Apology';
    case 'follow-up':
      return lower.includes('interview') ? 'Interview Status Follow-Up' : 'Follow-Up';
    case 'late-notice':
      return 'Running Late Today';
    case 'reminder':
      return 'Reminder';
    default:
      return '';
  }
}

/**
 * Classifies whether input is a writing instruction or direct message, strips instruction
 * framing cleanly, and extracts neutral recipient info and communication purpose.
 */
export function classifySmartWritingIntent(instructions, { mode, recipient: explicitRecipient, purpose }) {
  const trimmed = instructions.trim();
  const startsDirect = /^(?:hey|hi|hello|dear|bro|dude|i\b|i'm\b|im\b|my\b|we\b|sorry\b)/i.test(trimmed);

  let isInstruction = false;
  let core = trimmed;
  let instructionRecipient = '';

  if (VERBOSE_META_PREFIX_RE.test(trimmed)) {
    isInstruction = true;
    core = trimmed.replace(VERBOSE_META_PREFIX_RE, '').trim();
    const recMatch = core.match(RECIPIENT_CLAUSE_RE);
    if (recMatch?.[1]) {
      const candidate = recMatch[1].trim();
      if (!GENDERED_OR_CASUAL_VOCATIVES.has(candidate.toLowerCase())) {
        instructionRecipient = toTitleCasePhrase(candidate);
      }
      core = core.replace(RECIPIENT_CLAUSE_RE, '').trim();
    }
    core = core.replace(/^(?:and|about)\s+/i, '').trim();
  } else if (!startsDirect && TELEGRAPHIC_META_PREFIX_RE.test(trimmed)) {
    const match = trimmed.match(TELEGRAPHIC_META_PREFIX_RE);
    if (match) {
      isInstruction = true;
      const roleCandidate = (match[1] || '').trim();
      const nameCandidate = (match[2] || '').trim();

      if (roleCandidate) {
        instructionRecipient = toTitleCasePhrase(roleCandidate);
      } else if (
        nameCandidate &&
        /^[A-Z]/.test(nameCandidate) &&
        !NON_NAME_WORDS.has(nameCandidate.toLowerCase()) &&
        !GENDERED_OR_CASUAL_VOCATIVES.has(nameCandidate.toLowerCase())
      ) {
        instructionRecipient = nameCandidate;
      }

      core = trimmed.slice(match[0].length).trim();
    }
  }

  // Fallback role lookup inside instructions (never infer from gendered terms like "sir" or "him").
  if (!instructionRecipient && isInstruction) {
    const roleMatch = trimmed.match(INLINE_ROLE_RE);
    if (roleMatch?.[1]) {
      instructionRecipient = toTitleCasePhrase(roleMatch[1]);
    }
  }

  const communicationType = classifyCommunicationType(trimmed, mode);
  const subject = buildPurposeSubject(communicationType, trimmed, purpose, mode);

  return {
    inputType: isInstruction ? 'instruction' : 'direct-message',
    communicationType,
    core: core || trimmed,
    instructionRecipient,
    explicitRecipient: explicitRecipient ? explicitRecipient.trim() : '',
    subject,
  };
}
