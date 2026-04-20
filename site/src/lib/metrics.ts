import type { ContaminationScope } from '../components/ContaminationToggle';
import type { ModelResult } from '../data/results';

export type SpecialtyBucket = { accuracy: number; n: number };

/**
 * Recalcula `perSpecialty` respeitando o escopo de contaminação. O campo
 * nativo do artefato é sempre "tudo agregado"; para os escopos `clean` e
 * `contaminated` precisamos filtrar questão a questão.
 *
 * Retorna `{}` quando `scope !== 'all'` e o modelo não tem `perQuestion`
 * — o chamador deve tratar "record vazio" como "sem dados" (não como "zero").
 */
export function perSpecialtyForScope(
  model: ModelResult,
  scope: ContaminationScope,
): Record<string, SpecialtyBucket> {
  switch (scope) {
    case 'all':
      return model.perSpecialty;
    case 'clean':
      return filterPerSpecialty(model, 'likely-clean');
    case 'contaminated':
      return filterPerSpecialty(model, 'likely-contaminated');
  }
}

function filterPerSpecialty(
  model: ModelResult,
  target: 'likely-clean' | 'likely-contaminated',
): Record<string, SpecialtyBucket> {
  const perQuestion = model.perQuestion ?? [];
  const acc: Record<string, { correct: number; n: number }> = {};
  for (const q of perQuestion) {
    if (q.contamination !== target) continue;
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
 * próprio modelo. `scope` respeita o toggle de contaminação quando
 * disponível no chamador — default `'all'` preserva o comportamento antigo.
 */
export function poolSpecialtyMean(
  models: ModelResult[],
  options: { excludeModelId?: string; scope?: ContaminationScope } = {},
): Record<string, { accuracy: number; max: number; min: number; n: number }> {
  const { excludeModelId, scope = 'all' } = options;
  const acc: Record<string, { correctSum: number; max: number; min: number; nSum: number }> = {};
  for (const m of models) {
    if (m.modelId === excludeModelId) continue;
    for (const [sp, bucket] of Object.entries(perSpecialtyForScope(m, scope))) {
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
