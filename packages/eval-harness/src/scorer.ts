import type { Question, QuestionOption } from '@precisa-saude/medbench-dataset';

import type { EvaluationResult } from './types.js';

export interface RunRecord {
  contamination: 'likely-clean' | 'likely-contaminated' | 'unknown';
  correct: boolean;
  parsed: QuestionOption | null;
  question: Question;
}

/**
 * IC 95% para uma proporção (Wilson score interval) — evita problemas de
 * cobertura do método normal em proporções próximas a 0 ou 1.
 */
function wilsonInterval(successes: number, total: number): [number, number] {
  if (total === 0) return [0, 0];
  const p = successes / total;
  const z = 1.96;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

export function scoreRun(
  modelId: string,
  runsPerQuestion: number,
  records: RunRecord[],
): EvaluationResult {
  const total = records.length;
  const correct = records.filter((r) => r.correct).length;
  const accuracy = total === 0 ? 0 : correct / total;

  const perSpecialty: Record<string, { accuracy: number; correct: number; n: number }> = {};
  for (const rec of records) {
    for (const sp of rec.question.specialty) {
      const bucket = perSpecialty[sp] ?? { accuracy: 0, correct: 0, n: 0 };
      bucket.n += 1;
      if (rec.correct) bucket.correct += 1;
      bucket.accuracy = bucket.n === 0 ? 0 : bucket.correct / bucket.n;
      perSpecialty[sp] = bucket;
    }
  }

  const clean = records.filter((r) => r.contamination === 'likely-clean');
  const cont = records.filter((r) => r.contamination === 'likely-contaminated');

  const bucket = (rs: RunRecord[]) =>
    rs.length === 0
      ? null
      : { accuracy: rs.filter((r) => r.correct).length / rs.length, n: rs.length };

  const perSpecialtyOut: Record<string, { accuracy: number; n: number }> = {};
  for (const [sp, b] of Object.entries(perSpecialty)) {
    perSpecialtyOut[sp] = { accuracy: b.accuracy, n: b.n };
  }

  return {
    accuracy,
    ci95: wilsonInterval(correct, total),
    contaminationSplit: {
      clean: bucket(clean),
      contaminated: bucket(cont),
    },
    correct,
    modelId,
    perSpecialty: perSpecialtyOut,
    runsPerQuestion,
    total,
  };
}
