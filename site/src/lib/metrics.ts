import type { ContaminationScope } from '../components/ContaminationToggle';
import type { ModelResult } from '../data/results';

export type SpecialtyBucket = { accuracy: number; n: number };

/**
 * Recalcula `perSpecialty` respeitando o escopo de contaminação. O campo
 * nativo do artefato é sempre "tudo agregado"; quando o toggle está em
 * "apenas limpas" precisamos filtrar questão a questão.
 */
export function perSpecialtyForScope(
  model: ModelResult,
  scope: ContaminationScope,
): Record<string, SpecialtyBucket> {
  if (scope === 'all') return model.perSpecialty;

  const perQuestion = model.perQuestion ?? [];
  const acc: Record<string, { correct: number; n: number }> = {};
  for (const q of perQuestion) {
    if (q.contamination !== 'likely-clean') continue;
    const correct = q.majorityCorrect ? 1 : 0;
    for (const sp of q.specialty) {
      const cur = acc[sp] ?? { correct: 0, n: 0 };
      cur.correct += correct;
      cur.n += 1;
      acc[sp] = cur;
    }
  }
  const out: Record<string, SpecialtyBucket> = {};
  for (const [sp, { correct, n }] of Object.entries(acc)) {
    if (n > 0) out[sp] = { accuracy: correct / n, n };
  }
  return out;
}

/**
 * Média (ponderada por `n`) da precisão em cada specialty, agregando todos
 * os modelos. `excludeModelId` tira o modelo atual do pool para que a
 * comparação "este modelo × pool" em ModelDetail não fique viesada pelo
 * próprio modelo.
 */
export function poolSpecialtyMean(
  models: ModelResult[],
  excludeModelId?: string,
): Record<string, { accuracy: number; max: number; min: number; n: number }> {
  const acc: Record<string, { correctSum: number; max: number; min: number; nSum: number }> = {};
  for (const m of models) {
    if (m.modelId === excludeModelId) continue;
    for (const [sp, bucket] of Object.entries(m.perSpecialty)) {
      if (bucket.n === 0) continue;
      const cur = acc[sp] ?? {
        correctSum: 0,
        max: -Infinity,
        min: Infinity,
        nSum: 0,
      };
      cur.correctSum += bucket.accuracy * bucket.n;
      cur.nSum += bucket.n;
      cur.min = Math.min(cur.min, bucket.accuracy);
      cur.max = Math.max(cur.max, bucket.accuracy);
      acc[sp] = cur;
    }
  }
  const out: Record<string, { accuracy: number; max: number; min: number; n: number }> = {};
  for (const [sp, { correctSum, max, min, nSum }] of Object.entries(acc)) {
    if (nSum > 0) out[sp] = { accuracy: correctSum / nSum, max, min, n: nSum };
  }
  return out;
}
