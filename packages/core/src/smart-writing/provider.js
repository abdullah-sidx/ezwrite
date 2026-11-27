import { DRAFT_SOURCES } from './constants.js';
import { generateLocalDraft, normalizeSmartWritingRequest } from './localGenerator.js';

/**
 * Generates a Smart Writing draft using an optional AI provider adapter when supplied,
 * and falls back gracefully to deterministic local template generation if no provider
 * is configured or if the provider fails.
 *
 * @param {object} input
 * @param {{ provider?: { name?: string, generate: (req: object) => Promise<{ subject?: string, body: string }> } | null }} [options]
 */
export async function generateSmartDraft(input, options = {}) {
  const normalized = normalizeSmartWritingRequest(input);
  const provider = options?.provider ?? null;

  if (!provider || typeof provider.generate !== 'function') {
    return generateLocalDraft(normalized);
  }

  try {
    const aiResult = await provider.generate(normalized);
    const body = typeof aiResult?.body === 'string' ? aiResult.body.trim() : '';
    if (!body) {
      throw new Error('AI provider returned an empty draft body.');
    }

    const subject = typeof aiResult?.subject === 'string' ? aiResult.subject.trim() : '';

    return {
      subject,
      body,
      source: DRAFT_SOURCES.AI_PROVIDER,
      providerName: provider.name || 'external-ai',
      usedFallback: false,
      fallbackReason: null,
      warnings: Array.isArray(aiResult?.warnings) ? aiResult.warnings : [],
      mode: normalized.mode,
      tone: normalized.tone,
      length: normalized.length,
    };
  } catch (error) {
    const fallbackDraft = generateLocalDraft(normalized);
    return {
      ...fallbackDraft,
      usedFallback: true,
      fallbackReason:
        error instanceof Error && error.message
          ? error.message
          : 'Optional AI provider was unavailable.',
    };
  }
}
