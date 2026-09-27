import { describe, expect, it } from 'vitest';

import { computeEnadeConcept, rateToEnadeLevel } from '../src/enade.js';
import type { EvaluationResult } from '../src/types.js';

function mkResult(modelId: string, editionId: string, accuracy: number): EvaluationResult {
  return {
    accuracy,
    accuracyByEdition: { [editionId]: { accuracy, n: 100, passesCutoff: accuracy >= 0.5867 } },
    ci95: [accuracy, accuracy],
    contaminationSplit: { clean: null, contaminated: null },
    correct: Math.round(accuracy * 100),
    modelId,
    perSpecialty: {},
    runsPerQuestion: 3,
    total: 100,
  };
}

describe('rateToEnadeLevel', () => {
  it('mapeia as fronteiras da tabela MEC', () => {
    expect(rateToEnadeLevel(0.39)).toBe(1);
    expect(rateToEnadeLevel(0.4)).toBe(2);
    expect(rateToEnadeLevel(0.59)).toBe(2);
    expect(rateToEnadeLevel(0.6)).toBe(3);
    expect(rateToEnadeLevel(0.74)).toBe(3);
    expect(rateToEnadeLevel(0.75)).toBe(4);
    expect(rateToEnadeLevel(0.89)).toBe(4);
    expect(rateToEnadeLevel(0.9)).toBe(5);
    expect(rateToEnadeLevel(1)).toBe(5);
  });
});

describe('computeEnadeConcept', () => {
  it('considera apenas modelos com resultado para a edição', () => {
    const results = [
      mkResult('m1', 'revalida-2025-1', 0.8),
      mkResult('m2', 'revalida-2025-1', 0.7),
      mkResult('m3', 'revalida-2025-1', 0.4),
      mkResult('m4', 'revalida-2024-1', 0.9),
    ];
    const concept = computeEnadeConcept(results, 'revalida-2025-1');
    expect(concept).not.toBeNull();
    expect(concept!.totalCount).toBe(3);
    expect(concept!.approvedCount).toBe(2);
    expect(concept!.approvedRate).toBeCloseTo(2 / 3, 5);
    // 66.7% → Nível 3 (60–74%).
    expect(concept!.level).toBe(3);
  });

  it('retorna null quando nenhum modelo tem resultado', () => {
    const results = [mkResult('m1', 'revalida-2024-1', 0.9)];
    expect(computeEnadeConcept(results, 'revalida-2025-1')).toBeNull();
  });
});
