import type { ContaminationRisk, Edition } from './types.js';

/**
 * Em que se apoia a classificação de contaminação de uma edição:
 *
 * - `cutoff`: corte de treino declarado pelo fornecedor (regra principal).
 * - `release-date`: sem corte declarado, a data de publicação dos pesos do
 *   modelo serve de limite superior — ver `getModelContaminationRisk`.
 */
export type ContaminationBasis = 'cutoff' | 'release-date';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Timestamp de uma data `AAAA-MM-DD` exata, ou `null`. Mais estrito que
 * `Date.parse`, que aceita `"2025-07"` como 1º de julho: justamente o marcador
 * de mês que a regra da data de lançamento proíbe virar limite do corte.
 */
export function parseIsoDay(value: string): number | null {
  if (!ISO_DAY.test(value)) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

/**
 * Classifica o risco de contaminação de uma edição para um modelo específico.
 *
 * Regra principal: com corte de treino declarado, a edição publicada depois do
 * corte é provavelmente limpa; antes, provavelmente contaminada.
 *
 * Fallback, só sem corte declarado: `weightsReleaseDate` é a data em que os
 * pesos do modelo foram publicados. Pesos publicados não mudam, e nenhum dado
 * de treino pode ser posterior a eles, então uma edição aplicada **depois**
 * dessa data não pode estar no treino → provavelmente limpa. Uma edição
 * anterior continua `unknown`: o lançamento limita o corte por cima, não diz
 * se a prova entrou. O fallback nunca produz `likely-contaminated`.
 *
 * Quem chama só deve passar `weightsReleaseDate` para pesos imutáveis
 * (open-weight) com data de lançamento de fonte publicada; num modelo de API,
 * o fornecedor pode trocar o que está atrás do mesmo id depois do lançamento.
 * Ver docs/contamination.md.
 */
export function getModelContaminationRisk(
  edition: Pick<Edition, 'publishedAt'>,
  modelTrainingCutoff: string | undefined,
  weightsReleaseDate?: string,
): ContaminationRisk {
  return classifyContamination(edition, modelTrainingCutoff, weightsReleaseDate).risk;
}

/** Como `getModelContaminationRisk`, devolvendo também a base da decisão. */
export function classifyContamination(
  edition: Pick<Edition, 'publishedAt'>,
  modelTrainingCutoff: string | undefined,
  weightsReleaseDate?: string,
): { basis: ContaminationBasis | null; risk: ContaminationRisk } {
  const editionTs = Date.parse(edition.publishedAt);
  if (Number.isNaN(editionTs)) return { basis: null, risk: 'unknown' };

  if (modelTrainingCutoff) {
    const cutoffTs = Date.parse(modelTrainingCutoff);
    if (Number.isNaN(cutoffTs)) return { basis: null, risk: 'unknown' };
    return {
      basis: 'cutoff',
      risk: editionTs > cutoffTs ? 'likely-clean' : 'likely-contaminated',
    };
  }

  if (weightsReleaseDate) {
    const releaseTs = parseIsoDay(weightsReleaseDate);
    if (releaseTs !== null && editionTs > releaseTs) {
      return { basis: 'release-date', risk: 'likely-clean' };
    }
  }
  return { basis: null, risk: 'unknown' };
}
