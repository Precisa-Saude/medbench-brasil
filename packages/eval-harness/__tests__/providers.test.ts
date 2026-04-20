import type { Question } from '@precisa-saude/medbench-dataset';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { anthropicProvider } from '../src/providers/anthropic.js';
import { googleProvider } from '../src/providers/google.js';
import { openAiProvider } from '../src/providers/openai.js';
import { openAiCompatProvider } from '../src/providers/openai-compat.js';

const QUESTION: Question = {
  annulled: false,
  correct: 'A',
  editionId: 'revalida-2025-1',
  hasImage: false,
  hasTable: false,
  id: 'q1',
  number: 1,
  options: { A: 'a', B: 'b', C: 'c', D: 'd' },
  specialty: ['cirurgia'],
  stem: 'stem',
};

const INPUT = { question: QUESTION, systemPrompt: 'sys', userPrompt: 'user' };

function mockFetchResponse(init: {
  body?: unknown;
  ok?: boolean;
  status?: number;
  text?: string;
}): void {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => init.body ?? {},
      ok,
      status,
      text: async () => init.text ?? '',
    } as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('anthropicProvider', () => {
  it('lança com status e corpo quando a API retorna !ok', async () => {
    mockFetchResponse({ ok: false, status: 429, text: 'rate limited' });
    const provider = anthropicProvider({ apiKey: 'k', model: 'claude-sonnet-4-6' });
    await expect(provider.run(INPUT)).rejects.toThrow(/Anthropic API erro 429.*rate limited/);
  });

  it('lança se ANTHROPIC_API_KEY estiver ausente', async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const provider = anthropicProvider({ model: 'claude-sonnet-4-6' });
      await expect(provider.run(INPUT)).rejects.toThrow(/ANTHROPIC_API_KEY ausente/);
    } finally {
      if (original !== undefined) process.env.ANTHROPIC_API_KEY = original;
    }
  });

  it('omite temperature para família Opus 4+', async () => {
    mockFetchResponse({ body: { content: [{ text: 'A', type: 'text' }] } });
    const provider = anthropicProvider({ apiKey: 'k', model: 'claude-opus-4-5' });
    const res = await provider.run(INPUT);
    expect(res.requestParams).not.toHaveProperty('temperature');
  });

  it('envia temperature para modelos fora da família Opus 4+', async () => {
    mockFetchResponse({ body: { content: [{ text: 'A', type: 'text' }] } });
    const provider = anthropicProvider({ apiKey: 'k', model: 'claude-sonnet-4-6' });
    const res = await provider.run(INPUT);
    expect(res.requestParams).toHaveProperty('temperature', 0);
  });
});

describe('openAiProvider', () => {
  it('lança com status e corpo quando a API retorna !ok', async () => {
    mockFetchResponse({ ok: false, status: 500, text: 'oops' });
    const provider = openAiProvider({ apiKey: 'k', model: 'gpt-4o' });
    await expect(provider.run(INPUT)).rejects.toThrow(/OpenAI API erro 500.*oops/);
  });

  it('usa max_completion_tokens para reasoning models', async () => {
    mockFetchResponse({ body: { choices: [{ message: { content: 'A' } }] } });
    const provider = openAiProvider({ apiKey: 'k', model: 'gpt-5.1' });
    const res = await provider.run(INPUT);
    expect(res.requestParams).toHaveProperty('max_completion_tokens');
    expect(res.requestParams).not.toHaveProperty('max_tokens');
  });

  it('usa max_tokens para GPT-4 (legado)', async () => {
    mockFetchResponse({ body: { choices: [{ message: { content: 'A' } }] } });
    const provider = openAiProvider({ apiKey: 'k', model: 'gpt-4o' });
    const res = await provider.run(INPUT);
    expect(res.requestParams).toHaveProperty('max_tokens');
    expect(res.requestParams).not.toHaveProperty('max_completion_tokens');
  });

  it('omite temperature para gpt-5-nano e família o1/o3', async () => {
    mockFetchResponse({ body: { choices: [{ message: { content: 'A' } }] } });
    for (const model of ['gpt-5-nano', 'gpt-5-mini', 'o1-preview', 'o3-mini']) {
      const provider = openAiProvider({ apiKey: 'k', model });
      const res = await provider.run(INPUT);
      expect(res.requestParams).not.toHaveProperty('temperature');
    }
  });
});

describe('googleProvider', () => {
  it('lança com status e corpo quando a API retorna !ok', async () => {
    mockFetchResponse({ ok: false, status: 403, text: 'forbidden' });
    const provider = googleProvider({ apiKey: 'k', model: 'gemini-2.5-pro' });
    await expect(provider.run(INPUT)).rejects.toThrow(/Google API erro 403.*forbidden/);
  });

  it('retorna rawResponse vazia quando candidates[0].content está ausente', async () => {
    // Caso real: Gemini com safety filter retorna candidates[] sem `content`.
    // O provider deve retornar string vazia sem crash.
    mockFetchResponse({
      body: { candidates: [{ finishReason: 'SAFETY' }] },
    });
    const provider = googleProvider({ apiKey: 'k', model: 'gemini-2.5-pro' });
    const res = await provider.run(INPUT);
    expect(res.rawResponse).toBe('');
  });

  it('retorna rawResponse vazia quando o body não tem candidates', async () => {
    mockFetchResponse({ body: {} });
    const provider = googleProvider({ apiKey: 'k', model: 'gemini-2.5-pro' });
    const res = await provider.run(INPUT);
    expect(res.rawResponse).toBe('');
  });
});

describe('openAiCompatProvider', () => {
  it('omite header Authorization quando apiKey não é fornecida', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'A' } }] }),
      ok: true,
      status: 200,
      text: async () => '',
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const provider = openAiCompatProvider({
      baseUrl: 'http://localhost:11434/v1',
      model: 'qwen:latest',
      provider: 'Ollama',
    });
    await provider.run(INPUT);

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers).not.toHaveProperty('authorization');
  });

  it('inclui Authorization quando apiKey é fornecida', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'A' } }] }),
      ok: true,
      status: 200,
      text: async () => '',
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const provider = openAiCompatProvider({
      apiKey: 'sk-xyz',
      baseUrl: 'https://api.together.xyz/v1',
      model: 'meta-llama/Llama-3-70b',
      provider: 'Together AI',
    });
    await provider.run(INPUT);

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-xyz');
  });

  it('propaga nome do provider no erro', async () => {
    mockFetchResponse({ ok: false, status: 502, text: 'bad gateway' });
    const provider = openAiCompatProvider({
      baseUrl: 'http://localhost:11434/v1',
      model: 'qwen:latest',
      provider: 'Ollama',
    });
    await expect(provider.run(INPUT)).rejects.toThrow(/Ollama API erro 502.*bad gateway/);
  });

  it('normaliza trailing slash no baseUrl', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'A' } }] }),
      ok: true,
      status: 200,
      text: async () => '',
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const provider = openAiCompatProvider({
      baseUrl: 'http://localhost:11434/v1/',
      model: 'qwen:latest',
      provider: 'Ollama',
    });
    await provider.run(INPUT);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/v1/chat/completions');
  });
});
