/**
 * Masks tokens that must never be split, spaced, or re-cased by cleanup rules:
 * URLs, email addresses, decimal/version numbers, clock times, and common abbreviations.
 */

const URL_PATTERN = /\bhttps?:\/\/[^\s<>()]+|\bwww\.[^\s<>()]+/gi;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const TIME_PATTERN = /\b\d{1,2}:\d{2}(?:\s?(?:AM|PM|am|pm))?\b/g;
const DECIMAL_OR_VERSION_PATTERN = /\b\d+(?:\.\d+)+\b/g;
const ABBREVIATION_PATTERN =
  /\b(?:e\.g\.|i\.e\.|etc\.|vs\.|dr\.|mr\.|mrs\.|ms\.|prof\.|sr\.|jr\.|rs\.|a\.m\.|p\.m\.)/gi;

const TRAILING_PUNCT_RE = /[.,!?;:]+$/;

/**
 * Replaces protected spans with collision-free Private Use Area placeholders.
 * @param {string} text
 * @returns {{ maskedText: string, tokens: string[] }}
 */
export function maskProtectedTokens(text) {
  const tokens = [];
  let result = text;

  const storeToken = (value) => {
    const id = tokens.length;
    tokens.push(value);
    return `\uE000EZT_${id}\uE001`;
  };

  // Mask URLs first, keeping any trailing sentence punctuation outside the token.
  result = result.replace(URL_PATTERN, (match) => {
    const trailing = match.match(TRAILING_PUNCT_RE)?.[0] ?? '';
    const core = trailing ? match.slice(0, -trailing.length) : match;
    if (!core) return match;
    return `${storeToken(core)}${trailing}`;
  });

  // Mask emails, times, decimals/versions, and dotted abbreviations.
  for (const pattern of [
    EMAIL_PATTERN,
    TIME_PATTERN,
    DECIMAL_OR_VERSION_PATTERN,
    ABBREVIATION_PATTERN,
  ]) {
    result = result.replace(pattern, (match) => storeToken(match));
  }

  return { maskedText: result, tokens };
}

/**
 * Restores masked placeholders back to their exact original values.
 * @param {string} text
 * @param {string[]} tokens
 * @returns {string}
 */
export function restoreProtectedTokens(text, tokens) {
  return text.replace(/\uE000EZT_(\d+)\uE001/g, (_, index) => tokens[Number(index)] ?? '');
}
