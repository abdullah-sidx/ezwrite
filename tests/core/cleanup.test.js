import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, cleanTextWithMeta } from '../../packages/core/src/index.js';

describe('cleanText — conservative text cleanup engine', () => {
  it('handles empty, whitespace-only, and non-string inputs gracefully', () => {
    assert.equal(cleanText(''), '');
    assert.equal(cleanText('   \n\t\u00A0  '), '');
    assert.equal(cleanText(null), '');
    assert.equal(cleanText(undefined), '');
    assert.equal(cleanText(12345), '');
  });

  it('cleans normal sentences from the reference test plan', () => {
    assert.equal(cleanText('hello how are you'), 'Hello, how are you?');
    assert.equal(
      cleanText('please send me the notes tomorrow'),
      'Please send me the notes tomorrow.'
    );
    assert.equal(cleanText('My meeting is at 10:30 AM'), 'My meeting is at 10:30 AM.');
    assert.equal(cleanText('I use WhatsApp and Gmail'), 'I use WhatsApp and Gmail.');
  });

  it('normalizes extra spaces, tabs, and excessive line breaks while preserving paragraphs', () => {
    const messy = '  hello   world  \r\n\r\n\r\n\tthis   is\t  a   test  ';
    assert.equal(cleanText(messy), 'Hello world.\n\nThis is a test.');
  });

  it('fixes punctuation spacing without breaking Indian/English numbers or times', () => {
    assert.equal(cleanText('hello ,world !  how are you ?'), 'Hello, world! How are you?');
    assert.equal(cleanText('total is 1,000 and 10,00,000 today'), 'Total is 1,000 and 10,00,000 today.');
    assert.equal(cleanText('meeting is at 10:30 am sharp'), 'Meeting is at 10:30 am sharp.');
  });

  it('preserves URLs, email addresses, decimals, versions, and camelCase brands', () => {
    assert.equal(cleanText('Email me at name@example.com'), 'Email me at name@example.com.');
    assert.equal(cleanText('name@example.com'), 'name@example.com');
    assert.equal(cleanText('https://ezwrite.app/docs?tab=1'), 'https://ezwrite.app/docs?tab=1');
    assert.equal(
      cleanText('check https://ezwrite.app/a.b and v0.1.0 for 3.14'),
      'Check https://ezwrite.app/a.b and v0.1.0 for 3.14.'
    );
    assert.equal(cleanText('iPhone and macOS work well'), 'iPhone and macOS work well.');
  });

  it('preserves abbreviations without false sentence splits or double periods', () => {
    assert.equal(
      cleanText('dr. sharma shared notes e.g. math, science, etc.'),
      'Dr. sharma shared notes e.g. math, science, etc.'
    );
    assert.equal(cleanText('e.g. please review this'), 'e.g. please review this.');
  });

  it('preserves Hinglish, regional scripts, and code-mixed speech without translating or corrupting words', () => {
    assert.equal(
      cleanText('kal 10:30 AM ko meeting hai please notes bhej dena'),
      'Kal 10:30 AM ko meeting hai please notes bhej dena.'
    );
    assert.equal(cleanText('bhai kya haal hai'), 'Bhai kya haal hai.');
    assert.equal(cleanText('नमस्ते आप कैसे हैं।'), 'नमस्ते आप कैसे हैं।');
  });

  it('handles quotations, parentheses, ellipses, and single-word labels conservatively', () => {
    assert.equal(
      cleanText('he said "please check ( tomorrow )"'),
      'He said "please check (tomorrow)".'
    );
    assert.equal(
      cleanText('he said "please check tomorrow."'),
      'He said "please check tomorrow."'
    );
    assert.equal(cleanText('wait...'), 'Wait...');
    assert.equal(cleanText('notes'), 'Notes');
  });

  it('capitalizes standalone English pronoun i and contractions safely', () => {
    assert.equal(cleanText("i think i'm ready and i'll join"), "I think I'm ready and I'll join.");
  });

  it('respects option flags for autoCapitalize and conservativePunctuation', () => {
    assert.equal(
      cleanText('  hello   world  ', { autoCapitalize: false, conservativePunctuation: false }),
      'hello world'
    );
    assert.equal(
      cleanText('hello world', { autoCapitalize: true, conservativePunctuation: false }),
      'Hello world'
    );
    assert.equal(
      cleanText('hello world', { autoCapitalize: false, conservativePunctuation: true }),
      'hello world.'
    );
  });

  it('is deterministic and idempotent across repeated runs', () => {
    const samples = [
      'hello how are you',
      '  please   check https://example.com/test.html , and email name@example.com  ',
      'kal 10:30 AM ko meeting hai dr. rao ke saath etc.',
      'first line\n\n\nsecond line?   third line!',
      '',
    ];

    for (const sample of samples) {
      const once = cleanText(sample);
      const twice = cleanText(once);
      assert.equal(twice, once, `Expected idempotent output for: ${sample}`);
    }
  });

  it('cleanTextWithMeta reports changed status accurately', () => {
    const changed = cleanTextWithMeta('hello world');
    assert.deepEqual(changed, {
      text: 'Hello world.',
      changed: true,
      originalLength: 11,
      cleanedLength: 12,
    });

    const unchanged = cleanTextWithMeta('Already clean.');
    assert.deepEqual(unchanged, {
      text: 'Already clean.',
      changed: false,
      originalLength: 14,
      cleanedLength: 14,
    });
  });
});
