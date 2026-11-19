import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

// Descobre todo scored JSON com `usage`, para que resultados novos entrem na
// conferência sem precisar editar este teste.
const withUsage = readdirSync(resultsDir, { withFileTypes: true })
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
  .map((c) => ({
    ...c,
    scored: JSON.parse(readFileSync(c.scoredPath, 'utf8')) as EvaluationResult,
  }))
  .filter(({ scored }) => scored.usage !== undefined)
  .sort((a, b) => a.file.localeCompare(b.file));

const cases = withUsage.filter(({ scored }) => scored.usage!.maxInputTokensPerCall !== undefined);

// O `summarizeUsage` só omite o máximo quando alguma chamada ficou sem consumo.
// Um resultado completo que perde o campo falha aqui, em vez de sair da conferência.
it('todo resultado com consumo completo publica o máximo de entrada', () => {
  const missing = withUsage
    .filter(({ scored }) => scored.usage!.callsWithUsage === scored.usage!.totalCalls)
    .filter(({ scored }) => scored.usage!.maxInputTokensPerCall === undefined)
    .map(({ file }) => file);
  expect(missing).toEqual([]);
});

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
    expect(existsSync(rawLogPath), `${file} sem o .raw.jsonl ao lado`).toBe(true);
    const before = JSON.parse(readFileSync(scoredPath, 'utf8')) as EvaluationResult;
    const rows = readFileSync(rawLogPath, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as RawResponseRecord);
    const { accepted, coverage } = partitionRawRecords({
      editionId,
      malformedLines: 0,
      eligibleQuestionIds: before.perQuestion!.map((q) => q.questionId),
      records: rows,
      runsPerQuestion: before.runsPerQuestion,
    });
    expect(isRawCoverageComplete(coverage)).toBe(true);
    expect(Object.values(coverage.exclusions).every((n) => n === 0)).toBe(true);
    // Mesma base do `summarizeUsage`: só os registros aceitos.
    const observedMax = accepted.reduce((max, row) => Math.max(max, row.usage!.inputTokens), 0);
    // O valor gravado é o que o site usa para confirmar a faixa de preço.
    expect(before.usage?.maxInputTokensPerCall, file).toBe(observedMax);
    // Atualizar somente usage evita o reordenamento legado de arrays de runs
    // de um rescore completo. Runner/rescore-from-raw são testados no fixture sintético.
    const after = { ...before, usage: summarizeUsage(accepted) };
    expect(after.usage?.maxInputTokensPerCall).toBe(observedMax);
    expect(withoutMaximum(after)).toEqual(withoutMaximum(before));
    expect(rescoreFromScored(scoredPath).usage).toEqual(before.usage);
  });
});
