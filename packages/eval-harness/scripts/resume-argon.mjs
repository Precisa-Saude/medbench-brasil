// Retomada limitada a 208 chamadas. Sem retries; preserva os originais.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { loadEdition } from '../../dataset/dist/index.js';
import {
  isRawCoverageComplete,
  observeRequest,
  openAiCompatProvider,
  parseLetter,
  partitionRawRecords,
  scoreRun,
  SYSTEM_PROMPT,
} from '../dist/index.js';
import {
  ARGON_EDITION,
  ARGON_MODEL,
  EXCLUDED_ATTEMPT_ID,
  selectArgonResume,
} from './argon-resume-state.mjs';

const base = fileURLToPath(
  new URL('../../../results/revalida-2026-1/google_gemini-4-argon', import.meta.url),
);
const rawPath = `${base}.raw.jsonl`;
const ledgerPath = `${base}.eval.requests.jsonl`;
const rawArchive = `${base}.interrupted.raw.jsonl`;
const ledgerArchive = `${base}.interrupted.eval.requests.jsonl`;
const manifestPath = `${base}.resume.jsonl`;
const rawBytes = readFileSync(rawPath);
const ledgerBytes = readFileSync(ledgerPath);
const readRows = (bytes) => bytes.toString('utf8').trim().split('\n').map(JSON.parse);
const rows = readRows(rawBytes);
const attempts = readRows(ledgerBytes);
const { accepted, excluded } = selectArgonResume(rows, attempts);
const edition = loadEdition(ARGON_EDITION);
const eligible = edition.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
const byId = new Map(eligible.map((q) => [q.id, q]));
const prompt = (q) =>
  `${q.stem}\n\n${['A', 'B', 'C', 'D'].map((k) => `${k}) ${q.options[k]}`).join('\n')}`;
const params = (q) => ({
  model: ARGON_MODEL,
  max_tokens: 32768,
  reasoning_effort: 'high',
  provider: { allow_fallbacks: false, require_parameters: true },
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt(q) },
  ],
});
for (const row of rows) {
  const q = byId.get(row.questionId);
  assert(q);
  assert.deepEqual(row.requestParams, params(q));
  assert.equal(row.responseMetadata?.resolvedModel, ARGON_MODEL);
  assert.equal(row.responseMetadata?.provider, 'Google');
  assert.equal(row.parsed, parseLetter(row.rawResponse));
  assert.equal(row.correct, row.parsed === q.correct);
}
const existing = new Set(accepted.map((row) => `${row.questionId}/${row.run}`));
const tasks = eligible.flatMap((q) =>
  [1, 2, 3].filter((run) => !existing.has(`${q.id}/${run}`)).map((run) => ({ q, run })),
);
assert.equal(tasks.length, 208);
assert(!existsSync(`${base}.json`), 'Score já existente.');
for (const path of [rawArchive, ledgerArchive, manifestPath, `${rawPath}.resume.tmp`])
  assert(!existsSync(path), 'Retomada já iniciada; não repetir.');
if (process.argv.includes('--dry-run')) {
  console.log(
    JSON.stringify({
      model: ARGON_MODEL,
      editionId: ARGON_EDITION,
      preserved: accepted.length,
      excluded: excluded.map((row) => row.attemptId),
      maxNewCalls: tasks.length,
    }),
  );
  process.exit(0);
}
assert(
  process.argv[2] && !process.argv[2].startsWith('--'),
  'Informe o caminho do ambiente local.',
);
createRequire(new URL('../package.json', import.meta.url))('dotenv').config({
  path: process.argv[2],
  quiet: true,
});
assert(process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY ausente.');
const provider = openAiCompatProvider({
  model: ARGON_MODEL,
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  provider: 'OpenRouter',
  reasoningEffort: 'high',
  maxTokens: 32768,
  timeoutMs: 900_000,
});
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
writeFileSync(rawArchive, rawBytes, { flag: 'wx' });
writeFileSync(ledgerArchive, ledgerBytes, { flag: 'wx' });
const runId = randomUUID();
writeFileSync(
  manifestPath,
  `${JSON.stringify({ authorizedAt: '2026-11-04', reason: 'Operational finish_reason=error; explicit maintainer approval to retry once', runId, originalRawSHA256: hash(rawBytes), originalLedgerSHA256: hash(ledgerBytes), excludedAttemptId: EXCLUDED_ATTEMPT_ID, excludedQuestionId: 'revalida-2026-1-q22', excludedRun: 2, preservedResponses: 44, maxNewCalls: 208 })}\n`,
  { flag: 'wx' },
);
writeFileSync(
  `${rawPath}.resume.tmp`,
  accepted.map((row) => JSON.stringify(row)).join('\n') + '\n',
  { flag: 'wx' },
);
renameSync(`${rawPath}.resume.tmp`, rawPath);
const append = (path, record) => appendFileSync(path, `${JSON.stringify(record)}\n`);
let cursor = 0;
let stopped = false;
let calls = 0;
const outcomes = await Promise.allSettled(
  Array.from({ length: 3 }, async () => {
    try {
      while (!stopped) {
        const task = tasks[cursor++];
        if (!task) return;
        const { q, run } = task;
        calls += 1;
        assert(calls <= 208);
        const response = await observeRequest(
          provider,
          { question: q, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt(q) },
          {
            attempt: q.id === 'revalida-2026-1-q22' && run === 2 ? 2 : 1,
            purpose: 'eval',
            run,
            runId,
          },
          (record) => append(ledgerPath, record),
        );
        const parsed = parseLetter(response.rawResponse);
        const record = {
          attemptId: response.attemptId,
          runId,
          startedAt: response.startedAt,
          usage: response.usage,
          responseMetadata: response.responseMetadata,
          correct: parsed === q.correct,
          editionId: ARGON_EDITION,
          elapsedMs: response.timings.durationMs,
          modelId: ARGON_MODEL,
          parsed,
          questionId: q.id,
          rawResponse: response.rawResponse,
          requestParams: response.requestParams,
          run,
          stopReason: response.stopReason,
        };
        append(rawPath, record);
        accepted.push(record);
        assert(
          parsed && response.stopReason === 'stop',
          'Nova resposta anormal; retomada interrompida.',
        );
        assert.equal(response.responseMetadata?.resolvedModel, ARGON_MODEL);
        assert.equal(response.responseMetadata?.provider, 'Google');
        assert.deepEqual(response.requestParams, params(q));
        console.log(
          JSON.stringify({
            questionId: q.id,
            run,
            callsStarted: calls,
            responses: accepted.length,
            stopReason: response.stopReason,
          }),
        );
      }
    } catch (error) {
      stopped = true;
      throw error;
    }
  }),
);
assert.equal(hash(readFileSync(rawArchive)), hash(rawBytes));
assert.equal(hash(readFileSync(ledgerArchive)), hash(ledgerBytes));
assert(readFileSync(ledgerPath).subarray(0, ledgerBytes.length).equals(ledgerBytes));
if (outcomes.some((outcome) => outcome.status === 'rejected')) {
  console.error(
    JSON.stringify({
      stopped: true,
      callsStarted: calls,
      errors: outcomes
        .filter((outcome) => outcome.status === 'rejected')
        .map((outcome) => ({
          type: outcome.reason?.name,
          status: /API erro (\d{3})/.exec(outcome.reason?.message ?? '')?.[1],
        })),
    }),
  );
  process.exitCode = 1;
} else {
  assert.equal(calls, 208);
  const { coverage } = partitionRawRecords({
    editionId: ARGON_EDITION,
    records: accepted,
    eligibleQuestionIds: eligible.map((q) => q.id),
    runsPerQuestion: 3,
    malformedLines: 0,
  });
  assert(isRawCoverageComplete(coverage));
  assert(Object.values(coverage.exclusions).every((n) => n === 0));
  const result = scoreRun(
    ARGON_MODEL,
    3,
    accepted.map((row) => ({
      question: byId.get(row.questionId),
      parsed: row.parsed,
      correct: row.correct,
      contamination: 'unknown',
      usage: row.usage,
    })),
  );
  assert.equal(result.total, 252);
  assert.equal(readRows(readFileSync(ledgerPath)).length, 253);
  writeFileSync(`${base}.json`, JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log(
    JSON.stringify({
      completed: ARGON_MODEL,
      editionId: ARGON_EDITION,
      newCalls: calls,
      accuracy: result.accuracy,
      ci95: result.ci95,
      usage: result.usage,
    }),
  );
}
