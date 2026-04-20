import type { EditionId } from '@precisa-saude/medbench-dataset';
import { loadEdition } from '@precisa-saude/medbench-dataset';

import type { EvaluationResult } from './types.js';

export type EnadeLevel = 1 | 2 | 3 | 4 | 5;

export interface EnadeConcept {
  approvedCount: number;
  approvedRate: number;
  cutoffScore: number;
  editionId: string;
  level: EnadeLevel;
  totalCount: number;
}

/**
 * Converte a fração de modelos acima do corte para o nível do Conceito Enade
 * (tabela adotada pelo MEC para avaliar escolas de medicina e replicada por
 * Correia et al., PROPOR 2026):
 *
 *   Nível 1: < 40%
 *   Nível 2: 40% – 59%
 *   Nível 3: 60% – 74%
 *   Nível 4: 75% – 89%
 *   Nível 5: ≥ 90%
 */
export function rateToEnadeLevel(approvedRate: number): EnadeLevel {
  if (approvedRate < 0.4) return 1;
  if (approvedRate < 0.6) return 2;
  if (approvedRate < 0.75) return 3;
  if (approvedRate < 0.9) return 4;
  return 5;
}

/**
 * Calcula o Conceito Enade agregado para uma edição, tratando o conjunto de
 * modelos avaliados como uma "turma" de egressos. Considera aprovado cada
 * modelo cuja precisão naquela edição atinge a nota de corte oficial.
 *
 * Modelos sem resultados para a edição em questão são ignorados (não contam
 * nem como aprovados nem como reprovados). Retorna `null` se ninguém tiver
 * sido avaliado — evita expor um Conceito 1 artificial.
 */
export function computeEnadeConcept(
  results: EvaluationResult[],
  editionId: EditionId | string,
): EnadeConcept | null {
  let cutoffScore: number;
  try {
    cutoffScore = loadEdition(editionId as EditionId).cutoffScore;
  } catch {
    return null;
  }

  let approvedCount = 0;
  let totalCount = 0;
  for (const result of results) {
    const entry = result.accuracyByEdition?.[editionId];
    if (!entry) continue;
    totalCount += 1;
    const passes = entry.passesCutoff ?? entry.accuracy >= cutoffScore;
    if (passes) approvedCount += 1;
  }

  if (totalCount === 0) return null;

  const approvedRate = approvedCount / totalCount;
  return {
    approvedCount,
    approvedRate,
    cutoffScore,
    editionId,
    level: rateToEnadeLevel(approvedRate),
    totalCount,
  };
}
