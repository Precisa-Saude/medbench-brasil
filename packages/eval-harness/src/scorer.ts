import type { EditionId, Question, QuestionOption } from '@precisa-saude/medbench-dataset';
import { loadEdition } from '@precisa-saude/medbench-dataset';

import type { EvaluationResult, PerQuestionResult } from './types.js';

const QUESTION_OPTIONS: readonly QuestionOption[] = ['A', 'B', 'C', 'D'];

/**
 * Macro-F1 não ponderado sobre as classes A/B/C/D, usando a resposta
 * majoritária por questão como predição (empata com o paper Correia et al.).
 * Questões sem maioria (e.g., parse nulo em todas as runs) contam como erro
 * no recall mas não poluem precision — o predito não é nenhuma classe.
 */
function macroF1(
  perQuestion: Array<{ correctAnswer: QuestionOption; majority: null | QuestionOption }>,
): number {
  let sum = 0;
  for (const klass of QUESTION_OPTIONS) {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (const q of perQuestion) {
      const predicted = q.majority === klass;
      const actual = q.correctAnswer === klass;
      if (predicted && actual) tp += 1;
      else if (predicted && !actual) fp += 1;
      else if (!predicted && actual) fn += 1;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    sum += f1;
  }
  return sum / QUESTION_OPTIONS.length;
}

/**
 * Resolve a nota de corte oficial para uma edição, consultando o dataset.
 * Memoiza positivos e negativos para o tempo de vida do processo — falhas de
 * `loadEdition` aqui são I/O de arquivo em um dataset versionado; se o arquivo
 * não existe no disco agora, também não vai aparecer no meio da execução. Sem
 * o cache negativo, rescores em lote pagariam um `fs.readFileSync` para cada
 * questão de uma edição ausente. Quando o corte não pode ser resolvido,
 * `passesCutoff` no output fica `undefined`.
 */
const cutoffCache = new Map<string, null | number>();
function resolveCutoffScore(editionId: string): null | number {
  if (cutoffCache.has(editionId)) return cutoffCache.get(editionId) ?? null;
  try {
    const edition = loadEdition(editionId as EditionId);
    cutoffCache.set(editionId, edition.cutoffScore);
    return edition.cutoffScore;
  } catch {
    cutoffCache.set(editionId, null);
    return null;
  }
}

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
  const accuracyByEdition: Record<string, { accuracy: number; n: number; passesCutoff?: boolean }> =
    {};
  for (const [eid, slot] of Object.entries(byEditionAcc)) {
    const acc = slot.n === 0 ? 0 : slot.correct / slot.n;
    const cutoff = resolveCutoffScore(eid);
    const entry: { accuracy: number; n: number; passesCutoff?: boolean } = {
      accuracy: acc,
      n: slot.n,
    };
    if (cutoff !== null) entry.passesCutoff = acc >= cutoff;
    accuracyByEdition[eid] = entry;
  }

  const perQuestion = aggregatePerQuestion(records);
  const macro = macroF1(
    perQuestion.map((q) => ({ correctAnswer: q.correctAnswer, majority: q.majority })),
  );

  return {
    accuracy,
    accuracyByEdition,
    ci95: wilsonInterval(correct, total),
    contaminationSplit: {
      clean: bucket(clean),
      contaminated: bucket(cont),
    },
    correct,
    macroF1: macro,
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
