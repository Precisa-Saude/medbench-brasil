import { describe, expect, it } from 'vitest';

import type { CostResult } from './cost';
import { costComparison, type CostComparisonModel, paretoIds } from './cost-comparison';

function model(id: string, cost: number, accuracy: number): CostComparisonModel {
  const estimate: CostResult = {
    status: 'available',
    perQuestionUSD: cost,
    perResponseUSD: cost / 3,
    questions: 1,
    totalCalls: 3,
    totalUSD: cost,
    pricing: {
      priceAsOf: '2026-11-03',
      pricePerMTokInputUSD: 1,
      pricePerMTokOutputUSD: 2,
      priceProvider: 'fixture',
      priceQuote: 'fixture',
      priceSource: 'https://example.org',
    },
  };
  return {
    modelId: id,
    label: id,
    accuracyByEdition: { 'enamed-2026': { accuracy, n: 3 } },
    costByEdition: {
      'enamed-2026': {
        all: estimate,
        clean: estimate,
        contaminated: { status: 'unknown', reason: 'no-results' },
      },
    },
  };
}

describe('Pareto observada', () => {
  it('considera melhora estrita, mantendo empates e trade-offs', () => {
    const points = [
      { modelId: 'cheap', cost: 1, accuracy: 80 },
      { modelId: 'tie', cost: 1, accuracy: 80 },
      { modelId: 'better', cost: 2, accuracy: 90 },
      { modelId: 'dominated', cost: 2, accuracy: 80 },
      { modelId: 'worse', cost: 1, accuracy: 70 },
    ];
    expect([...paretoIds(points)]).toEqual(['cheap', 'tie', 'better']);
    expect([...paretoIds([])]).toEqual([]);
  });

  it('filtra por edição e escopo, sem misturar protocolos ou valores inválidos', () => {
    const missingEdition = { ...model('missing', 1, 0.5), accuracyByEdition: {} };
    const badAccuracy = model('invalid', 1, NaN);
    const missingCost = { ...model('no-cost', 1, 0.5), costByEdition: {} };
    const decision = { ...model('decision', 1, 1), isDecisionModel: true };
    const result = costComparison(
      [
        model('a', 1, 0.8),
        model('b', 2, 0.9),
        model('c', 2, 0.7),
        missingEdition,
        badAccuracy,
        missingCost,
        decision,
        model('bad-cost', Infinity, 0.9),
      ],
      'enamed-2026',
      'clean',
    );
    expect(result.points.map((p) => [p.modelId, p.accuracy, p.pareto])).toEqual([
      ['a', 80, true],
      ['b', 90, true],
      ['c', 70, false],
    ]);
    expect(result.excluded).toEqual({ decisionProtocol: 1, missingCost: 2, missingEdition: 2 });
    expect(costComparison([model('a', 1, 0.8)], 'enamed-2026', 'contaminated').points).toEqual([]);
    expect(costComparison([model('a', 1, 0.8)], 'enamed-2025', 'all').points).toEqual([]);
  });

  it('custo zero verdadeiro fica fora do eixo log, mas participa da fronteira', () => {
    const result = costComparison(
      [model('free', 0, 1), model('paid', 1, 0.9)],
      'enamed-2026',
      'all',
    );
    expect(result.zeroCost).toHaveLength(1);
    expect(result.zeroCost[0]!.pareto).toBe(true);
    expect(result.points[0]!.pareto).toBe(false);
    expect(
      costComparison([model('negative', -1, 0.5)], 'enamed-2026', 'all').excluded.missingCost,
    ).toBe(1);
  });
});
