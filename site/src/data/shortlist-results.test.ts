import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { classifyContamination, loadEdition } from '@precisa-saude/medbench-dataset';
import {
  parseLetter,
  type RawResponseRecord,
  type RequestAttemptRecord,
  scoreRun,
} from '@precisa-saude/medbench-harness';
import { describe, expect, it } from 'vitest';

import { getModelMetadata } from './models';
import { MODELS } from './results';

const completed = [
  { modelId: 'openai/gpt-6.1-terra', editionId: 'revalida-2025-2' },
  { modelId: 'openai/gpt-6.1-terra', editionId: 'revalida-2026-1' },
  { modelId: 'claude-haiku-5-5', editionId: 'revalida-2025-2' },
  { modelId: 'claude-haiku-5-5', editionId: 'revalida-2026-1' },
  { modelId: 'google/gemini-4-argon', editionId: 'revalida-2025-2' },
  { modelId: 'google/gemini-4-argon', editionId: 'revalida-2026-1' },
] as const;

describe.each(completed)('score auditado de $modelId em $editionId', ({ modelId, editionId }) => {
  it('confirma três runs, consumo, ledger e score recalculado dos raws', () => {
    const base = `../../../results/${editionId}/${modelId.replace(/[^a-z0-9.-]/gi, '_')}`;
    const read = (suffix: string) =>
      readFileSync(new URL(`${base}${suffix}`, import.meta.url), 'utf8');
    const rows = read('.raw.jsonl')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as RawResponseRecord);
    const attempts = read('.eval.requests.jsonl')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as RequestAttemptRecord);
    const questions = loadEdition(editionId).questions.filter(
      (q) => !q.annulled && !q.hasImage && !q.hasTable,
    );
    const byId = new Map(questions.map((q) => [q.id, q]));
    const { risk, basis } = classifyContamination(
      loadEdition(editionId),
      getModelMetadata(modelId).trainingCutoff,
    );
    expect(rows).toHaveLength(questions.length * 3);
    const resumed = modelId === 'google/gemini-4-argon' && editionId === 'revalida-2026-1';
    expect(attempts).toHaveLength(rows.length + (resumed ? 1 : 0));
    expect(new Set(attempts.map((attempt) => attempt.attemptId)).size).toBe(attempts.length);
    if (resumed) {
      const manifest = JSON.parse(read('.resume.jsonl'));
      expect(manifest.excludedAttemptId).toBe('127126cd-621b-40ea-add2-4a20fc71bdf8');
      expect(manifest.maxNewCalls).toBe(208);
      const hash = (text: string) => createHash('sha256').update(text).digest('hex');
      expect(hash(read('.interrupted.raw.jsonl'))).toBe(manifest.originalRawSHA256);
      expect(hash(read('.interrupted.eval.requests.jsonl'))).toBe(manifest.originalLedgerSHA256);
      expect(
        read('.eval.requests.jsonl').startsWith(read('.interrupted.eval.requests.jsonl')),
      ).toBe(true);
      const originals = read('.interrupted.raw.jsonl')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as RawResponseRecord);
      const preserved = originals.filter((row) => row.attemptId !== manifest.excludedAttemptId);
      expect(preserved).toHaveLength(44);
      for (const row of preserved)
        expect(rows.find((next) => next.attemptId === row.attemptId)).toEqual(row);
      const unscored = attempts.filter(
        (attempt) => !rows.some((row) => row.attemptId === attempt.attemptId),
      );
      expect(unscored.map((attempt) => attempt.attemptId)).toEqual([manifest.excludedAttemptId]);
      expect(originals.find((row) => row.attemptId === manifest.excludedAttemptId)).toMatchObject({
        stopReason: 'error',
        parsed: null,
        rawResponse: '',
      });
    }
    expect(new Set(rows.map((row) => `${row.questionId}/${row.run}`)).size).toBe(rows.length);
    const records = rows.map((row) => {
      const question = byId.get(row.questionId)!;
      expect(question).toBeDefined();
      expect([1, 2, 3]).toContain(row.run);
      expect(row.parsed).not.toBeNull();
      expect(row.parsed).toBe(parseLetter(row.rawResponse));
      expect(row.correct).toBe(row.parsed === question.correct);
      expect(row.responseMetadata?.resolvedModel).toBe(modelId);
      expect(['stop', 'end_turn']).toContain(row.stopReason);
      expect(attempts.find((attempt) => attempt.attemptId === row.attemptId)).toMatchObject({
        outcome: 'success',
        questionId: row.questionId,
        run: row.run,
        usage: row.usage,
      });
      return {
        question,
        parsed: row.parsed,
        correct: row.correct,
        contamination: risk,
        usage: row.usage,
      };
    });
    const rescored = scoreRun(modelId, 3, records);
    expect(JSON.parse(read('.json'))).toEqual({
      ...rescored,
      ...(basis ? { contaminationBasis: basis } : {}),
    });
    const cost = MODELS.find((model) => model.modelId === modelId)?.costByEdition[editionId]?.all;
    expect(cost?.status).toBe('available');
  });
});
