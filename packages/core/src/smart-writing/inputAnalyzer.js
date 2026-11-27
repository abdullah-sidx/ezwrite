import { cleanText } from '../cleanup/cleanText.js';
import { maskProtectedTokens, restoreProtectedTokens } from '../cleanup/tokens.js';
import { classifySmartWritingIntent } from './intentClassifier.js';
import {
  isCodeMixedText,
  stripLeadingGreetings,
  stripTrailingSignOffs,
  upgradeInformalPhrasing,
} from './phraseRules.js';

const REASON_CLAUSE_RE = /\b(?:because|since|as|due to)\s+(.+)$/i;

const GENERIC_TIME_PLEA_RE =
  /^(?:please\s+)?(?:give|allow|grant)\s+me\s+(?:some\s+)?(?:more\s+)?time(?:\s+please)?[.!?]*$|^i\s+kindly\s+request\s+some\s+additional\s+time[.!?]*$/i;

const REQUEST_PATTERN_RE =
  /\b(request|need\s+\d+|need\s+(?:one|two|three|four|five|six|seven|more|extra|additional)|additional\s+\w+\s+(?:days?|hours?|weeks?)|more\s+(?:days?|hours?|weeks?)|extension|leave|could\s+you|could\s+i|can\s+i|would\s+like\s+to\s+(?:request|ask)|please\s+(?:give|grant|allow|approve|let)|asking\s+(?:for|to)|available\s+for\s+a\s+meeting)\b/i;

const COMMITMENT_PATTERN_RE =
  /\b(i\s+will|ill|i'll|will\s+submit|will\s+send|will\s+share|will\s+complete|will\s+finish|will\s+update|as\s+soon\s+as\s+possible|asap)\b/i;

const SITUATION_PATTERN_RE =
  /\b(unable\s+to|cannot|can't|cant|won't|wont|missed|couldn't|couldnt|delayed|late|sick|unwell|exams?|pressure|workload|traffic|issue|problem|because|due\s+to|completed\s+my|(?:assignment|project|work|report|task)\s+(?:completed|finished|done))\b/i;

const RUN_ON_SPLIT_RE =
  /(?<!\b(?:so|and|but|because|since|then|or),?\s*)(?<![.!?,।])\s+(?=(?:please\s+give\s+me\s+time\b|(?:dont|don't|do\s+not)\s+wait\s+for\s+me\b|(?:ill|i'll|i\s+will)\s+(?:be|do|submit|send|share|complete|finish|join|call|attend|update|check|try|fix|deliver|reply|revert|email|message|reach|come|let|make|get|give|have|take|pay|start|work)\b))/gi;

const INSTRUCTION_SUBCLAUSE_SPLIT_RE =
  /(?<![.!?,।])\s+(?=(?:ask|tell|inform|say|mention|request)\s+(?:when|if|whether|about|for|to|that|them|him|her)\b)/gi;

function splitIntoClauses(text, isInstruction) {
  const { maskedText, tokens } = maskProtectedTokens(text);

  let prepared = maskedText.replace(/\r\n?/g, '\n').replace(RUN_ON_SPLIT_RE, '. ');
  if (isInstruction) {
    prepared = prepared.replace(INSTRUCTION_SUBCLAUSE_SPLIT_RE, '. ');
  }

  return prepared
    .split(/(?<=[.!?।])\s+|\n+/)
    .map((part) => restoreProtectedTokens(part.trim(), tokens))
    .filter(Boolean);
}

function normalizeSecondPersonPronouns(text) {
  return text
    .replace(/\b(?:meet|meeting)\s+(?:with\s+)?(?:him|her|them)\b/gi, 'meet with you')
    .replace(/\b(?:talk|speak)\s+(?:to|with)\s+(?:him|her|them)\b/gi, 'speak with you')
    .replace(/\b(?:ask|tell|inform|update|thank)\s+(?:him|her|them)\b/gi, (_, verb) => `${verb} you`)
    .replace(/\bto\s+discuss\s+(?:the\s+)?feedback\b/gi, 'to discuss your feedback')
    .replace(/\bhis\s+or\s+her\b/gi, 'your');
}

function rewriteInstructionClause(clause, register) {
  const trimmed = normalizeSecondPersonPronouns(clause.replace(/[.!?]+$/, '').trim());
  if (!trimmed) return null;

  // Specific pattern: "ask when i can meet with you to discuss your feedback"
  const meetAskMatch = trimmed.match(
    /^ask\s+when\s+(?:i|we)\s+can\s+meet(?:\s+with\s+you)?(.*)$/i
  );
  if (meetAskMatch) {
    const purposeTail = (meetAskMatch[1] || '').trim();
    const appreciationSentence = purposeTail
      ? cleanText(`I would appreciate the opportunity to meet with you ${purposeTail}.`)
      : '';
    const questionSentence =
      register === 'casual'
        ? 'When are you free to meet?'
        : 'Could you please let me know when you might be available for a meeting?';
    return {
      appreciationSentence,
      purposeTail,
      sentences: [questionSentence],
      bucket: 'request',
    };
  }

  const patterns = [
    {
      re: /^(?:asking\s+for|ask\s+for|requesting)\s+(.+)$/i,
      bucket: 'request',
      build: (rest) =>
        register === 'casual'
          ? `Could I get ${rest}?`
          : `I am writing to kindly request ${rest}.`,
    },
    {
      re: /^(?:asking\s+to|ask\s+to|requesting\s+to)\s+(.+)$/i,
      bucket: 'request',
      build: (rest) =>
        register === 'casual' ? `Could I ${rest}?` : `I am writing to kindly ask to ${rest}.`,
    },
    {
      re: /^(?:ask|asking)\s+(?:when|if|whether|about)\s+(.+)$/i,
      bucket: 'request',
      build: (rest, full) => {
        const kw = full.match(/^(?:ask|asking)\s+(when|if|whether|about)\s+/i)?.[1]?.toLowerCase();
        const body = rest.replace(/\b(?:i|we)\s+can\b/gi, 'you might be available to');
        if (kw === 'about') return `Could you please share an update regarding ${rest}?`;
        return `Could you please let me know ${kw} ${body}?`;
      },
    },
    {
      re: /^(?:to\s+apologize|apologize|apologizing|saying\s+sorry)\s+(?:for\s+)?(.+)$/i,
      bucket: 'situation',
      build: (rest) =>
        register === 'casual'
          ? `Sorry for ${rest}.`
          : `I would like to sincerely apologize for ${rest}.`,
    },
    {
      re: /^(?:to\s+follow\s+up|follow\s*up|following\s+up)\s+(?:on|about|regarding|with)?\s*(.+)$/i,
      bucket: 'request',
      build: (rest) => `I am writing to follow up regarding ${rest}.`,
    },
    {
      re: /^(?:to\s+remind|remind|reminding)\s+(?:them|him|her|everyone|the team|you)?\s*(?:about|to|that)?\s*(.+)$/i,
      bucket: 'request',
      build: (rest) => `I wanted to share a gentle reminder regarding ${rest}.`,
    },
    {
      re: /^(?:to\s+inform|inform|tell|telling|informing|say|saying|mention)\s+(?:that\s+)?(.+)$/i,
      bucket: 'situation',
      build: (rest) => `I am writing to let you know that ${rest}.`,
    },
    {
      re: /^(?:to\s+thank|thank|thanking)\s+(?:you\s+)?(?:for\s+)?(.+)$/i,
      bucket: 'other',
      build: (rest) => `I wanted to thank you for ${rest}.`,
    },
  ];

  for (const { re, bucket, build } of patterns) {
    const match = trimmed.match(re);
    if (match?.[1]) {
      return {
        appreciationSentence: '',
        purposeTail: '',
        sentences: [upgradeInformalPhrasing(build(match[1].trim(), trimmed), register)],
        bucket,
      };
    }
  }

  return null;
}

function splitReasonTail(clause, register) {
  const match = clause.match(REASON_CLAUSE_RE);
  if (!match || match.index <= 6) {
    return { main: upgradeInformalPhrasing(clause, register), reason: '', connector: 'as' };
  }
  const mainPart = clause.slice(0, match.index).replace(/[,\s]+$/, '').trim();
  const rawConnector = match[0].toLowerCase().startsWith('due to') ? 'due to' : 'as';
  let reasonPart = match[1].replace(/[.!?]+$/, '').trim();
  let connector = rawConnector;

  if (/^of\s+/i.test(reasonPart)) {
    reasonPart = reasonPart.replace(/^of\s+/i, '').trim();
    connector = 'due to';
  }

  const upgradedMain = upgradeInformalPhrasing(mainPart, register);
  const upgradedReason = upgradeInformalPhrasing(reasonPart, register)
    .replace(/[.!?]+$/, '')
    .replace(/^(?:My|Our|The|There|Things|An|A)\b/, (w) => w.toLowerCase());

  return { main: upgradedMain, reason: upgradedReason, connector };
}

function resolveRecipient(intent, greetingRecipient) {
  if (intent.explicitRecipient) {
    return { label: intent.explicitRecipient, isPlaceholder: false };
  }
  if (intent.instructionRecipient) {
    return { label: intent.instructionRecipient, isPlaceholder: false };
  }
  if (greetingRecipient) {
    return { label: greetingRecipient, isPlaceholder: false };
  }
  return { label: '[Recipient Name]', isPlaceholder: true };
}

/**
 * Analyzes user input (writing instruction or direct message) into structured semantic slots
 * without inventing facts or dropping numbers, names, dates, or commitments.
 */
export function analyzeSmartWritingInput(request) {
  const { text: withoutGreetings, detectedRecipient, hadCasualVocative } = stripLeadingGreetings(
    request.instructions
  );
  const cleanedRaw = stripTrailingSignOffs(withoutGreetings);
  const intent = classifySmartWritingIntent(cleanedRaw || request.instructions, request);

  const recipientInfo = resolveRecipient(intent, detectedRecipient);
  const register = request.mode === 'casual-message' ? 'casual' : request.tone;
  const codeMixed = isCodeMixedText(intent.core);

  const rawClauses = splitIntoClauses(intent.core, intent.inputType === 'instruction');
  const situationClauses = [];
  const requestClauses = [];
  const commitmentClauses = [];
  const otherClauses = [];

  const hasSpecificTimeRequest = rawClauses.some((c) =>
    /\b(\d+|one|two|three|four|five|six|seven)\s+(?:more|extra|additional)\s+(?:days?|hours?|weeks?)\b/i.test(
      c
    )
  );

  for (let i = 0; i < rawClauses.length; i += 1) {
    const rawClause = rawClauses[i];
    if (!rawClause) continue;

    if (hasSpecificTimeRequest && GENERIC_TIME_PLEA_RE.test(rawClause)) {
      continue;
    }

    if (intent.inputType === 'instruction') {
      const { main, reason, connector } = splitReasonTail(rawClause, register);
      let rewritten = rewriteInstructionClause(
        reason ? main.replace(/[.!?]+$/, '') : rawClause,
        register
      );

      // If verbose prefix stripped "follow-up"/"apology"/"reminder" leaving only a bare topic (e.g. "tomorrow"), frame it cleanly.
      if (!rewritten && rawClauses.length === 1) {
        const bareTopic = rawClause.replace(/[.!?]+$/, '').trim();
        if (bareTopic && !/\b(?:i|we|you|is|are|was|were|have|has|completed|finished|done)\b/i.test(bareTopic)) {
          if (intent.communicationType === 'follow-up') {
            rewritten = {
              appreciationSentence: '',
              purposeTail: '',
              sentences: [upgradeInformalPhrasing(`I am writing to follow up regarding ${bareTopic}.`, register)],
              bucket: 'request',
            };
          } else if (intent.communicationType === 'reminder') {
            rewritten = {
              appreciationSentence: '',
              purposeTail: '',
              sentences: [upgradeInformalPhrasing(`I wanted to share a gentle reminder regarding ${bareTopic}.`, register)],
              bucket: 'request',
            };
          }
        }
      }

      if (rewritten) {
        // Combine a preceding completion/status fact seamlessly with a meeting feedback request.
        if (rewritten.appreciationSentence) {
          const lastOther = situationClauses[situationClauses.length - 1] || otherClauses[otherClauses.length - 1];
          if (
            lastOther &&
            /\bcompleted\b/i.test(lastOther) &&
            rewritten.purposeTail
          ) {
            const merged = cleanText(
              `${lastOther.replace(/[.!?]+$/, '')} and would appreciate the opportunity to meet with you ${rewritten.purposeTail}.`
            );
            if (situationClauses.length > 0) {
              situationClauses[situationClauses.length - 1] = merged;
            } else {
              otherClauses[otherClauses.length - 1] = merged;
            }
          } else {
            situationClauses.push(rewritten.appreciationSentence);
          }
        }

        for (const s of rewritten.sentences) {
          const finalSentence = reason
            ? cleanText(`${s.replace(/[.!?]+$/, '')}, ${connector} ${reason}.`)
            : s;
          if (rewritten.bucket === 'request') requestClauses.push(finalSentence);
          else if (rewritten.bucket === 'situation') situationClauses.push(finalSentence);
          else otherClauses.push(finalSentence);
        }
        continue;
      }
    }

    const upgraded = upgradeInformalPhrasing(rawClause, register);
    if (!upgraded) continue;

    const allSeen = [
      ...situationClauses,
      ...requestClauses,
      ...commitmentClauses,
      ...otherClauses,
    ];
    if (allSeen.some((existing) => existing.toLowerCase() === upgraded.toLowerCase())) {
      continue;
    }

    if (COMMITMENT_PATTERN_RE.test(rawClause) && !REQUEST_PATTERN_RE.test(rawClause)) {
      commitmentClauses.push(upgraded);
    } else if (REQUEST_PATTERN_RE.test(rawClause) && !SITUATION_PATTERN_RE.test(rawClause)) {
      requestClauses.push(upgraded);
    } else if (SITUATION_PATTERN_RE.test(rawClause)) {
      situationClauses.push(upgraded);
    } else {
      otherClauses.push(upgraded);
    }
  }

  return {
    inputType: intent.inputType,
    communicationType: intent.communicationType,
    recipientInfo,
    hadCasualVocative,
    register,
    codeMixed,
    subjectTopic: intent.subject,
    rawCore: cleanText(intent.core),
    situationClauses,
    requestClauses,
    commitmentClauses,
    otherClauses,
  };
}
