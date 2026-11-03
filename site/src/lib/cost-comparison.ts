import type { ContaminationScope } from '../components/ContaminationToggle';
import type { ModelResult } from '../data/results';
import type { CostResult } from './cost';

export interface CostPoint {
  accuracy: number;
  cost: number;
  estimate: Extract<CostResult, { status: 'available' }>;
  label: string;
  modelId: string;
  pareto: boolean;
}

/** Dominância observada, sem alegação de significância ou competência clínica. */
export function paretoIds(
  points: Array<{ accuracy: number; cost: number; modelId: string }>,
): Set<string> {
  return new Set(
    points
      .filter(
        (point) =>
          !points.some(
            (other) =>
              other.cost <= point.cost &&
              other.accuracy >= point.accuracy &&
              (other.cost < point.cost || other.accuracy > point.accuracy),
          ),
      )
      .map((point) => point.modelId),
  );
}

export type CostComparisonModel = Pick<
  ModelResult,
  'accuracyByEdition' | 'costByEdition' | 'isDecisionModel' | 'label' | 'modelId'
>;

export function costComparison(
  models: CostComparisonModel[],
  editionId: string,
  scope: ContaminationScope,
) {
  const eligible: Omit<CostPoint, 'pareto'>[] = [];
  const excluded = { decisionProtocol: 0, missingCost: 0, missingEdition: 0 };
  for (const model of models) {
    if (model.isDecisionModel) {
      excluded.decisionProtocol++;
      continue;
    }
    const accuracy = model.accuracyByEdition[editionId]?.accuracy;
    if (accuracy === undefined || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
      excluded.missingEdition++;
      continue;
    }
    const estimate = model.costByEdition[editionId]?.[scope];
    if (
      !estimate ||
      estimate.status !== 'available' ||
      !Number.isFinite(estimate.perQuestionUSD) ||
      estimate.perQuestionUSD < 0
    ) {
      excluded.missingCost++;
      continue;
    }
    eligible.push({
      accuracy: accuracy * 100,
      cost: estimate.perQuestionUSD,
      estimate,
      label: model.label,
      modelId: model.modelId,
    });
  }
  const frontier = paretoIds(eligible);
  const all = eligible
    .map((point) => ({ ...point, pareto: frontier.has(point.modelId) }))
    .sort((a, b) => a.cost - b.cost || b.accuracy - a.accuracy);
  return {
    excluded,
    points: all.filter((p) => p.cost > 0),
    zeroCost: all.filter((p) => p.cost === 0),
  };
}
