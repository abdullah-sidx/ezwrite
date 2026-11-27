import { maskProtectedTokens, restoreProtectedTokens } from './tokens.js';

const SENTENCE_END_CHARS_RE = /[.!?।…:;]$/;
const CLOSING_AFTER_END_RE = /[.!?।…]["')\]\u201D\u2019]$/;
const STANDALONE_URL_OR_EMAIL_RE =
  /^(?:https?:\/\/\S+|www\.\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$/i;
const LOWERCASE_BRAND_RE = /^[a-z]+[A-Z]/;
const LOWERCASE_DOTTED_ABBR_RE = /^(?:e\.g\.|i\.e\.|etc\.|a\.m\.|p\.m\.)$/i;

const GREETING_QUESTION_RE =
  /^(?:(?:hello|hi|hey),?\s+)(?:who|what|when|where|why|how|can|could|would|will|shall|should|do|does|did|is|are|was|were|have|has|had)\b/i;

const QUESTION_AUX_RE =
  /^(?:can|could|would|will|shall|should|do|does|did|is|are|was|were|have|has|had)\s+(?:you|we|they|he|she|it|i|there|this|that)\b/i;

const QUESTION_WH_RE =
  /^(?:who|what|when|where|why|how)\s+(?:is|are|was|were|do|does|did|can|could|will|would|should|have|has|about)\b/i;

const ABBREVIATION_END_RE =
  /\b(?:e\.g\.|i\.e\.|etc\.|vs\.|dr\.|mr\.|mrs\.|ms\.|prof\.|sr\.|jr\.|rs\.|a\.m\.|p\.m\.)$/i;

/**
 * Collapses extra spaces/tabs per line and normalizes excessive blank lines.
 */
function normalizeWhitespace(text) {
  const normalizedNewlines = text.replace(/\r\n?/g, '\n').replace(/[\t\u00A0]+/g, ' ');
  const cleanedLines = normalizedNewlines
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trim());

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Fixes clear spacing issues around punctuation without touching protected tokens.
 */
function normalizePunctuationSpacing(text) {
  // Preserve ellipses while cleaning stray spaces before punctuation.
  let result = text
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');

  // Ensure one space after comma, semicolon, or colon only before a letter (preserves 1,000 and 10:30).
  result = result.replace(/([,;:])(\p{L})/gu, '$1 $2');

  // Ensure one space after sentence-ending punctuation before a letter, '(', or opening curly quote.
  // Avoid straight quotes (" ') here because after punctuation they are typically closing quotes (e.g., tomorrow.").
  result = result.replace(/([!?।])([\p{L}(\u201C\u2018])/gu, '$1 $2');
  result = result.replace(/(\.)(?!\.)([\p{L}(\u201C\u2018])/gu, '$1 $2');

  // Collapse any double spaces introduced between punctuation and text.
  return result
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trim())
    .join('\n');
}

/**
 * Capitalizes a leading ASCII letter on a word unless it is a URL, email, or camelCase brand (e.g. iPhone).
 */
function capitalizeWordIfSafe(word) {
  if (!word) return word;
  if (
    STANDALONE_URL_OR_EMAIL_RE.test(word) ||
    LOWERCASE_BRAND_RE.test(word) ||
    LOWERCASE_DOTTED_ABBR_RE.test(word)
  ) {
    return word;
  }
  return word.replace(/^([a-z])/, (_, ch) => ch.toUpperCase());
}

/**
 * Applies conservative capitalization: line starts, sentence starts, and English pronoun "I".
 */
function applyConservativeCapitalization(text) {
  // Capitalize clear English contractions (i'm -> I'm) and standalone pronoun "i".
  let result = text
    .replace(/\b(i)('(?:m|ve|ll|d))\b/gi, (_, _i, suffix) => `I${suffix.toLowerCase()}`)
    .replace(/(^|[\s"'(\u201C\u2018])i(?=$|[\s,.!?;:"')\u201D\u2019])/g, '$1I');

  // Capitalize start of each non-empty line if safe.
  result = result
    .split('\n')
    .map((line) => {
      const match = line.match(/^([("' \u201C\u2018]*)(\S+)(.*)$/);
      if (!match) return line;
      const [, prefix, firstWord, rest] = match;
      return `${prefix}${capitalizeWordIfSafe(firstWord)}${rest}`;
    })
    .join('\n');

  // Capitalize word after sentence-ending punctuation unless preceded by a dotted abbreviation.
  result = result.replace(
    /([.!?।])([)"'\u201D\u2019]*\s+)([("' \u201C\u2018]*)(\S+)/g,
    (full, punct, space, openQuote, nextWord, offset, whole) => {
      if (punct === '.') {
        const snippetUpToDot = whole.slice(Math.max(0, offset - 12), offset + 1);
        if (ABBREVIATION_END_RE.test(snippetUpToDot)) {
          return full;
        }
      }
      return `${punct}${space}${openQuote}${capitalizeWordIfSafe(nextWord)}`;
    }
  );

  return result;
}

/**
 * Adds a comma after simple greeting starters when followed by a question/clause,
 * and appends a conservative '?' or '.' to multi-word lines lacking ending punctuation.
 */
function applyConservativeEndingPunctuation(text) {
  return text
    .split('\n')
    .map((line) => {
      if (!line) return line;

      // Add a comma after a clear greeting + question opener (e.g., "Hello how are you" -> "Hello, how are you").
      let updated = line;
      if (GREETING_QUESTION_RE.test(updated) && !/^(?:hello|hi|hey),/i.test(updated)) {
        updated = updated.replace(/^(hello|hi|hey)\s+/i, (_, g) => `${g}, `);
      }

      if (
        SENTENCE_END_CHARS_RE.test(updated) ||
        CLOSING_AFTER_END_RE.test(updated) ||
        STANDALONE_URL_OR_EMAIL_RE.test(updated)
      ) {
        return updated;
      }

      // Leave single-word labels/fragments untouched to avoid over-punctuating.
      const words = updated.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        return updated;
      }

      // Check the last sentence/clause for a high-confidence question pattern.
      const lastSegment = updated.split(/[.!?।]\s+/).pop()?.trim() ?? updated;
      if (
        GREETING_QUESTION_RE.test(lastSegment) ||
        QUESTION_AUX_RE.test(lastSegment) ||
        QUESTION_WH_RE.test(lastSegment)
      ) {
        return `${updated}?`;
      }

      return `${updated}.`;
    })
    .join('\n');
}

/**
 * Conservatively cleans raw speech or typed text while preserving meaning,
 * names, numbers, URLs, emails, abbreviations, and code-mixed (Hinglish/Indian) words.
 *
 * @param {string} input
 * @param {{
 *   autoCapitalize?: boolean,
 *   conservativePunctuation?: boolean,
 *   normalizeWhitespace?: boolean,
 * }} [options]
 * @returns {string}
 */
export function cleanText(input, options = {}) {
  if (typeof input !== 'string') return '';

  const {
    autoCapitalize = true,
    conservativePunctuation = true,
    normalizeWhitespace: shouldNormalizeWhitespace = true,
  } = options;

  let working = shouldNormalizeWhitespace ? normalizeWhitespace(input) : input.trim();
  if (!working) return '';

  const { maskedText, tokens } = maskProtectedTokens(working);
  working = maskedText;

  if (conservativePunctuation) {
    working = normalizePunctuationSpacing(working);
  }

  working = restoreProtectedTokens(working, tokens);

  if (autoCapitalize) {
    working = applyConservativeCapitalization(working);
  }

  if (conservativePunctuation) {
    working = applyConservativeEndingPunctuation(working);
  }

  return working;
}

/**
 * Runs cleanText and returns metadata indicating whether any changes were applied.
 * @param {string} input
 * @param {Parameters<typeof cleanText>[1]} [options]
 * @returns {{ text: string, changed: boolean, originalLength: number, cleanedLength: number }}
 */
export function cleanTextWithMeta(input, options = {}) {
  const safeInput = typeof input === 'string' ? input : '';
  const text = cleanText(safeInput, options);
  return {
    text,
    changed: text !== safeInput,
    originalLength: safeInput.length,
    cleanedLength: text.length,
  };
}
