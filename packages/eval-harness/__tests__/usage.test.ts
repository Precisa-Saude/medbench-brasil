import { describe, expect, it } from 'vitest';

import { normalizeUsage, responseAccounting } from '../src/providers/_usage.js';
import { isTokenUsage, summarizeUsage } from '../src/usage.js';

describe('normalização de usage', () => {
  it('OpenAI inclui reasoning na saída, sem somar novamente', () => {
    expect(
      normalizeUsage('openai', {
        completion_tokens: 101,
        completion_tokens_details: { reasoning_tokens: 100 },
        prompt_tokens: 50,
        prompt_tokens_details: { cached_tokens: 20, cache_write_tokens: 5 },
        total_tokens: 151,
        cost: 500,
      }),
    ).toEqual({
      inputTokens: 50,
      outputTokens: 101,
      reasoningTokens: 100,
      cacheReadInputTokens: 20,
      cacheWriteInputTokens: 5,
      totalTokens: 151,
    });
  });

  it('Anthropic soma cache à entrada, sem duplicar TTLs', () => {
    expect(
      normalizeUsage('anthropic', {
        input_tokens: 20,
        output_tokens: 50,
        cache_read_input_tokens: 80,
        cache_creation_input_tokens: 40,
        cache_creation: { ephemeral_5m_input_tokens: 10, ephemeral_1h_input_tokens: 30 },
      }),
    ).toEqual({
      inputTokens: 140,
      outputTokens: 50,
      cacheReadInputTokens: 80,
      cacheWriteInputTokens: 40,
      cacheWrite5mInputTokens: 10,
      cacheWrite1hInputTokens: 30,
    });
  });

  it('Anthropic sem cache não inventa breakdown ou reasoning', () => {
    expect(normalizeUsage('anthropic', { input_tokens: 20, output_tokens: 50 })).toEqual({
      inputTokens: 20,
      outputTokens: 50,
    });
  });

  it('Google inclui pensamentos na saída, cache é subconjunto da entrada', () => {
    expect(
      normalizeUsage('google', {
        promptTokenCount: 50,
        candidatesTokenCount: 1,
        thoughtsTokenCount: 100,
        totalTokenCount: 151,
        cachedContentTokenCount: 20,
      }),
    ).toEqual({
      inputTokens: 50,
      outputTokens: 101,
      reasoningTokens: 100,
      totalTokens: 151,
      cacheReadInputTokens: 20,
    });
  });

  it('Google usa contadores separados quando não há total', () => {
    expect(
      normalizeUsage('google', {
        promptTokenCount: 50,
        candidatesTokenCount: 1,
        thoughtsTokenCount: 100,
      }),
    ).toEqual({ inputTokens: 50, outputTokens: 101, reasoningTokens: 100 });
    expect(normalizeUsage('google', { promptTokenCount: 50, candidatesTokenCount: 1 })).toEqual({
      inputTokens: 50,
      outputTokens: 1,
    });
  });

  it('Google preserva consumo de resposta filtrada sem candidates', () => {
    expect(normalizeUsage('google', { promptTokenCount: 50, totalTokenCount: 50 })).toEqual({
      inputTokens: 50,
      outputTokens: 0,
      totalTokens: 50,
    });
  });

  it.each([
    undefined,
    null,
    [],
    'x',
    {},
    { prompt_tokens: 10 },
    { prompt_tokens: -1, completion_tokens: 1 },
    { prompt_tokens: 1, completion_tokens: '2' },
    { prompt_tokens: 1.5, completion_tokens: 2 },
    { prompt_tokens: NaN, completion_tokens: 2 },
  ])('não transforma usage inválido/ausente em zero: %j', (value) => {
    expect(normalizeUsage('openai', value)).toBeUndefined();
  });

  it('rejeita usage incompleto de Anthropic e Google', () => {
    expect(
      normalizeUsage('anthropic', {
        input_tokens: 2,
        output_tokens: 1,
        cache_read_input_tokens: -1,
      }),
    ).toBeUndefined();
    expect(normalizeUsage('anthropic', { input_tokens: 2 })).toBeUndefined();
    expect(normalizeUsage('google', { candidatesTokenCount: 2 })).toBeUndefined();
    expect(normalizeUsage('google', { promptTokenCount: 2 })).toBeUndefined();
    expect(normalizeUsage('google', { promptTokenCount: 10, totalTokenCount: 1 })).toBeUndefined();
  });

  it('zero explícito é diferente de ausência', () => {
    expect(
      normalizeUsage('openai', {
        prompt_tokens: 0,
        completion_tokens: 0,
        prompt_tokens_details: { cached_tokens: 0 },
      }),
    ).toEqual({ inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0 });
  });
});

describe('agregação de usage', () => {
  it('valida limites e contadores opcionais antes de agregar raws', () => {
    for (const value of [
      null,
      'text',
      {},
      { inputTokens: 1, outputTokens: -1 },
      { inputTokens: 1, outputTokens: 2, reasoningTokens: 3 },
      { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 2 },
      { inputTokens: 1, outputTokens: 2, totalTokens: NaN },
    ]) {
      expect(isTokenUsage(value)).toBe(false);
    }
    expect(summarizeUsage([{ usage: { inputTokens: -1, outputTokens: 2 } }])).toBeUndefined();
  });
  it('sem usage permanece desconhecido', () => {
    expect(summarizeUsage([])).toBeUndefined();
    expect(summarizeUsage([{}, {}])).toBeUndefined();
  });
  it('reporta cobertura parcial e não mascara detalhes ausentes', () => {
    expect(
      summarizeUsage([
        { usage: { inputTokens: 10, outputTokens: 2, reasoningTokens: 1 } },
        {},
        { usage: { inputTokens: 20, outputTokens: 3 } },
      ]),
    ).toEqual({ inputTokens: 30, outputTokens: 5, callsWithUsage: 2, totalCalls: 3 });
  });
  it('soma detalhes completos inclusive zero', () => {
    const usage = {
      inputTokens: 10,
      outputTokens: 2,
      reasoningTokens: 0,
      cacheReadInputTokens: 1,
      cacheWriteInputTokens: 2,
      cacheWrite5mInputTokens: 2,
      cacheWrite1hInputTokens: 0,
      totalTokens: 12,
    };
    expect(summarizeUsage([{ usage }, { usage }])).toEqual({
      inputTokens: 20,
      outputTokens: 4,
      reasoningTokens: 0,
      cacheReadInputTokens: 2,
      cacheWriteInputTokens: 4,
      cacheWrite5mInputTokens: 4,
      cacheWrite1hInputTokens: 0,
      totalTokens: 24,
      callsWithUsage: 2,
      totalCalls: 2,
    });
  });
});

describe('metadata de resposta', () => {
  it('sanitiza rota e captura somente campos conhecidos', () => {
    const response = new Response('{}', { headers: { 'x-request-id': 'req-1' } });
    const captured = responseAccounting(
      response,
      {
        id: 'gen-1',
        model: 'resolved',
        provider: 'upstream',
        service_tier: 'flex',
        secret: 'never-log',
      },
      'openai',
      'https://user:password@example.org/v1/chat/completions?key=secret#fragment',
    );
    expect(JSON.parse(JSON.stringify(captured))).toEqual({
      responseMetadata: {
        endpoint: 'https://example.org/v1/chat/completions',
        requestId: 'req-1',
        responseId: 'gen-1',
        resolvedModel: 'resolved',
        provider: 'upstream',
        serviceTier: 'flex',
      },
    });
  });
  it('metadata Google e headers opcionais', () => {
    const captured = responseAccounting(
      new Response(),
      {
        responseId: 'g-1',
        modelVersion: 'gemini-snapshot',
        usageMetadata: { serviceTier: 'standard' },
      },
      'google',
      'https://example.org/generateContent',
    );
    expect(captured.responseMetadata).toMatchObject({
      responseId: 'g-1',
      resolvedModel: 'gemini-snapshot',
      serviceTier: 'standard',
    });
    expect(
      responseAccounting(new Response(), null, 'openai', 'http://localhost:8000/v1').usage,
    ).toBeUndefined();
  });
});
