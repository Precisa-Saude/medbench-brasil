import type { Question } from '@precisa-saude/medbench-dataset';
import { afterEach, expect, it, vi } from 'vitest';

import { SYSTEM_PROMPT } from '../src/prompt.js';
import { anthropicProvider } from '../src/providers/anthropic.js';
import { googleProvider } from '../src/providers/google.js';
import { openAiProvider } from '../src/providers/openai.js';

afterEach(() => vi.unstubAllGlobals());

it.each([
  ['gpt-6.1-terra', openAiProvider, { max_completion_tokens: 8192, reasoning_effort: 'high' }],
  ['gpt-5.4', openAiProvider, { max_completion_tokens: 8192, temperature: 0 }],
  ['claude-haiku-5-5', anthropicProvider, { max_tokens: 8192, output_config: { effort: 'high' } }],
  ['claude-haiku-4-5', anthropicProvider, { max_tokens: 1024, temperature: 0 }],
  [
    'gemini-4-argon',
    googleProvider,
    { generationConfig: { maxOutputTokens: 32768, thinkingConfig: { thinkingLevel: 'HIGH' } } },
  ],
  [
    'gemini-2.5-pro',
    googleProvider,
    { generationConfig: { maxOutputTokens: 8192, temperature: 0 } },
  ],
] as const)('preserva protocolo e parâmetros de %s', async (model, factory, expected) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers(),
    json: async () => ({
      choices: [{ finish_reason: 'stop', message: { content: 'A' } }],
      content: [{ type: 'text', text: 'A' }],
      candidates: [{ content: { parts: [{ text: 'A' }] }, finishReason: 'STOP' }],
    }),
  });
  vi.stubGlobal('fetch', fetchMock);
  const provider = factory({ apiKey: 'test', model });
  const response = await provider.run({
    question: {} as Question,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: 'Questão única',
  });
  const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
  expect(body).toMatchObject(expected);
  const { generationConfig, ...params } = expected as Record<string, unknown>;
  if (!('temperature' in params)) expect(body).not.toHaveProperty('temperature');
  expect(body).not.toHaveProperty('tools');
  expect(body).not.toHaveProperty('thinking');
  if (factory === googleProvider) {
    expect(body).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'Questão única' }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig,
    });
    expect(response.stopReason).toBe('STOP');
  } else if (factory === openAiProvider) {
    expect(response.stopReason).toBe('stop');
    expect(body).toEqual({
      ...expected,
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Questão única' },
      ],
    });
  } else {
    expect(body).toEqual({
      ...expected,
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Questão única' }],
    });
  }
  expect(response.requestParams).toEqual({ ...body, model });
});

it('registra motivo de bloqueio do Google sem conteúdo', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
    }),
  );
  const response = await googleProvider({ apiKey: 'test', model: 'gemini-4-argon' }).run({
    question: {} as Question,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: 'Questão única',
  });
  expect(response.rawResponse).toBe('');
  expect(response.stopReason).toBe('MAX_TOKENS');
});
