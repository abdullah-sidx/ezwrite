import { cleanText } from '../cleanup/cleanText.js';
import { maskProtectedTokens, restoreProtectedTokens } from '../cleanup/tokens.js';

const SMALL_NUMBER_WORDS = {
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
};

const HINGLISH_HINT_RE =
  /\b(hai|hain|hoon|hu|kal|aaj|parso|baje|chahiye|karna|karni|karne|bhej|dena|bhai|yaar|kaam|kripya|dhanyawad|nahi|nhi|mera|meri|mujhe|aap|hum)\b/i;

const LEADING_GREETING_RE =
  /^(?:(?:hey|hi|hello|dear|respeted|respected)\s+(?:there\s+)?(?:(sir|madam|ma'am|maam|professor|prof\.?|manager|teacher|team|everyone|all|guys|bro|dude|man|buddy|friend|boss|doctor|dr\.?)\b|([A-Z][a-z]{1,25})\b)?|(sir|madam|ma'am|maam|professor|bro|dude)\b)(?:[,!:\s]+|$)/i;

const TRAILING_SIGNOFF_RE =
  /(?:[,.\s]+|^)(?:thanks(?:\s+(?:a\s+lot|in\s+advance))?|thank\s+you(?:\s+(?:so\s+much|in\s+advance))?|thx|ty|pls|plz|regards|sorry)[!.\s]*$/i;

const ENGLISH_WILL_VERBS =
  'be|do|submit|send|share|complete|finish|join|call|attend|update|check|try|fix|deliver|reply|revert|email|message|reach|come|let|make|get|give|have|take|pay|start|work';

const ILL_CONTRACTION_RE = new RegExp(`\\bill\\s+(?=(?:${ENGLISH_WILL_VERBS})\\b)`, 'gi');

const NON_NAME_LEAD_WORDS = new Set([
  'i',
  'my',
  'we',
  'our',
  'the',
  'this',
  'that',
  'there',
  'please',
  'sorry',
  'thanks',
  'need',
  'just',
  'actually',
  'today',
  'tomorrow',
  'yesterday',
  'unable',
  'cannot',
  'cant',
  'exams',
  'might',
]);

const GENDERED_VOCATIVES = new Set(['sir', 'madam', "ma'am", 'maam']);
const CASUAL_VOCATIVES = new Set(['bro', 'dude', 'man', 'guys', 'buddy', 'friend', 'there', 'all', 'everyone']);

function isFormalRegister(register) {
  return register === 'formal' || register === 'professional' || register === 'polite';
}

function numberToReadableCount(token, register) {
  if (!isFormalRegister(register)) return token;
  return SMALL_NUMBER_WORDS[token] || token;
}

/**
 * Strips leading greetings and vocatives cleanly.
 * Extracts neutral roles/names when present, and never infers gender from "sir"/"madam".
 */
export function stripLeadingGreetings(text) {
  let working = text.trim();
  let detectedRecipient = '';
  let hadCasualVocative = false;

  for (let i = 0; i < 3; i += 1) {
    const match = working.match(LEADING_GREETING_RE);
    if (!match) break;

    const roleToken = (match[1] || match[3] || '').trim().replace(/\.$/, '');
    const nameToken = (match[2] || '').trim();
    const candidate = roleToken || nameToken;

    if (
      nameToken &&
      (!/^[A-Z]/.test(nameToken) || NON_NAME_LEAD_WORDS.has(nameToken.toLowerCase()))
    ) {
      const greetingOnlyMatch = working.match(/^(?:hey|hi|hello|dear)\b[,!:\s]*/i);
      if (!greetingOnlyMatch) break;
      working = working.slice(greetingOnlyMatch[0].length).trim();
      continue;
    }

    const lowerCandidate = candidate.toLowerCase();
    if (CASUAL_VOCATIVES.has(lowerCandidate)) {
      hadCasualVocative = true;
    } else if (candidate && !GENDERED_VOCATIVES.has(lowerCandidate)) {
      if (!detectedRecipient) {
        detectedRecipient = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }

    working = working.slice(match[0].length).trim();
  }

  return { text: working, detectedRecipient, hadCasualVocative };
}

/**
 * Strips trailing chat sign-offs ("thanks", "thx", "pls") so the composer can add an
 * appropriate closing without duplication.
 */
export function stripTrailingSignOffs(text) {
  let working = text.trim();
  for (let i = 0; i < 2; i += 1) {
    const updated = working.replace(TRAILING_SIGNOFF_RE, '').trim();
    if (updated === working) break;
    working = updated;
  }
  return working;
}

/**
 * Detects whether a clause likely contains Hinglish / regional code-mixed wording
 * so English-only rewrites stay conservative on non-English phrases.
 */
export function isCodeMixedText(text) {
  return /[^\u0000-\u024F\s.,!?'"():;/@#&+-]/.test(text) || HINGLISH_HINT_RE.test(text);
}

/**
 * Applies context-aware grammar, contraction, and phrase upgrades according to target register.
 * Protects URLs, emails, decimals, and clock times before applying transformations.
 */
export function upgradeInformalPhrasing(clause, register = 'professional') {
  if (!clause || typeof clause !== 'string') return '';

  const { maskedText, tokens } = maskProtectedTokens(clause.trim());
  let text = maskedText;

  if (isCodeMixedText(text)) {
    const restored = restoreProtectedTokens(text, tokens);
    return cleanText(restored);
  }

  const formal = isFormalRegister(register);
  const casual = register === 'casual';

  // 1. Context-aware contraction & typo repairs (avoid touching "i was ill" or "user id").
  text = text.replace(ILL_CONTRACTION_RE, casual ? "I'll " : 'I will ');
  text = text
    .replace(/\b(?:i\s+am|im|i'm)\s+(?:unable\s+to|not\s+able\s+to|cant|can't)\b/gi, () =>
      casual ? "I can't" : formal ? 'I am unable to' : 'I cannot'
    )
    .replace(/\bi\s+(?:cant|can't|cannot)\b/gi, () =>
      casual ? "I can't" : formal ? 'I am unable to' : 'I cannot'
    )
    .replace(/(^|[.!?]\s+|,\s+)(?:cant|can't)\s+([a-z]+)/gi, (_, lead, verb) =>
      `${lead}${casual ? "I can't" : formal ? 'I am unable to' : 'I cannot'} ${verb}`
    )
    .replace(/\b(cant)\b/gi, () => (casual ? "can't" : 'cannot'))
    .replace(/\b(wont)\b/gi, () => (casual ? "won't" : 'will not'))
    .replace(/\b(dont)\b/gi, () => (casual ? "don't" : 'do not'))
    .replace(/\b(didnt)\b/gi, () => (casual ? "didn't" : 'did not'))
    .replace(/\b(isnt)\b/gi, () => (casual ? "isn't" : 'is not'))
    .replace(/\b(arent)\b/gi, () => (casual ? "aren't" : 'are not'))
    .replace(/\b(im)\b/gi, () => (casual ? "I'm" : 'I am'))
    .replace(/\b(ive)\b/gi, () => (casual ? "I've" : 'I have'))
    .replace(/\b(id)\s+(?=(?:like|love|appreciate|prefer|need|rather|be)\b)/gi, () =>
      casual ? "I'd " : 'I would '
    );

  // Expand contractions in formal/professional/polite/simple registers.
  if (!casual && register !== 'friendly') {
    text = text
      .replace(/\bI'll\b/gi, 'I will')
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\bI've\b/gi, 'I have')
      .replace(/\bI'd\b/gi, 'I would')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bdidn't\b/gi, 'did not');
  }

  // 2. Chat shorthand expansion.
  text = text
    .replace(/\basap\b/gi, 'as soon as possible')
    .replace(/\b(?:pls|plz)\b/gi, 'please')
    .replace(/\bu\b/gi, 'you')
    .replace(/\bur\b/gi, 'your')
    .replace(/\b(?:bcoz|coz|cz)\b/gi, 'because')
    .replace(/\babt\b/gi, 'about')
    .replace(/\btmrw\b/gi, 'tomorrow')
    .replace(/\bmsg\b/gi, 'message')
    .replace(/\binfo\b/gi, 'information');

  // 3. Context-aware phrase upgrades (preserving user counts, nouns, and dates).
  text = text
    .replace(/\bsubmit\s+(assignment|project|report|work|task|homework|form)\b/gi, 'submit my $1')
    .replace(/\bexams?\s+(?:are|is)\s+going\s+on\b/gi, (m) => {
      if (casual) return m.toLowerCase();
      return register === 'simple'
        ? 'I have exams right now'
        : 'my exams are currently ongoing';
    })
    .replace(/\b(?:having\s+)?(?:too\s+much|lots\s+of|a\s+lot\s+of|heavy)\s+pressure\b/gi, () => {
      if (casual) return 'things are quite busy';
      if (register === 'simple') return 'a heavy workload';
      return 'I am managing a heavy workload';
    })
    // Casual / natural traffic & lateness phrasing
    .replace(/\bmight\s+be\s+late\b/gi, (m) =>
      casual || register === 'friendly' ? 'might be a little late' : m.toLowerCase()
    )
    .replace(/\btraffic\s+(?:is|was)\s+(?:crazy|insane|mad|super\s+bad|terrible)\b/gi, (m) =>
      m.toLowerCase().includes('was') ? 'traffic was really heavy' : 'traffic is really heavy'
    )
    .replace(/\b(late(?:\s+today)?)\s+(traffic\s+(?:is|was)\s+really\s+heavy)/gi, '$1 because $2')
    .replace(
      /\b(do\s+not|don't)\s+wait\s+for\s+me\s+(start\s+without\s+me)\b/gi,
      (_, neg, startClause) => `${neg} wait for me; go ahead and ${startClause.toLowerCase()}`
    )
    // Telegraphic status phrases (allow optional trailing punctuation)
    .replace(
      /^(assignment|project|work|report|task)\s+(completed|finished|done)[.!?]*$/i,
      (_, item) => `I have completed my ${item.toLowerCase()}`
    )
    .replace(
      /^(?:i\s+)?(?:just\s+)?need\s+(\d+|one|two|three|four|five|six|seven|a\s+few|some)\s+(?:more|extra|additional)\s+(days?|hours?|weeks?)\b/i,
      (_, count, unit) => {
        const readable = numberToReadableCount(count.toLowerCase(), register);
        if (casual) return `Could I get ${count} more ${unit}`;
        if (register === 'friendly') return `Could I please have ${count} more ${unit}`;
        if (register === 'simple') return `Please give me ${readable} more ${unit}`;
        return `I would like to request an additional ${readable} ${unit}`;
      }
    )
    .replace(
      /\b(?:i\s+)?need\s+(\d+|one|two|three|four|five|six|seven)\s+(?:more|extra|additional)\s+(days?|hours?|weeks?)\b/gi,
      (_, count, unit) => {
        const readable = numberToReadableCount(count.toLowerCase(), register);
        if (casual) return `need ${count} more ${unit}`;
        if (register === 'simple') return `need ${readable} more ${unit}`;
        return `would like to request an additional ${readable} ${unit}`;
      }
    )
    .replace(/\bfinish\s+it\s+properly\b/gi, () =>
      formal ? 'complete it properly' : 'finish it properly'
    )
    .replace(/\bfinish\s+(?:the\s+)?(assignment|work|project|task|report)\s+properly\b/gi, (_, noun) =>
      formal ? `complete my ${noun} properly` : `finish the ${noun} properly`
    )
    .replace(/^(?:please\s+)?give\s+me\s+(?:some\s+)?(?:more\s+)?time$/i, () =>
      casual
        ? 'Please give me a little more time'
        : 'I kindly request some additional time'
    );

  text = text.replace(/\s{2,}/g, ' ').trim();

  const restored = restoreProtectedTokens(text, tokens);
  return cleanText(restored);
}
