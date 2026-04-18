import type { Question, QuestionOption } from '@precisa-saude/medbench-dataset';

import type { EvaluationResult, PerQuestionResult } from './types.js';

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

  const byEditionAcc: Record<string, { correct: number; n: number }> = {};
  for (const rec of records) {
    const eid = rec.question.editionId;
    const slot = byEditionAcc[eid] ?? { correct: 0, n: 0 };
    slot.n += 1;
    if (rec.correct) slot.correct += 1;
    byEditionAcc[eid] = slot;
  }
  const accuracyByEdition: Record<string, { accuracy: number; n: number }> = {};
  for (const [eid, slot] of Object.entries(byEditionAcc)) {
    accuracyByEdition[eid] = { accuracy: slot.n === 0 ? 0 : slot.correct / slot.n, n: slot.n };
  }

  const perQuestion = aggregatePerQuestion(records);

  return {
    accuracy,
    accuracyByEdition,
    ci95: wilsonInterval(correct, total),
    contaminationSplit: {
      clean: bucket(clean),
      contaminated: bucket(cont),
    },
    correct,
    modelId,
    perQuestion,
    perSpecialty: perSpecialtyOut,
    runsPerQuestion,
    total,
  };
}

function aggregatePerQuestion(records: RunRecord[]): PerQuestionResult[] {
  const byQ = new Map<string, { q: Question; runs: RunRecord[] }>();
  for (const rec of records) {
    const key = rec.question.id;
    const slot = byQ.get(key) ?? { q: rec.question, runs: [] };
    slot.runs.push(rec);
    byQ.set(key, slot);
  }
  const out: PerQuestionResult[] = [];
  for (const { q, runs } of byQ.values()) {
    const counts: Record<string, number> = {};
    for (const r of runs) {
      const key = r.parsed ?? '_null';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    let topKey: string | null = null;
    let topCount = -1;
    for (const [k, c] of Object.entries(counts)) {
      if (k === '_null') continue;
      if (c > topCount) {
        topKey = k;
        topCount = c;
      }
    }
    const majority = (topKey as QuestionOption | null) ?? null;
    out.push({
      contamination: runs[0]!.contamination,
      correctAnswer: q.correct,
      editionId: q.editionId,
      majority,
      majorityCorrect: majority === q.correct,
      questionId: q.id,
      questionNumber: q.number,
      runs: runs.map((r) => ({ correct: r.correct, parsed: r.parsed })),
      specialty: q.specialty,
    });
  }
  out.sort((a, b) =>
    a.editionId === b.editionId
      ? a.questionNumber - b.questionNumber
      : a.editionId.localeCompare(b.editionId),
  );
  return out;
}
