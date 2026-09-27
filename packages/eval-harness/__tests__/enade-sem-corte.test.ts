import { describe, expect, it, vi } from 'vitest';

import type { EvaluationResult } from '../src/types.js';

/**
 * Arquivo separado de propósito: o mock de `@precisa-saude/medbench-dataset`
 * mexe no registry de módulos, e o vitest isola registry por ARQUIVO. Manter
 * este caso junto dos testes que usam o dataset real deixaria a isolação
 * dependente da ordem de execução dentro do arquivo.
 */
function mkResult(modelId: string, editionId: string, accuracy: number): EvaluationResult {
  return {
    accuracy,
    accuracyByEdition: { [editionId]: { accuracy, n: 100 } },
    ci95: [accuracy, accuracy],
    contaminationSplit: { clean: null, contaminated: null },
    correct: Math.round(accuracy * 100),
    modelId,
    perSpecialty: {},
    runsPerQuestion: 3,
    total: 100,
  };
}

vi.mock('@precisa-saude/medbench-dataset', () => ({
  // Edição sem `cutoffScore` — caso da ENAMED 2026 até o edital de resultado
  // de 04/12/2026. Usa o id de uma edição que TEM corte no dataset real, para
  // que o teste falhe se o mock deixar de pegar (verificado por ablação).
  loadEdition: () => ({
    id: 'revalida-2025-1',
    publishedAt: '2025-04-14',
    questions: [],
    source: 'https://example.invalid',
    year: 2025,
  }),
}));

describe('computeEnadeConcept sem corte oficial', () => {
  it('devolve null quando a edição não tem cutoffScore publicado', async () => {
    // Calcular conceito contra corte chutado seria pior que não devolver
    // conceito nenhum.
    const { computeEnadeConcept } = await import('../src/enade.js');
    const results = [
      mkResult('m1', 'revalida-2025-1', 0.9),
      mkResult('m2', 'revalida-2025-1', 0.8),
    ];
    expect(computeEnadeConcept(results, 'revalida-2025-1')).toBeNull();
  });
});
