// Lote autorizado de seis avaliações. Nunca reaproveita os pilotos.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { loadEdition } from '../../dataset/dist/index.js';
import {
  anthropicProvider,
  isRawCoverageComplete,
  openAiCompatProvider,
  partitionRawRecords,
  runEvaluation,
} from '../dist/index.js';

const editions = ['revalida-2025-2', 'revalida-2026-1'];
const providers = () => [
  openAiCompatProvider({
    model: 'openai/gpt-6.1-terra',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    provider: 'OpenRouter',
    reasoningEffort: 'high',
    maxTokens: 8192,
    timeoutMs: 300_000,
    trainingCutoff: '2026-06-01',
  }),
  anthropicProvider({ model: 'claude-haiku-5-5', maxTokens: 8192, timeoutMs: 180_000 }),
  openAiCompatProvider({
    model: 'google/gemini-4-argon',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    provider: 'OpenRouter',
    reasoningEffort: 'high',
    maxTokens: 32768,
    timeoutMs: 900_000,
  }),
];
const dryRun = process.argv.includes('--dry-run');
if (!dryRun) {
  assert(
    process.argv[2] && !process.argv[2].startsWith('--'),
    'Informe o caminho do ambiente local.',
  );
  createRequire(new URL('../package.json', import.meta.url))('dotenv').config({
    path: process.argv[2],
    quiet: true,
  });
  for (const key of ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY'])
    assert(process.env[key], `Credencial ausente: ${key}`);
}
const jobs = providers().flatMap((provider) =>
  editions.map((editionId) => {
    const eligible = loadEdition(editionId).questions.filter(
      (q) => !q.annulled && !q.hasImage && !q.hasTable,
    );
    const dir = fileURLToPath(new URL(`../../../results/${editionId}/`, import.meta.url));
    const base = `${dir}${provider.id.replace(/[^a-z0-9.-]/gi, '_')}`;
    return {
      provider,
      editionId,
      eligible,
      rawPath: `${base}.raw.jsonl`,
      ledgerPath: `${base}.eval.requests.jsonl`,
      scorePath: `${base}.json`,
    };
  }),
);
console.log(
  JSON.stringify({
    mode: dryRun ? 'dry-run' : 'eval',
    jobs: jobs.map((j) => ({
      model: j.provider.id,
      edition: j.editionId,
      calls: j.eligible.length * 3,
    })),
  }),
);
if (dryRun) process.exit(0);

// Preflight de todos os arquivos antes de qualquer chamada paga.
for (const job of jobs) {
  assert(!existsSync(job.scorePath), `Score existente: ${job.scorePath}`);
  assert(
    !existsSync(job.rawPath) && !existsSync(job.ledgerPath),
    'Lote já iniciado; retomada exige revisão explícita dos logs.',
  );
}
for (const job of jobs) {
  writeFileSync(job.rawPath, '', { flag: 'wx' });
  writeFileSync(job.ledgerPath, '', { flag: 'wx' });
}
const append = (path, value) => appendFileSync(path, `${JSON.stringify(value)}\n`);
const outcomes = await Promise.allSettled(
  jobs.map(async (job) => {
    const runId = randomUUID();
    const result = await runEvaluation(job.provider, {
      editions: [job.editionId],
      concurrency: 3,
      runsPerQuestion: 3,
      excludeImages: true,
      excludeTables: true,
      runId,
      onRequestAttempt: (record) => append(job.ledgerPath, record),
      onRawResponse: (record) => {
        append(job.rawPath, record);
        if (!record.parsed || !['stop', 'end_turn'].includes(record.stopReason))
          throw new Error('Resposta sem parsing ou parada normal; revisar raw antes de continuar.');
        assert.equal(
          record.responseMetadata?.resolvedModel,
          job.provider.id,
          'Identidade resolvida diferente da solicitada.',
        );
      },
    });
    const rows = readFileSync(job.rawPath, 'utf8').trim().split('\n').map(JSON.parse);
    const ledger = readFileSync(job.ledgerPath, 'utf8').trim().split('\n').map(JSON.parse);
    const { accepted, coverage } = partitionRawRecords({
      editionId: job.editionId,
      records: rows,
      eligibleQuestionIds: job.eligible.map((q) => q.id),
      runsPerQuestion: 3,
      malformedLines: 0,
    });
    assert(isRawCoverageComplete(coverage));
    assert(Object.values(coverage.exclusions).every((n) => n === 0));
    assert.equal(accepted.length, job.eligible.length * 3);
    const success = ledger.filter((x) => x.outcome === 'success');
    assert.equal(success.length, accepted.length);
    const attemptIds = new Set(success.map((x) => x.attemptId));
    assert.equal(attemptIds.size, success.length);
    assert(rows.every((row) => attemptIds.has(row.attemptId)));
    assert.equal(result.total, job.eligible.length * 3);
    writeFileSync(job.scorePath, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(
      JSON.stringify({
        completed: job.provider.id,
        editionId: job.editionId,
        accuracy: result.accuracy,
        ci95: result.ci95,
        usage: result.usage,
      }),
    );
  }),
);
for (const [i, outcome] of outcomes.entries()) {
  if (outcome.status === 'rejected') {
    // Somente tipo/status conhecidos; não vazar credenciais em erros do fornecedor.
    console.error(
      JSON.stringify({
        failed: jobs[i].provider.id,
        editionId: jobs[i].editionId,
        errorType: outcome.reason?.name,
        status: /API erro (\d{3})/.exec(outcome.reason?.message ?? '')?.[1],
      }),
    );
  }
}
if (outcomes.some((o) => o.status === 'rejected')) process.exitCode = 1;
