import type { ContaminationRisk, Edition } from './types.js';

/**
 * Classifica o risco de contaminação de uma edição para um modelo específico.
 *
 * Regra v1: se a data de publicação da edição é posterior ao corte de treino
 * do modelo, a edição é considerada provavelmente limpa. Caso contrário,
 * provavelmente contaminada. Quando o corte é desconhecido, retorna 'unknown'.
 */
export function getModelContaminationRisk(
  edition: Pick<Edition, 'publishedAt'>,
  modelTrainingCutoff: string | undefined,
): ContaminationRisk {
  if (!modelTrainingCutoff) return 'unknown';
  const editionTs = Date.parse(edition.publishedAt);
  const cutoffTs = Date.parse(modelTrainingCutoff);
  if (Number.isNaN(editionTs) || Number.isNaN(cutoffTs)) return 'unknown';
  return editionTs > cutoffTs ? 'likely-clean' : 'likely-contaminated';
}
