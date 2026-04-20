import { describe, expect, it } from 'vitest';

import { findConsensusErrors } from '../src/consensus.js';
import type { EvaluationResult, PerQuestionResult } from '../src/types.js';

function mkResult(modelId: string, perQuestion: PerQuestionResult[]): EvaluationResult {
  return {
    accuracy: 0,
    accuracyByEdition: {},
    ci95: [0, 0],
    contaminationSplit: { clean: null, contaminated: null },
    correct: 0,
    modelId,
    perQuestion,
    perSpecialty: {},
    runsPerQuestion: 3,
    total: perQuestion.length,
  };
}

function mkPQ(
  qid: string,
  number: number,
  majority: PerQuestionResult['majority'],
  correct: PerQuestionResult['correctAnswer'],
): PerQuestionResult {
  return {
    contamination: 'likely-clean',
    correctAnswer: correct,
    editionId: 'revalida-2025-1',
    majority,
    majorityCorrect: majority === correct,
    questionId: qid,
    questionNumber: number,
    runs: [{ correct: majority === correct, parsed: majority }],
    specialty: ['clinica-medica'],
  };
}

describe('findConsensusErrors', () => {
  it('detecta questão em que 100% dos reprovados escolhem o mesmo distractor', () => {
    const results = [
      mkResult('m1', [mkPQ('q1', 1, 'B', 'A'), mkPQ('q2', 2, 'A', 'A')]),
      mkResult('m2', [mkPQ('q1', 1, 'B', 'A'), mkPQ('q2', 2, 'A', 'A')]),
      mkResult('m3', [mkPQ('q1', 1, 'B', 'A'), mkPQ('q2', 2, 'C', 'A')]),
      mkResult('m4', [mkPQ('q1', 1, 'A', 'A'), mkPQ('q2', 2, 'A', 'A')]),
    ];
    const errors = findConsensusErrors(results, 'revalida-2025-1', { minFailingCount: 3 });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      consensusDistractor: 'B',
      correctAnswer: 'A',
      failingCount: 3,
      questionId: 'q1',
    });
    expect(errors[0]!.failingRate).toBe(1);
  });

  it('ignora questões com poucos reprovados', () => {
    const results = [
      mkResult('m1', [mkPQ('q1', 1, 'B', 'A')]),
      mkResult('m2', [mkPQ('q1', 1, 'A', 'A')]),
      mkResult('m3', [mkPQ('q1', 1, 'A', 'A')]),
    ];
    const errors = findConsensusErrors(results, 'revalida-2025-1', { minFailingCount: 3 });
    expect(errors).toHaveLength(0);
  });

  it('ignora questões onde reprovados não convergem', () => {
    const results = [
      mkResult('m1', [mkPQ('q1', 1, 'B', 'A')]),
      mkResult('m2', [mkPQ('q1', 1, 'C', 'A')]),
      mkResult('m3', [mkPQ('q1', 1, 'D', 'A')]),
    ];
    const errors = findConsensusErrors(results, 'revalida-2025-1', {
      minFailingCount: 3,
      minFailingRate: 0.8,
    });
    expect(errors).toHaveLength(0);
  });
});
