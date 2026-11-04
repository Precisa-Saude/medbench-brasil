// Auditoria offline: não faz requests. --refresh-max altera somente usage.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { classifyContamination, loadEdition } from '../../dataset/dist/index.js';
import {
  isRawCoverageComplete,
  parseLetter,
  partitionRawRecords,
  scoreRun,
  summarizeUsage,
  SYSTEM_PROMPT,
} from '../dist/index.js';
import {
  ARGON_EDITION,
  ARGON_MODEL,
  EXCLUDED_ATTEMPT_ID,
  selectArgonResume,
} from './argon-resume-state.mjs';

const configs = [
  {
    model: 'openai/gpt-6.1-terra',
    cutoff: '2026-06-01',
    inputRate: 1,
    outputRate: 5,
    maxTokens: 8192,
    provider: 'OpenAI',
  },
  {
    model: 'claude-haiku-5-5',
    cutoff: undefined,
    inputRate: 0.1,
    outputRate: 0.5,
    maxTokens: 8192,
  },
  {
    model: 'google/gemini-4-argon',
    cutoff: undefined,
    inputRate: 2,
    outputRate: 10,
    maxTokens: 32768,
    provider: 'Google',
  },
];
const reports = [];
const allAttemptIds = new Set();
const readJsonl = (path) => readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse);
const withoutMax = (value) => {
  const copy = structuredClone(value);
  if (copy.usage) delete copy.usage.maxInputTokensPerCall;
  return copy;
};
for (const config of configs)
  for (const editionId of ['revalida-2025-2', 'revalida-2026-1']) {
    const edition = loadEdition(editionId);
    const eligible = edition.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
    const questionById = new Map(eligible.map((q) => [q.id, q]));
    const base = fileURLToPath(
      new URL(
        `../../../results/${editionId}/${config.model.replace(/[^a-z0-9.-]/gi, '_')}`,
        import.meta.url,
      ),
    );
    const rows = readJsonl(`${base}.raw.jsonl`);
    const attempts = readJsonl(`${base}.eval.requests.jsonl`);
    if (!existsSync(`${base}.json`) && process.argv.includes('--completed-only')) {
      reports.push({
        model: config.model,
        editionId,
        status: 'incomplete',
        responses: rows.length,
        attempts: attempts.length,
      });
      continue;
    }
    const scored = JSON.parse(readFileSync(`${base}.json`, 'utf8'));
    const { accepted, coverage } = partitionRawRecords({
      editionId,
      records: rows,
      eligibleQuestionIds: eligible.map((q) => q.id),
      runsPerQuestion: 3,
      malformedLines: 0,
    });
    assert(isRawCoverageComplete(coverage));
    assert(Object.values(coverage.exclusions).every((n) => n === 0));
    assert.equal(accepted.length, eligible.length * 3);
    const success = attempts.filter((a) => a.outcome === 'success');
    let excludedOperationalResponses = 0;
    if (existsSync(`${base}.resume.jsonl`)) {
      assert.equal(config.model, ARGON_MODEL);
      assert.equal(editionId, ARGON_EDITION);
      const manifest = readJsonl(`${base}.resume.jsonl`);
      assert.equal(manifest.length, 1);
      const m = manifest[0];
      assert.equal(m.excludedAttemptId, EXCLUDED_ATTEMPT_ID);
      assert.equal(m.authorizedAt, '2026-11-04');
      assert.equal(m.preservedResponses, 44);
      assert.equal(m.maxNewCalls, 208);
      const originalRaw = readFileSync(`${base}.interrupted.raw.jsonl`);
      const originalLedger = readFileSync(`${base}.interrupted.eval.requests.jsonl`);
      const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
      assert.equal(hash(originalRaw), m.originalRawSHA256);
      assert.equal(hash(originalLedger), m.originalLedgerSHA256);
      assert(
        readFileSync(`${base}.eval.requests.jsonl`)
          .subarray(0, originalLedger.length)
          .equals(originalLedger),
      );
      const original = selectArgonResume(
        readJsonl(`${base}.interrupted.raw.jsonl`),
        readJsonl(`${base}.interrupted.eval.requests.jsonl`),
      );
      for (const prior of original.accepted)
        assert.deepEqual(
          rows.find((row) => row.attemptId === prior.attemptId),
          prior,
        );
      assert(!rows.some((row) => row.attemptId === EXCLUDED_ATTEMPT_ID));
      assert.equal(attempts.filter((attempt) => attempt.runId === m.runId).length, 208);
      const scoredAttempts = new Set(rows.map((row) => row.attemptId));
      const unscored = attempts.filter((attempt) => !scoredAttempts.has(attempt.attemptId));
      assert.equal(unscored.length, 1);
      assert.equal(unscored[0].attemptId, EXCLUDED_ATTEMPT_ID);
      excludedOperationalResponses = 1;
    }
    assert.equal(success.length, rows.length + excludedOperationalResponses);
    const attemptById = new Map(attempts.map((a) => [a.attemptId, a]));
    for (const attempt of attempts) {
      assert(!allAttemptIds.has(attempt.attemptId), 'Attempt ID duplicado.');
      allAttemptIds.add(attempt.attemptId);
      assert.equal(attempt.purpose, 'eval');
      assert.equal(attempt.modelId, config.model);
      assert.equal(attempt.editionId, editionId);
      assert(questionById.has(attempt.questionId));
    }
    for (const row of rows) {
      const q = questionById.get(row.questionId);
      assert(q);
      assert.equal(row.modelId, config.model);
      assert.equal(row.parsed, parseLetter(row.rawResponse));
      assert(row.parsed);
      assert.equal(row.correct, row.parsed === q.correct);
      const attempt = attemptById.get(row.attemptId);
      assert.equal(attempt?.outcome, 'success');
      for (const field of [
        'editionId',
        'modelId',
        'questionId',
        'run',
        'runId',
        'startedAt',
        'usage',
        'responseMetadata',
      ])
        assert.deepEqual(row[field], attempt[field], field);
      assert.equal(row.responseMetadata?.resolvedModel, config.model);
      const userPrompt = `${q.stem}\n\n${['A', 'B', 'C', 'D'].map((k) => `${k}) ${q.options[k]}`).join('\n')}`;
      const expected = config.provider
        ? {
            model: config.model,
            max_tokens: config.maxTokens,
            reasoning_effort: 'high',
            provider: { allow_fallbacks: false, require_parameters: true },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }
        : {
            model: config.model,
            max_tokens: config.maxTokens,
            output_config: { effort: 'high' },
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          };
      assert.deepEqual(row.requestParams, expected);
      assert.equal(row.stopReason, config.provider ? 'stop' : 'end_turn');
      if (config.provider) assert.equal(row.responseMetadata.provider, config.provider);
    }
    const { risk, basis } = classifyContamination(edition, config.cutoff);
    const rescored = scoreRun(
      config.model,
      3,
      rows.map((row) => ({
        question: questionById.get(row.questionId),
        parsed: row.parsed,
        correct: row.correct,
        contamination: risk,
        usage: row.usage,
      })),
    );
    if (basis) rescored.contaminationBasis = basis;
    assert.deepEqual(withoutMax(scored), withoutMax(rescored), 'Score diferente dos raws.');
    const usage = summarizeUsage(rows);
    const completeUsage = usage?.callsWithUsage === rows.length;
    const maxInput = completeUsage
      ? Math.max(...rows.map((row) => row.usage.inputTokens))
      : undefined;
    if (process.argv.includes('--refresh-max') && maxInput !== undefined) {
      const updated = { ...scored, usage: { ...scored.usage, maxInputTokensPerCall: maxInput } };
      assert.deepEqual(withoutMax(updated), withoutMax(scored));
      writeFileSync(`${base}.json`, JSON.stringify(updated, null, 2));
    }
    const perRun = [1, 2, 3].map(
      (run) =>
        rows.filter((row) => row.run === run).filter((row) => row.correct).length / eligible.length,
    );
    const mean = perRun.reduce((sum, value) => sum + value, 0) / 3;
    assert(Math.abs(mean - scored.accuracy) < 1e-12);
    reports.push({
      model: config.model,
      editionId,
      questions: eligible.length,
      responses: rows.length,
      attempts: attempts.length,
      failedAttempts: attempts.length - success.length,
      excludedOperationalResponses,
      accuracy: scored.accuracy,
      ci95: scored.ci95,
      perRun,
      mean,
      contamination: risk,
      usage,
      maxInputTokensPerCall: maxInput,
      referenceUSD: completeUsage
        ? (usage.inputTokens * config.inputRate + usage.outputTokens * config.outputRate) / 1e6
        : null,
    });
  }
console.log(JSON.stringify(reports, null, 2));
