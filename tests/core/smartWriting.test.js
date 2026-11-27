import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySmartWritingIntent,
  createOpenAiCompatibleProvider,
  DRAFT_SOURCES,
  generateLocalDraft,
  generateSmartDraft,
  SMART_WRITING_LENGTHS,
  SMART_WRITING_MODES,
  SMART_WRITING_TONES,
} from '../../packages/core/src/index.js';
import { createDashboardServer } from '../../apps/dashboard/server.mjs';

describe('Smart Writing — local fallback engine', () => {
  it('handles the professor assignment extension example cleanly without inventing facts', () => {
    const draft = generateLocalDraft({
      instructions:
        'Write an email to my professor asking for two extra days to submit my assignment because I was sick.',
      mode: 'professional-email',
      tone: 'polite',
      length: 'medium',
    });

    assert.equal(draft.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
    assert.equal(draft.usedFallback, false);
    assert.match(draft.subject, /Assignment/i);
    assert.match(draft.body, /Dear Professor,/);
    assert.match(draft.body, /two extra days/i);
    assert.match(draft.body, /sick/i);
    assert.match(draft.body, /\[Your Name\]/);
  });

  it('supports every writing mode cleanly', () => {
    for (const mode of SMART_WRITING_MODES) {
      const draft = generateLocalDraft({
        instructions: 'Need to update the client about tomorrow at 3:00 PM.',
        mode: mode.id,
        tone: 'professional',
        length: 'short',
      });

      assert.equal(draft.mode, mode.id);
      assert.equal(draft.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
      assert.ok(draft.body.length > 0, `Expected non-empty body for mode ${mode.id}`);
      assert.match(draft.body, /3:00 PM/);
      if (mode.hasSubject) {
        assert.ok(draft.subject.length > 0, `Expected subject for mode ${mode.id}`);
      } else {
        assert.equal(draft.subject, '');
      }
    }
  });

  it('supports every tone and differentiates length output', () => {
    for (const tone of SMART_WRITING_TONES) {
      const draft = generateLocalDraft({
        instructions: 'Ask my manager for leave on Friday.',
        mode: 'request',
        tone: tone.id,
        length: 'medium',
      });
      assert.equal(draft.tone, tone.id);
      assert.ok(draft.body.includes('Friday'));
    }

    const lengths = {};
    for (const length of SMART_WRITING_LENGTHS) {
      lengths[length.id] = generateLocalDraft({
        instructions:
          'Write a message to my manager requesting leave from Monday to Wednesday because of an urgent family event.',
        mode: 'professional-email',
        tone: 'polite',
        length: length.id,
      });
    }

    assert.ok(lengths.short.body.length < lengths.medium.body.length);
    assert.ok(lengths.medium.body.length <= lengths.detailed.body.length);
    assert.match(lengths.detailed.body, /Monday to Wednesday/);
  });

  it('rejects empty or invalid instructions clearly', () => {
    assert.throws(() => generateLocalDraft({ instructions: '' }), /describe what you want/i);
    assert.throws(() => generateLocalDraft({ instructions: '   \n\t ' }), /describe what you want/i);
    assert.throws(() => generateLocalDraft(null), /must be an object/i);
  });

  it('uses safe placeholders and warnings when recipient or dates are missing', () => {
    const draft = generateLocalDraft({
      instructions: 'Write an apology for missing the meeting.',
      mode: 'apology',
      tone: 'polite',
      length: 'medium',
    });

    assert.match(draft.body, /\[Recipient Name\]/);
    assert.match(draft.body, /\[Your Name\]/);
    assert.doesNotMatch(draft.body, /Dear Missing/i);
    assert.ok(draft.warnings.some((w) => w.includes('[Recipient Name]')));
    assert.ok(draft.warnings.some((w) => w.includes('No specific date')));
  });

  it('preserves user-provided names, dates, URLs, and emails without alteration', () => {
    const draft = generateLocalDraft({
      instructions:
        'Follow up with Riya about https://ezwrite.app/demo and reply to riya@example.com before 12 Nov.',
      mode: 'follow-up',
      tone: 'friendly',
      length: 'short',
      recipient: 'Riya',
    });

    assert.match(draft.body, /^Hi Riya,/);
    assert.match(draft.body, /https:\/\/ezwrite\.app\/demo/);
    assert.match(draft.body, /riya@example\.com/);
    assert.match(draft.body, /12 Nov/);
  });

  it('rewrites the unprofessional professor email example into a natural gender-neutral draft', () => {
    const draft = generateLocalDraft({
      instructions:
        'hey sir i cant submit assignment on time because exams are going on and too much pressure. need 2 more days to finish it properly. please give me time ill submit it asap thanks',
      mode: 'professional-email',
      tone: 'professional',
      length: 'medium',
    });

    assert.equal(draft.subject, 'Request for Assignment Extension');
    assert.match(draft.body, /^Dear \[Recipient Name\],/);
    assert.doesNotMatch(draft.body, /Dear Sir/i);
    assert.doesNotMatch(draft.body, /hey sir/i);
    assert.doesNotMatch(draft.body, /\bcant\b/i);
    assert.doesNotMatch(draft.body, /too much pressure/i);
    assert.doesNotMatch(draft.body, /\basap\b/i);
    assert.doesNotMatch(draft.body, /\bill\b/i);
    assert.match(draft.body, /I am unable to submit my assignment on time/i);
    assert.match(draft.body, /heavy workload/i);
    assert.match(draft.body, /additional two days/i);
    assert.match(draft.body, /I will submit it as soon as possible/i);
    assert.match(draft.body, /Best regards,\n\[Your Name\]$/);
  });

  it('interprets the professor feedback instruction without copying instruction words or inventing dates', () => {
    const intent = classifySmartWritingIntent(
      'email professor assignment completed ask when i can meet him to discuss feedback',
      { mode: 'professional-email' }
    );
    assert.equal(intent.inputType, 'instruction');
    assert.equal(intent.communicationType, 'meeting-feedback');
    assert.equal(intent.instructionRecipient, 'Professor');

    const draft = generateLocalDraft({
      instructions:
        'email professor assignment completed ask when i can meet him to discuss feedback',
      mode: 'professional-email',
      tone: 'professional',
      length: 'medium',
    });

    assert.equal(draft.subject, 'Request for a Meeting to Discuss Assignment Feedback');
    assert.match(draft.body, /^Dear Professor,/);
    assert.match(
      draft.body,
      /I have completed my assignment and would appreciate the opportunity to meet with you to discuss your feedback\.\n\nCould you please let me know when you might be available for a meeting\?/
    );
    assert.doesNotMatch(draft.body, /\bemail professor\b/i);
    assert.doesNotMatch(draft.body, /\bask when\b/i);
    assert.doesNotMatch(draft.body, /\bhim\b/i);
    assert.doesNotMatch(draft.body, /Dear Sir/i);
  });

  it('composes natural casual messages without awkward fragments, placeholders, or duplicate thanks', () => {
    const draft = generateLocalDraft({
      instructions:
        'bro i might be late today traffic is crazy dont wait for me start without me',
      mode: 'casual-message',
      tone: 'friendly',
      length: 'short',
    });

    assert.equal(draft.subject, '');
    assert.equal(
      draft.body,
      "Hey, I might be a little late today because traffic is really heavy. Don't wait for me; go ahead and start without me."
    );
    assert.doesNotMatch(draft.body, /\[Recipient Name\]/);
    assert.doesNotMatch(draft.body, /\[Your Name\]/);
    assert.doesNotMatch(draft.body, /thanks/i);
  });

  it('classifies direct messages vs instructions and generates purpose-based subjects', () => {
    const directIntent = classifySmartWritingIntent(
      'hey sir i need 2 more days to submit my assignment',
      { mode: 'request' }
    );
    assert.equal(directIntent.inputType, 'direct-message');
    assert.equal(directIntent.subject, 'Request for Assignment Extension');

    const updateDraft = generateLocalDraft({
      instructions: 'tell manager project update ready for review',
      mode: 'professional-email',
      tone: 'professional',
      length: 'short',
    });
    assert.equal(updateDraft.subject, 'Project Progress Update');
    assert.match(updateDraft.body, /^Dear Manager,/);
    assert.doesNotMatch(updateDraft.subject, /\b(?:tell|email|ask|write)\b/i);
  });

  it('applies context-aware rules without blindly corrupting words like "ill" or "id"', () => {
    const draft = generateLocalDraft({
      instructions:
        'hi manager i was ill yesterday so please check my user id 402. ill send the report today',
      mode: 'professional-email',
      tone: 'polite',
      length: 'short',
    });

    assert.match(draft.body, /^Dear Manager,/);
    assert.match(draft.body, /I was ill yesterday/i);
    assert.match(draft.body, /user id 402/i);
    assert.match(draft.body, /I will send the report today/i);
    assert.doesNotMatch(draft.body, /I will yesterday/i);
    assert.doesNotMatch(draft.body, /I would 402/i);
  });

  it('removes duplicate greetings and trailing informal sign-offs cleanly', () => {
    const draft = generateLocalDraft({
      instructions:
        'Dear sir, hey sir, pls check the updated file. thx thanks in advance',
      mode: 'professional-email',
      tone: 'professional',
      length: 'short',
      recipient: 'Dr. Mehta',
    });

    assert.match(draft.body, /^Dear Dr\. Mehta,/);
    assert.doesNotMatch(draft.body, /hey sir/i);
    assert.doesNotMatch(draft.body, /dear sir/i);
    assert.doesNotMatch(draft.body, /\bthx\b/i);
    assert.doesNotMatch(draft.body, /\bpls\b/i);
    assert.match(draft.body, /Please check the updated file/i);
  });

  it('produces meaningfully different outputs for Professional, Formal, Friendly, and Casual', () => {
    const input =
      'hey sir i cant submit assignment on time because exams are going on and too much pressure. need 2 more days to finish it properly. ill submit it asap thanks';

    const professional = generateLocalDraft({
      instructions: input,
      mode: 'professional-email',
      tone: 'professional',
      length: 'medium',
    });
    const formal = generateLocalDraft({
      instructions: input,
      mode: 'formal-message',
      tone: 'formal',
      length: 'medium',
    });
    const friendly = generateLocalDraft({
      instructions: input,
      mode: 'professional-email',
      tone: 'friendly',
      length: 'medium',
    });
    const casual = generateLocalDraft({
      instructions: input,
      mode: 'casual-message',
      tone: 'friendly',
      length: 'short',
    });

    assert.notEqual(professional.body, formal.body);
    assert.notEqual(professional.body, friendly.body);
    assert.notEqual(friendly.body, casual.body);

    assert.match(formal.body, /Sincerely,/);
    assert.match(friendly.body, /^Hi \[Recipient Name\],/);
    assert.equal(casual.subject, '');
    assert.match(casual.body, /2 more days/);
    assert.match(casual.body, /Thanks!/);
  });

  it('preserves Hinglish and regional language input without translating or corrupting words', () => {
    const hinglish = generateLocalDraft({
      instructions: 'sir kal 10:30 AM ko leave chahiye urgent personal kaam hai',
      mode: 'request',
      tone: 'polite',
      length: 'short',
    });

    assert.match(hinglish.body, /^Dear \[Recipient Name\],/);
    assert.match(hinglish.body, /Kal 10:30 AM ko leave chahiye urgent personal kaam hai\./);
    assert.equal(hinglish.subject, 'Leave Request');

    const devanagari = generateLocalDraft({
      instructions: 'नमस्ते कल मीटिंग 4:00 PM को है।',
      mode: 'general-writing',
      tone: 'simple',
      length: 'short',
    });
    assert.match(devanagari.body, /नमस्ते कल मीटिंग 4:00 PM को है।/);
  });
});

describe('Smart Writing — modular AI provider & fallback', () => {
  it('uses local fallback cleanly when no provider is configured', async () => {
    const draft = await generateSmartDraft({
      instructions: 'Write a quick reminder to send the project report by 5 PM.',
      mode: 'general-writing',
      tone: 'simple',
      length: 'short',
    });

    assert.equal(draft.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
    assert.equal(draft.usedFallback, false);
    assert.match(draft.body, /5 PM/);
  });

  it('uses an optional AI provider when it returns valid output', async () => {
    const mockProvider = {
      name: 'mock-ai',
      async generate() {
        return {
          subject: 'Assignment Extension Request',
          body: 'Dear Professor,\n\nCould I please have two extra days to submit my assignment?\n\nSincerely,\n[Your Name]',
        };
      },
    };

    const draft = await generateSmartDraft(
      {
        instructions: 'Ask professor for two extra days.',
        mode: 'professional-email',
        tone: 'polite',
        length: 'short',
      },
      { provider: mockProvider }
    );

    assert.equal(draft.source, DRAFT_SOURCES.AI_PROVIDER);
    assert.equal(draft.providerName, 'mock-ai');
    assert.equal(draft.usedFallback, false);
    assert.equal(draft.subject, 'Assignment Extension Request');
  });

  it('falls back gracefully to local generation when the AI provider fails or returns empty output', async () => {
    const failingProvider = {
      name: 'failing-ai',
      async generate() {
        throw new Error('Simulated provider outage');
      },
    };

    const draftFromError = await generateSmartDraft(
      {
        instructions: 'Ask my manager for leave tomorrow.',
        mode: 'request',
        tone: 'polite',
        length: 'short',
      },
      { provider: failingProvider }
    );

    assert.equal(draftFromError.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
    assert.equal(draftFromError.usedFallback, true);
    assert.match(draftFromError.fallbackReason, /Simulated provider outage/);
    assert.match(draftFromError.body, /tomorrow/);

    const emptyProvider = {
      name: 'empty-ai',
      async generate() {
        return { subject: 'Ignored', body: '   ' };
      },
    };

    const draftFromEmpty = await generateSmartDraft(
      {
        instructions: 'Ask my manager for leave tomorrow.',
        mode: 'request',
        tone: 'polite',
        length: 'short',
      },
      { provider: emptyProvider }
    );

    assert.equal(draftFromEmpty.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
    assert.equal(draftFromEmpty.usedFallback, true);
    assert.match(draftFromEmpty.fallbackReason, /empty draft body/i);
  });

  it('createOpenAiCompatibleProvider handles mock HTTP responses and errors safely', async () => {
    const okProvider = createOpenAiCompatibleProvider({
      apiKey: 'test-placeholder-only',
      model: 'mock-model',
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            choices: [
              {
                message: {
                  content: '```json\n{"subject":"Leave Request","body":"Dear Manager,\\n\\nRequesting leave."}\n```',
                },
              },
            ],
          };
        },
      }),
    });

    const okResult = await okProvider.generate({
      instructions: 'Ask for leave',
      mode: 'request',
      tone: 'polite',
      length: 'short',
    });
    assert.equal(okResult.subject, 'Leave Request');
    assert.match(okResult.body, /Dear Manager,/);

    const errProvider = createOpenAiCompatibleProvider({
      apiKey: 'test-placeholder-only',
      fetchImpl: async () => ({ ok: false, status: 503 }),
    });
    await assert.rejects(
      () => errProvider.generate({ instructions: 'Hi', mode: 'request', tone: 'polite', length: 'short' }),
      /HTTP 503/
    );
  });
});

describe('Dashboard server API — no secrets & graceful fallback', () => {
  it('serves /api/health without exposing secrets and falls back cleanly on /api/smart-writing/generate', async () => {
    const server = createDashboardServer({
      env: {
        EZWRITE_AI_PROVIDER: 'openai-compatible',
        EZWRITE_AI_API_KEY: 'test-secret-never-leak',
      },
      fetchImpl: async () => ({ ok: false, status: 502 }),
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert.equal(healthRes.status, 200);
      const healthText = await healthRes.text();
      assert.doesNotMatch(healthText, /test-secret-never-leak/);
      const healthJson = JSON.parse(healthText);
      assert.equal(healthJson.aiConfigured, true);

      const genRes = await fetch(`${baseUrl}/api/smart-writing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: 'Write a quick follow-up to my team about tomorrow.',
          mode: 'follow-up',
          tone: 'professional',
          length: 'short',
        }),
      });
      assert.equal(genRes.status, 200);
      const genJson = await genRes.json();
      assert.equal(genJson.source, DRAFT_SOURCES.LOCAL_TEMPLATE);
      assert.equal(genJson.usedFallback, true);
      assert.match(genJson.body, /tomorrow/);

      const badRes = await fetch(`${baseUrl}/api/smart-writing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: '   ' }),
      });
      assert.equal(badRes.status, 400);
    } finally {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
