import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEdition } from '@precisa-saude/medbench-dataset';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountingPersistenceError, observeRequest } from '../src/accounting.js';
import { createRequestLedger } from '../src/cli/accounting.js';
import { ProviderHttpError } from '../src/providers/_usage.js';
import { rescoreFromRaw, rescoreFromScored } from '../src/rescore.js';
import { runEvaluation } from '../src/runner.js';
import type { Provider, RawResponseRecord, RequestAttemptRecord } from '../src/types.js';

const edition = loadEdition('revalida-2025-1');
const eligible = edition.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
const question = eligible[0]!;
const usage = { inputTokens: 10, outputTokens: 4, reasoningTokens: 3 };
const provider: Provider = {
  id: 'mock',
  label: 'Mock',
  provider: 'Mock',
  trainingCutoff: undefined,
  run: async () => ({
    parsedAnswer: 'A',
    rawResponse: 'A',
    requestParams: {},
    timings: { durationMs: 1 },
    usage,
  }),
};
const config = {
  editions: [edition.id],
  excludeImages: true,
  excludeTables: true,
  runsPerQuestion: 1,
};
const input = { question, systemPrompt: 'sys', userPrompt: 'user' };
const context = { attempt: 1, purpose: 'smoke' as const, run: 1, runId: 'run-1' };
const dirs: string[] = [];
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'medbench-usage-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('observação por tentativa', () => {
  it('sucesso recebe UUID, contexto e consumo, sem mudar a entrada', async () => {
    const sink = vi.fn();
    const run = vi.fn(provider.run);
    const response = await observeRequest({ ...provider, run }, input, context, sink);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(input);
    expect(response.attemptId).toMatch(/^[a-f0-9-]{36}$/);
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        ...context,
        usage,
        outcome: 'success',
        attemptId: response.attemptId,
        startedAt: response.startedAt,
      }),
    );
    await expect(observeRequest(provider, input, context)).resolves.toHaveProperty('usage', usage);
  });

  it('registra metadata sem incluir segredos ou mensagem de erro', async () => {
    const sink = vi.fn();
    const failing = {
      ...provider,
      run: async () => {
        throw new ProviderHttpError('secret error', {
          usage,
          responseMetadata: { endpoint: 'https://example.org', responseId: 'failed-1' },
        });
      },
    };
    await expect(observeRequest(failing, input, context, sink)).rejects.toThrow('secret error');
    expect(sink.mock.calls[0]![0]).toMatchObject({
      outcome: 'error',
      usage,
      errorType: 'ProviderHttpError',
      responseMetadata: { responseId: 'failed-1' },
    });
    expect(JSON.stringify(sink.mock.calls)).not.toContain('secret error');
  });

  it('erro sem usage não inventa custo', async () => {
    const sink = vi.fn();
    await expect(
      observeRequest(
        {
          ...provider,
          run: vi.fn().mockRejectedValue('network'),
        },
        input,
        context,
        sink,
      ),
    ).rejects.toBe('network');
    expect(sink.mock.calls[0]![0]).toMatchObject({ outcome: 'error', errorType: 'unknown' });
    expect(sink.mock.calls[0]![0]).not.toHaveProperty('usage');
  });

  it.each([true, false])(
    'falha de persistência interrompe (provider sucede=%s)',
    async (succeeds) => {
      const p = succeeds
        ? provider
        : {
            ...provider,
            run: async () => {
              throw new Error('fetch failed');
            },
          };
      await expect(
        observeRequest(p, input, context, () => {
          throw new Error('ECONNRESET disk');
        }),
      ).rejects.toBeInstanceOf(AccountingPersistenceError);
    },
  );
});

describe('runner, resume e rescore', () => {
  it('resume agrega usage uma vez; nova invocação sem chamadas não gera gasto novo', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const raw: RawResponseRecord[] = [];
    const attempts: RequestAttemptRecord[] = [];
    const run = vi.fn(provider.run);
    const result = await runEvaluation(
      { ...provider, run },
      { ...config, onRawResponse: (r) => raw.push(r), onRequestAttempt: (a) => attempts.push(a) },
    );
    expect(result.usage).toMatchObject({
      inputTokens: eligible.length * 10,
      outputTokens: eligible.length * 4,
      callsWithUsage: eligible.length,
      maxInputTokensPerCall: 10,
      totalCalls: eligible.length,
    });
    expect(raw[0]).toMatchObject({
      usage,
      attemptId: attempts[0]!.attemptId,
      runId: attempts[0]!.runId,
    });
    const nextSink = vi.fn();
    run.mockClear();
    const resumed = await runEvaluation(
      { ...provider, run },
      { ...config, priorRecords: [...raw, raw[0]!], onRequestAttempt: nextSink },
    );
    expect(resumed.usage).toEqual(result.usage);
    expect(run).not.toHaveBeenCalled();
    expect(nextSink).not.toHaveBeenCalled();

    const dir = tempDir();
    const path = join(dir, 'raw.jsonl');
    writeFileSync(path, raw.map((r) => JSON.stringify(r)).join('\n'));
    const rescored = rescoreFromRaw({
      editionId: edition.id,
      modelId: 'mock',
      rawLogPath: path,
      runsPerQuestion: 1,
      trainingCutoff: undefined,
    });
    expect(rescored.usage).toEqual(result.usage);
    const scoredPath = join(dir, 'scored.json');
    writeFileSync(scoredPath, JSON.stringify(rescored));
    expect(rescoreFromScored(scoredPath).usage).toEqual(result.usage);
  });

  it('resume parcial reporta lacuna de usage dos registros antigos', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const prior: RawResponseRecord[] = [];
    await runEvaluation(provider, { ...config, onRawResponse: (r) => prior.push(r) });
    const first = { ...prior[0]!, usage: undefined };
    const result = await runEvaluation(provider, { ...config, priorRecords: [first] });
    expect(result.usage).toMatchObject({
      callsWithUsage: eligible.length - 1,
      totalCalls: eligible.length,
    });
    expect(result.usage).not.toHaveProperty('maxInputTokensPerCall');
  });

  it('registra retries sem somar erro à usage do score', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const attempts: RequestAttemptRecord[] = [];
    let calls = 0;
    const p = {
      ...provider,
      run: async () => {
        calls++;
        if (calls === 1)
          throw new ProviderHttpError('Mock API erro 503', {
            usage,
            responseMetadata: { endpoint: 'https://example.org' },
          });
        return provider.run(input);
      },
    };
    const promise = runEvaluation(p, { ...config, onRequestAttempt: (a) => attempts.push(a) });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(attempts).toHaveLength(eligible.length + 1);
    expect(attempts.filter((a) => a.attempt === 2)).toHaveLength(1);
    expect(new Set(attempts.map((a) => a.attemptId)).size).toBe(attempts.length);
    expect(result.usage?.callsWithUsage).toBe(eligible.length);
  });

  it('não retenta falha do ledger mesmo com causa parecida com rede', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn(provider.run);
    await expect(
      runEvaluation(
        { ...provider, run },
        {
          ...config,
          onRequestAttempt: () => {
            throw new Error('fetch failed');
          },
        },
      ),
    ).rejects.toBeInstanceOf(AccountingPersistenceError);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('falha de auditoria interrompe novas questões nos demais workers', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn(provider.run);
    await expect(
      runEvaluation(
        { ...provider, run },
        {
          ...config,
          concurrency: 4,
          onRequestAttempt: () => {
            throw new Error('disk full');
          },
        },
      ),
    ).rejects.toBeInstanceOf(AccountingPersistenceError);
    expect(run).toHaveBeenCalledTimes(4);
  });

  it('falha fatal cancela retries que estavam esperando backoff', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const run = vi.fn(provider.run).mockRejectedValueOnce(new Error('Mock API erro 503'));
    const promise = runEvaluation(
      { ...provider, run },
      {
        ...config,
        concurrency: 2,
        onRequestAttempt: (record) => {
          if (record.outcome === 'success') throw new Error('disk full');
        },
      },
    ).catch((error: unknown) => error);
    await vi.runAllTimersAsync();
    expect(await promise).toBeInstanceOf(AccountingPersistenceError);
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe('ledger CLI', () => {
  it('smoke/restart mantêm tentativas anteriores e UUID de execução novo', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const dir = tempDir();
    const first = createRequestLedger(dir, edition.id, provider, 'smoke');
    await observeRequest(
      provider,
      input,
      { ...context, runId: first.runId },
      first.onRequestAttempt,
    );
    first.printSummary();
    const second = createRequestLedger(dir, edition.id, provider, 'smoke');
    expect(second.runId).not.toBe(first.runId);
    second.printSummary();
    await observeRequest(
      provider,
      input,
      { ...context, runId: second.runId },
      second.onRequestAttempt,
    );
    second.printSummary();
    const lines = readFileSync(join(dir, edition.id, 'mock.smoke.requests.jsonl'), 'utf8')
      .trim()
      .split('\n');
    expect(lines).toHaveLength(2);
    expect(log.mock.calls.flat().join(' ')).toContain('cobertura 1/1');
    expect(log.mock.calls.flat().join(' ')).toContain('0 tentativa(s)');
  });
});
