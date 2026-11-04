import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { EditionId } from '@precisa-saude/medbench-dataset';
import { describe, expect, it } from 'vitest';

import { isRawCoverageComplete, partitionRawRecords } from '../src/raw-coverage.js';
import { rescoreFromScored } from '../src/rescore.js';
import type { EvaluationResult, RawResponseRecord } from '../src/types.js';
import { summarizeUsage } from '../src/usage.js';

function withoutMaximum(result: EvaluationResult): EvaluationResult {
  const copy = structuredClone(result);
  if (copy.usage) delete copy.usage.maxInputTokensPerCall;
  return copy;
}

const cases = [{ modelId: 'x-ai/grok-4.7' }, { modelId: 'claude-opus-5-5' }].flatMap((model) =>
  (['revalida-2025-2', 'revalida-2026-1'] as EditionId[]).map((editionId) => ({
    ...model,
    editionId,
  })),
);

describe.each(cases)('máximo derivado de $modelId / $editionId', ({ modelId, editionId }) => {
  it('reconstitui máximo dos raws sem alterar score, splits, votos ou consumo total', () => {
    const slug = modelId.replace(/[^a-z0-9.-]/gi, '_');
    const scoredPath = fileURLToPath(
      new URL(`../../../results/${editionId}/${slug}.json`, import.meta.url),
    );
    const rawLogPath = fileURLToPath(
      new URL(`../../../results/${editionId}/${slug}.raw.jsonl`, import.meta.url),
    );
    const before = JSON.parse(readFileSync(scoredPath, 'utf8')) as EvaluationResult;
    const rows = readFileSync(rawLogPath, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as RawResponseRecord);
    const observedMax = rows.reduce((max, row) => Math.max(max, row.usage!.inputTokens), 0);
    const { accepted, coverage } = partitionRawRecords({
      editionId,
      malformedLines: 0,
      eligibleQuestionIds: before.perQuestion!.map((q) => q.questionId),
      records: rows,
      runsPerQuestion: before.runsPerQuestion,
    });
    expect(isRawCoverageComplete(coverage)).toBe(true);
    expect(Object.values(coverage.exclusions).every((n) => n === 0)).toBe(true);
    // Atualizar somente usage evita o reordenamento legado de arrays de runs
    // de um rescore completo. Runner/rescore-from-raw são testados no fixture sintético.
    const after = { ...before, usage: summarizeUsage(accepted) };
    expect(after.usage?.maxInputTokensPerCall).toBe(observedMax);
    expect(withoutMaximum(after)).toEqual(withoutMaximum(before));
    expect(rescoreFromScored(scoredPath).usage).toEqual(before.usage);
  });
});
