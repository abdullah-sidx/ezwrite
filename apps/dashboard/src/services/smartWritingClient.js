import { generateSmartDraft, normalizeSmartWritingRequest } from '@ezwrite/core';

/**
 * Checks whether the optional dashboard server has a server-side AI provider configured.
 * Never requests or receives any API key.
 */
export async function fetchServerAiStatus() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch('/api/health', { signal: controller.signal });
    if (!response.ok) {
      return { serverAvailable: false, aiConfigured: false, provider: 'local-fallback', model: null };
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { serverAvailable: false, aiConfigured: false, provider: 'local-fallback', model: null };
    }
    const data = await response.json();
    return {
      serverAvailable: true,
      aiConfigured: Boolean(data?.aiConfigured),
      provider: data?.provider || 'local-fallback',
      model: data?.model || null,
    };
  } catch {
    return { serverAvailable: false, aiConfigured: false, provider: 'local-fallback', model: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates a Smart Writing draft using local fallback directly when preferLocal is true,
 * or via the optional server-side /api/smart-writing/generate endpoint with automatic local fallback.
 */
export async function requestSmartDraft(input, { preferLocal = true } = {}) {
  const normalized = normalizeSmartWritingRequest(input);

  if (preferLocal) {
    return generateSmartDraft(normalized);
  }

  try {
    const response = await fetch('/api/smart-writing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...normalized, preferLocal: false }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error(`Server AI endpoint unavailable (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data || typeof data.body !== 'string') {
      throw new Error('Server returned an invalid Smart Writing response.');
    }
    return data;
  } catch (error) {
    const fallback = await generateSmartDraft(normalized);
    return {
      ...fallback,
      usedFallback: true,
      fallbackReason:
        error instanceof Error && error.message
          ? error.message
          : 'Server AI endpoint unavailable; used local template fallback.',
    };
  }
}
