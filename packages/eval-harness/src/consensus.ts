import type { QuestionOption } from '@precisa-saude/medbench-dataset';

import type { EvaluationResult } from './types.js';

export interface ConsensusError {
  consensusDistractor: QuestionOption;
  correctAnswer: QuestionOption;
  editionId: string;
  failingCount: number;
  /** Fração dos modelos reprovados que convergiram para o mesmo distractor. */
  failingRate: number;
  modelsFailing: string[];
  questionId: string;
  questionNumber: number;
}

export interface ConsensusOptions {
  /**
   * Número mínimo absoluto de modelos reprovados na questão. Evita reportar
   * "consenso" quando apenas 1 modelo errou.
   */
  minFailingCount?: number;
  /**
   * Fração mínima dos modelos reprovados que precisa convergir para o mesmo
   * distractor. Padrão 0,8 (80%) — alinhado com a análise qualitativa de
   * Correia et al., PROPOR 2026, que destaca questões em que o consenso
   * chegou a 100%.
   */
  minFailingRate?: number;
}

/**
 * Identifica questões em que os modelos reprovados convergem para o mesmo
 * distractor — sinal de um viés sistemático (e.g., protocolo internacional vs
 * diretriz SUS, viés para intervenção). Ver Correia et al., PROPOR 2026,
 * secção 5.4 (Q83, Q20) para o framing original.
 *
 * Para cada edição, agrupamos os `perQuestion` de todos os modelos pela
 * questão. Um modelo "reprova" a questão quando sua resposta majoritária é
 * diferente do gabarito. Se ≥ `minFailingRate` dos reprovados escolhem a
 * mesma letra — e se houver ao menos `minFailingCount` reprovados — a
 * questão entra na lista.
 */
export function findConsensusErrors(
  results: EvaluationResult[],
  editionId: string,
  options: ConsensusOptions = {},
): ConsensusError[] {
  const minFailingRate = options.minFailingRate ?? 0.8;
  const minFailingCount = options.minFailingCount ?? 3;

  const byQuestion = new Map<
    string,
    {
      correctAnswer: QuestionOption;
      distractorCounts: Map<QuestionOption, { count: number; models: string[] }>;
      failingModels: string[];
      questionNumber: number;
    }
  >();

  for (const result of results) {
    if (!result.perQuestion) continue;
    for (const pq of result.perQuestion) {
      if (pq.editionId !== editionId) continue;
      if (pq.majority === null) continue;
      if (pq.majorityCorrect) continue;
      const slot = byQuestion.get(pq.questionId) ?? {
        correctAnswer: pq.correctAnswer,
        distractorCounts: new Map<QuestionOption, { count: number; models: string[] }>(),
        failingModels: [],
        questionNumber: pq.questionNumber,
      };
      slot.failingModels.push(result.modelId);
      const distractor = pq.majority;
      const dc = slot.distractorCounts.get(distractor) ?? { count: 0, models: [] };
      dc.count += 1;
      dc.models.push(result.modelId);
      slot.distractorCounts.set(distractor, dc);
      byQuestion.set(pq.questionId, slot);
    }
  }

  const out: ConsensusError[] = [];
  for (const [questionId, slot] of byQuestion) {
    const failingCount = slot.failingModels.length;
    if (failingCount < minFailingCount) continue;
    let top: null | { distractor: QuestionOption; models: string[] } = null;
    for (const [distractor, dc] of slot.distractorCounts) {
      if (top === null || dc.count > top.models.length) {
        top = { distractor, models: dc.models };
      }
    }
    if (top === null) continue;
    const rate = top.models.length / failingCount;
    if (rate < minFailingRate) continue;
    out.push({
      consensusDistractor: top.distractor,
      correctAnswer: slot.correctAnswer,
      editionId,
      failingCount,
      failingRate: rate,
      modelsFailing: top.models,
      questionId,
      questionNumber: slot.questionNumber,
    });
  }

  return out.sort((a, b) => b.failingRate - a.failingRate || b.failingCount - a.failingCount);
}
