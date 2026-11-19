import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const resultsDir = fileURLToPath(new URL('../../../results/', import.meta.url));

// Descobre todo scored JSON que publica `maxInputTokensPerCall`, para que
// resultados novos entrem na conferência sem precisar editar este teste.
const cases = readdirSync(resultsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((edition) =>
    readdirSync(join(resultsDir, edition.name))
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({
        editionId: edition.name as EditionId,
        file: `${edition.name}/${file}`,
        scoredPath: join(resultsDir, edition.name, file),
      })),
  )
  .filter(({ scoredPath }) => {
    const scored = JSON.parse(readFileSync(scoredPath, 'utf8')) as EvaluationResult;
    return scored.usage?.maxInputTokensPerCall !== undefined;
  })
  .sort((a, b) => a.file.localeCompare(b.file));

it('a descoberta inclui os resultados que introduziram o máximo publicado', () => {
  expect(cases.map((c) => c.file)).toEqual(
    expect.arrayContaining([
      'revalida-2025-2/claude-opus-5-5.json',
      'revalida-2025-2/x-ai_grok-4.7.json',
      'revalida-2026-1/claude-opus-5-5.json',
      'revalida-2026-1/x-ai_grok-4.7.json',
    ]),
  );
});

// `%s` em vez de `$file`: a interpolação por `$` trunca o nome do arquivo.
describe.each(cases.map((c) => [c.file, c] as const))('máximo publicado em %s', (file, c) => {
  const { editionId, scoredPath } = c;
  it('confere o máximo publicado com os raws sem alterar score, splits, votos ou consumo total', () => {
    const rawLogPath = scoredPath.replace(/\.json$/, '.raw.jsonl');
    const before = JSON.parse(readFileSync(scoredPath, 'utf8')) as EvaluationResult;
    const rows = readFileSync(rawLogPath, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as RawResponseRecord);
    const observedMax = rows.reduce((max, row) => Math.max(max, row.usage!.inputTokens), 0);
    // O valor gravado é o que o site usa para confirmar a faixa de preço.
    expect(before.usage?.maxInputTokensPerCall, file).toBe(observedMax);
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
