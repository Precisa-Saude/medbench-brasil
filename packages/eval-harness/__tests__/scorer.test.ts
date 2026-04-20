import type { Question, QuestionOption } from '@precisa-saude/medbench-dataset';
import { describe, expect, it } from 'vitest';

import { type RunRecord, scoreRun } from '../src/scorer.js';

function mkQuestion(
  id: string,
  specialty: Question['specialty'],
  correct: QuestionOption = 'A',
): Question {
  return {
    annulled: false,
    correct,
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
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'A',
        question: mkQuestion('1', ['cirurgia']),
      },
      {
        contamination: 'likely-clean',
        correct: false,
        parsed: 'B',
        question: mkQuestion('2', ['cirurgia']),
      },
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

  it('calcula Macro-F1 e passesCutoff por edição', () => {
    // Distribuição 2A, 1B, 1C; modelo acerta só A (2/4 = 50%). Em revalida-2025-1
    // o corte é 0,5867 — abaixo do passesCutoff.
    //
    // Por classe, prevendo sempre "A":
    //   A: TP=2, FP=2, FN=0 → P=0.5, R=1.0, F1=0.667
    //   B: TP=0, FP=0, FN=1 → F1=0
    //   C: TP=0, FP=0, FN=1 → F1=0
    //   D: TP=0, FP=0, FN=0 → F1=0 (precision=recall=0)
    // Macro-F1 = 0.667 / 4 ≈ 0.167
    const records: RunRecord[] = [
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'A',
        question: mkQuestion('1', ['cirurgia'], 'A'),
      },
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'A',
        question: mkQuestion('2', ['cirurgia'], 'A'),
      },
      {
        contamination: 'likely-clean',
        correct: false,
        parsed: 'A',
        question: mkQuestion('3', ['cirurgia'], 'B'),
      },
      {
        contamination: 'likely-clean',
        correct: false,
        parsed: 'A',
        question: mkQuestion('4', ['cirurgia'], 'C'),
      },
    ];
    const result = scoreRun('modelo', 1, records);
    expect(result.accuracy).toBe(0.5);
    expect(result.macroF1).toBeCloseTo(0.667 / 4, 2);
    expect(result.accuracyByEdition?.['revalida-2025-1']).toMatchObject({
      accuracy: 0.5,
      n: 4,
      passesCutoff: false,
    });
  });

  it('passesCutoff fica true quando precisão atinge o corte da edição', () => {
    // revalida-2025-1 cutoff = 0.5867. 3/4 corretos = 0.75 → passa.
    const records: RunRecord[] = [
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'A',
        question: mkQuestion('1', ['cirurgia'], 'A'),
      },
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'B',
        question: mkQuestion('2', ['cirurgia'], 'B'),
      },
      {
        contamination: 'likely-clean',
        correct: true,
        parsed: 'C',
        question: mkQuestion('3', ['cirurgia'], 'C'),
      },
      {
        contamination: 'likely-clean',
        correct: false,
        parsed: 'A',
        question: mkQuestion('4', ['cirurgia'], 'D'),
      },
    ];
    const result = scoreRun('modelo', 1, records);
    expect(result.accuracyByEdition?.['revalida-2025-1']?.passesCutoff).toBe(true);
  });
});
