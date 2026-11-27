/**
 * Optional OpenAI-compatible HTTP provider adapter for server-side or desktop use.
 * Never store or pass API keys in frontend browser code or Chrome extensions.
 */

function parseModelJson(content) {
  const trimmed = String(content || '').trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed.body === 'string' && parsed.body.trim()) {
      return {
        subject: typeof parsed.subject === 'string' ? parsed.subject.trim() : '',
        body: parsed.body.trim(),
      };
    }
  } catch {
    // Fall back to plain text body when the model returns non-JSON prose.
  }

  return { subject: '', body: trimmed };
}

/**
 * Creates a modular Smart Writing provider targeting an OpenAI-compatible /chat/completions API.
 * @param {{
 *   apiKey: string,
 *   baseUrl?: string,
 *   model?: string,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 * }} config
 */
export function createOpenAiCompatibleProvider(config = {}) {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = config.model || 'gpt-4o-mini';
  const timeoutMs = Number.isFinite(config.timeoutMs) ? config.timeoutMs : 15000;
  const fetchImpl = config.fetchImpl || globalThis.fetch;

  return {
    name: `openai-compatible:${model}`,
    async generate(request) {
      if (!apiKey) {
        throw new Error('AI provider API key is not configured.');
      }
      if (typeof fetchImpl !== 'function') {
        throw new Error('Fetch API is unavailable in this runtime.');
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const systemPrompt =
          'You are EzWrite Smart Writing. Turn the user instructions into a clear, natural draft. ' +
          'Preserve all facts, dates, and intent. Never invent names, dates, or promises; use [Placeholders] if missing. ' +
          'Respond strictly as JSON: {"subject": "...", "body": "..."}. Leave subject empty for casual chat messages.';

        const userPrompt = [
          `Mode: ${request.mode}`,
          `Tone: ${request.tone}`,
          `Length: ${request.length}`,
          request.recipient ? `Recipient: ${request.recipient}` : null,
          request.purpose ? `Purpose: ${request.purpose}` : null,
          `Instructions: ${request.instructions}`,
        ]
          .filter(Boolean)
          .join('\n');

        const response = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`AI provider returned HTTP ${response.status}.`);
        }

        const payload = await response.json();
        const messageText = payload?.choices?.[0]?.message?.content;
        if (typeof messageText !== 'string' || !messageText.trim()) {
          throw new Error('AI provider returned an empty response.');
        }

        return parseModelJson(messageText);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
