import type { Question } from '@precisa-saude/medbench-dataset';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { observeRequest } from '../src/accounting.js';
import { anthropicProvider } from '../src/providers/anthropic.js';
import { googleProvider } from '../src/providers/google.js';
import { openAiProvider } from '../src/providers/openai.js';
import { openAiCompatProvider } from '../src/providers/openai-compat.js';
import { systemOneProvider } from '../src/providers/systemone.js';

const question: Question = {
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
const input = { question, systemPrompt: 'sys', userPrompt: 'user' };
const chat = {
  choices: [{ message: { content: 'A' } }],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 21,
    completion_tokens_details: { reasoning_tokens: 20 },
  },
  model: 'snapshot',
  id: 'response-1',
};
const cases = [
  {
    name: 'OpenAI',
    provider: () => openAiProvider({ apiKey: 'secret', model: 'gpt-5.4' }),
    body: chat,
  },
  {
    name: 'compat',
    provider: () =>
      openAiCompatProvider({
        apiKey: 'secret',
        model: 'model',
        provider: 'Router',
        baseUrl: 'https://example.org/v1',
      }),
    body: { ...chat, provider: 'Upstream' },
  },
  {
    name: 'Anthropic',
    provider: () => anthropicProvider({ apiKey: 'secret', model: 'claude-opus-5' }),
    body: {
      content: [{ type: 'text', text: 'A' }],
      model: 'snapshot',
      id: 'response-1',
      usage: { input_tokens: 10, output_tokens: 21 },
    },
  },
  {
    name: 'Google',
    provider: () => googleProvider({ apiKey: 'secret', model: 'gemini' }),
    body: {
      candidates: [{ content: { parts: [{ text: 'A' }] } }],
      modelVersion: 'snapshot',
      responseId: 'response-1',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 1,
        thoughtsTokenCount: 20,
        totalTokenCount: 31,
      },
    },
  },
  {
    name: 'SystemOne',
    provider: () =>
      systemOneProvider({
        apiKey: 'secret',
        model: 'jev',
        provider: 'Router',
        baseUrl: 'https://example.org',
        path: '/decisions',
      }),
    body: {
      answers: { resposta: { choice: 'A' } },
      model: 'snapshot',
      id: 'response-1',
      usage: { prompt_tokens: 10, completion_tokens: 21 },
    },
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each(cases)('consumo do provider $name', ({ provider, body }) => {
  it('propaga tokens e identidade sem modificar a requisição', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        headers: { 'request-id': 'http-request-1' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const response = await provider().run(input);
    expect(response.usage).toMatchObject({ inputTokens: 10, outputTokens: 21 });
    expect(response.responseMetadata).toMatchObject({
      resolvedModel: 'snapshot',
      responseId: 'response-1',
      requestId: 'http-request-1',
    });
    const request = JSON.parse(fetch.mock.calls[0]![1].body);
    expect(request).toEqual(
      response.requestParams.model === 'gemini'
        ? Object.fromEntries(
            Object.entries(response.requestParams).filter(([key]) => key !== 'model'),
          )
        : response.requestParams,
    );
    for (const key of [
      'usage',
      'usageMetadata',
      'tools',
      'tool_choice',
      'connectors',
      'web_search_options',
    ]) {
      expect(request).not.toHaveProperty(key);
    }
    expect(JSON.stringify(response.responseMetadata)).not.toContain('secret');
  });

  it('continua funcionando quando usage é omitido', async () => {
    const noUsage = { ...body, usage: undefined, usageMetadata: undefined };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(noUsage))));
    expect((await provider().run(input)).usage).toBeUndefined();
  });

  it('preserva consumo retornado em erro HTTP no ledger', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 503 })),
    );
    const sink = vi.fn();
    await expect(
      observeRequest(provider(), input, { attempt: 1, purpose: 'eval', run: 1, runId: 'r' }, sink),
    ).rejects.toThrow(/API erro 503/);
    expect(sink.mock.calls[0]![0]).toMatchObject({
      outcome: 'error',
      usage: { inputTokens: 10, outputTokens: 21 },
    });
  });

  it('erros sem JSON não inventam consumo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('upstream failed', { status: 503 })),
    );
    const sink = vi.fn();
    await expect(
      observeRequest(provider(), input, { attempt: 1, purpose: 'smoke', run: 1, runId: 'r' }, sink),
    ).rejects.toThrow(/upstream failed/);
    expect(sink.mock.calls[0]![0]).not.toHaveProperty('usage');
  });
});
