import type { Question } from '@precisa-saude/medbench-dataset';
import { describe, expect, it } from 'vitest';

import { scoreRun, type RunRecord } from '../src/scorer.js';

function mkQuestion(id: string, specialty: Question['specialty']): Question {
  return {
    annulled: false,
    correct: 'A',
    editionId: 'revalida-2025-1',
    hasImage: false,
    hasTable: false,
    id,
    number: 1,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    specialty,
    stem: 'stem',
  };
}

describe('scoreRun', () => {
  it('calcula acurácia geral, por especialidade e split de contaminação', () => {
    const records: RunRecord[] = [
      { contamination: 'likely-clean', correct: true, parsed: 'A', question: mkQuestion('1', ['cirurgia']) },
      { contamination: 'likely-clean', correct: false, parsed: 'B', question: mkQuestion('2', ['cirurgia']) },
      {
        contamination: 'likely-contaminated',
        correct: true,
        parsed: 'A',
        question: mkQuestion('3', ['pediatria']),
      },
    ];
    const result = scoreRun('modelo-teste', 1, records);
    expect(result.total).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.accuracy).toBeCloseTo(2 / 3, 5);
    expect(result.perSpecialty.cirurgia).toEqual({ accuracy: 0.5, n: 2 });
    expect(result.perSpecialty.pediatria).toEqual({ accuracy: 1, n: 1 });
    expect(result.contaminationSplit.clean?.accuracy).toBeCloseTo(0.5, 5);
    expect(result.contaminationSplit.contaminated?.accuracy).toBe(1);
    expect(result.ci95[0]).toBeLessThanOrEqual(result.accuracy);
    expect(result.ci95[1]).toBeGreaterThanOrEqual(result.accuracy);
  });

  it('lida com conjunto vazio sem quebrar', () => {
    const result = scoreRun('modelo', 1, []);
    expect(result.accuracy).toBe(0);
    expect(result.total).toBe(0);
    expect(result.ci95).toEqual([0, 0]);
  });
});
