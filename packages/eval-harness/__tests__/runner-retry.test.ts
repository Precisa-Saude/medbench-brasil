/**
 * Tests para runEvaluation + isRetryable + runWithRetry.
 *
 * Os helpers isRetryable/runWithRetry são internos ao runner.ts; a gente
 * exercita indiretamente via runEvaluation com um Provider mock que simula
 * falhas retriáveis e respostas determinísticas. Vitest fake timers
 * aceleram os backoffs (1s/3s/10s → instantâneos).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runEvaluation } from '../src/runner.js';
import type { Provider, ProviderResponse } from '../src/types.js';

beforeEach(() => {
  vi.useFakeTimers();
  // Silencia os console.log/warn do runner durante os tests.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function makeProvider(
  overrides: Partial<Provider> & {
    run?: (input: Parameters<Provider['run']>[0]) => Promise<ProviderResponse>;
  } = {},
): Provider {
  return {
    id: 'mock-model',
    label: 'Mock Model',
    provider: 'Mock',
    run: async () => ({
      parsedAnswer: 'A',
      rawResponse: 'A',
      requestParams: {},
      timings: { durationMs: 1 },
    }),
    trainingCutoff: '2024-01-01',
    ...overrides,
  };
}

describe('runEvaluation — happy path', () => {
  it('escora a edição completa com provider determinístico', async () => {
    const provider = makeProvider();
    const promise = runEvaluation(provider, {
      concurrency: 4,
      editions: ['revalida-2025-1'],
      excludeImages: true,
      excludeTables: true,
      runsPerQuestion: 1,
    });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.modelId).toBe('mock-model');
    expect(result.runsPerQuestion).toBe(1);
    expect(result.perQuestion?.length).toBeGreaterThan(0);
  });

  it('respeita priorRecords (resume) sem chamar o provider pra runs já feitos', async () => {
    const runSpy = vi.fn().mockResolvedValue({
      parsedAnswer: 'B',
      rawResponse: 'B',
      requestParams: {},
      timings: { durationMs: 1 },
    });
    const provider = makeProvider({ run: runSpy });
    // Constrói prior record para TODAS as questões → provider.run não deve
    // ser chamado nenhuma vez.
    const { loadEdition } = await import('@precisa-saude/medbench-dataset');
    const edition = loadEdition('revalida-2025-1');
    const priorRecords = edition.questions
      .filter((q) => !q.annulled && !q.hasImage && !q.hasTable)
      .map((q) => ({
        correct: false,
        editionId: 'revalida-2025-1',
        modelId: 'mock-model',
        parsed: 'A' as const,
        questionId: q.id,
        run: 1,
      }));
    const promise = runEvaluation(provider, {
      concurrency: 1,
      editions: ['revalida-2025-1'],
      excludeImages: true,
      excludeTables: true,
      priorRecords,
      runsPerQuestion: 1,
    });
    await vi.runAllTimersAsync();
    await promise;
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('grava raw records via onRawResponse quando fornecido', async () => {
    const onRawResponse = vi.fn();
    const provider = makeProvider();
    const promise = runEvaluation(provider, {
      concurrency: 1,
      editions: ['revalida-2025-1'],
      excludeImages: true,
      excludeTables: true,
      onRawResponse,
      runsPerQuestion: 1,
    });
    await vi.runAllTimersAsync();
    await promise;
    expect(onRawResponse).toHaveBeenCalled();
    const call = onRawResponse.mock.calls[0]![0];
    expect(call.modelId).toBe('mock-model');
    expect(call.run).toBe(1);
    expect(call.editionId).toBe('revalida-2025-1');
  });
});

describe('runEvaluation — retry behavior', () => {
  it('retenta erros retriáveis (ECONNRESET) e eventualmente sucede', async () => {
    let attempts = 0;
    const provider = makeProvider({
      async run() {
        attempts++;
        if (attempts === 1) {
          const err = new Error('fetch failed');
          Object.assign(err, { cause: new Error('read ECONNRESET') });
          throw err;
        }
        return {
          parsedAnswer: 'C',
          rawResponse: 'C',
          requestParams: {},
          timings: { durationMs: 1 },
        };
      },
    });
    // Roda uma edição pequena limitada a poucas questões seria melhor, mas
    // o runner não suporta esse filtro — usamos concurrency 1 + priorRecords
    // para deixar só uma questão viva.
    const { loadEdition } = await import('@precisa-saude/medbench-dataset');
    const edition = loadEdition('revalida-2025-1');
    const live = edition.questions.find((q) => !q.annulled && !q.hasImage && !q.hasTable)!;
    const priorRecords = edition.questions
      .filter((q) => !q.annulled && !q.hasImage && !q.hasTable && q.id !== live.id)
      .map((q) => ({
        correct: false,
        editionId: 'revalida-2025-1',
        modelId: 'mock-model',
        parsed: 'A' as const,
        questionId: q.id,
        run: 1,
      }));
    const promise = runEvaluation(provider, {
      concurrency: 1,
      editions: ['revalida-2025-1'],
      excludeImages: true,
      excludeTables: true,
      priorRecords,
      runsPerQuestion: 1,
    });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(attempts).toBe(2);
    expect(result.perQuestion?.length).toBeGreaterThan(0);
  });

  it('propaga erros não-retriáveis (TypeError genérico) imediatamente', async () => {
    const provider = makeProvider({
      async run() {
        throw new Error('contrato de resposta inválido');
      },
    });
    // Attach .catch imediatamente pra não gerar unhandled rejection enquanto
    // o vi.runAllTimersAsync avança timers pendentes de outros workers.
    const captured = runEvaluation(provider, {
      concurrency: 1,
      editions: ['revalida-2025-1'],
      excludeImages: true,
      excludeTables: true,
      runsPerQuestion: 1,
    }).catch((e: unknown) => e as Error);
    await vi.runAllTimersAsync();
    const err = await captured;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(/contrato de resposta inválido/);
  });
});
