import { describe, expect, it } from 'vitest';

import type { PublishedPricing } from '../data/model-registry/pricing-types';
import type { RawEvaluationArtifact } from '../data/results';
import {
  compareCosts,
  COST_GAP_LABEL,
  deriveCosts,
  estimateCost,
  estimateScopedCost,
  formatCostUSD,
} from './cost';

const pricing: PublishedPricing = {
  priceAsOf: '2026-11-03',
  pricePerMTokInputUSD: 2,
  pricePerMTokOutputUSD: 10,
  priceProvider: 'Fixture API',
  priceQuote: 'fixture',
  priceSource: 'https://example.org/pricing',
};
const asOf = '2026-11-03';
function artifact(overrides: Partial<RawEvaluationArtifact> = {}): RawEvaluationArtifact {
  return {
    accuracy: 0.5,
    accuracyByEdition: { 'enamed-2026': { accuracy: 0.5, n: 6 } },
    ci95: [0.2, 0.8],
    contaminationSplit: { clean: { accuracy: 0.5, n: 6 }, contaminated: null },
    correct: 3,
    modelId: 'fixture',
    perSpecialty: {},
    runsPerQuestion: 3,
    total: 6,
    usage: { callsWithUsage: 6, inputTokens: 1_000_000, outputTokens: 1_000_000, totalCalls: 6 },
    ...overrides,
  };
}

describe('estimativa de custo', () => {
  it('inclui três execuções por questão e não soma reasoning/cache novamente', () => {
    const a = artifact();
    a.usage = { ...a.usage!, reasoningTokens: 900_000, cacheReadInputTokens: 500_000 };
    const result = estimateCost([a], pricing, asOf);
    expect(result).toMatchObject({
      status: 'available',
      totalUSD: 12,
      perQuestionUSD: 6,
      perResponseUSD: 2,
      questions: 2,
      totalCalls: 6,
      pricing,
    });
    expect(a).not.toHaveProperty('totalUSD');
    expect(estimateCost([a, a], pricing, asOf)).toMatchObject({
      totalUSD: 24,
      perQuestionUSD: 6,
      totalCalls: 12,
    });
  });

  it('zero observado e tarifa zero são válidos, não equivalem a ausência', () => {
    expect(
      estimateCost(
        [artifact()],
        { ...pricing, pricePerMTokInputUSD: 0, pricePerMTokOutputUSD: 0 },
        asOf,
      ),
    ).toMatchObject({ status: 'available', totalUSD: 0, perQuestionUSD: 0 });
    const a = artifact();
    a.usage = { ...a.usage!, inputTokens: 0, outputTokens: 0 };
    expect(estimateCost([a], pricing, asOf)).toMatchObject({ status: 'available', totalUSD: 0 });
  });

  it('nunca publica agregado parcialmente coberto como custo completo', () => {
    expect(estimateCost([], pricing, asOf)).toEqual({ status: 'unknown', reason: 'no-results' });
    expect(estimateCost([artifact(), artifact({ usage: undefined })], pricing, asOf)).toEqual({
      status: 'unknown',
      reason: 'no-usage',
    });
    const a = artifact();
    a.usage = { ...a.usage!, callsWithUsage: 5 };
    expect(estimateCost([a], pricing, asOf)).toEqual({
      status: 'unknown',
      reason: 'partial-usage',
    });
    expect(estimateCost([artifact({ rawCoverage: { coverage: 0.5 } })], pricing, asOf)).toEqual({
      status: 'unknown',
      reason: 'partial-score',
    });
  });

  it.each([
    { total: 0 },
    { total: 5 },
    { total: -6 },
    { runsPerQuestion: 0 },
    { runsPerQuestion: 1 },
    { runsPerQuestion: 2.5 },
  ])('rejeita denominador/protocolo inválido: %j', (values) => {
    expect(estimateCost([artifact(values)], pricing, asOf)).toEqual({
      status: 'unknown',
      reason: 'invalid-data',
    });
  });

  it.each([
    { inputTokens: -1 },
    { outputTokens: Infinity },
    { outputTokens: 1.5 },
    { totalCalls: 7 },
    { callsWithUsage: 7 },
    { callsWithUsage: -1 },
    { totalCalls: NaN },
  ])('rejeita consumo inválido: %j', (values) => {
    const a = artifact();
    a.usage = { ...a.usage!, ...values };
    expect(estimateCost([a], pricing, asOf)).toEqual({ status: 'unknown', reason: 'invalid-data' });
  });

  it('exige fonte e data verificável, sem preencher preço ausente', () => {
    expect(estimateCost([artifact()], {}, asOf)).toEqual({ status: 'unknown', reason: 'unpriced' });
    for (const p of [
      { ...pricing, priceSource: '' },
      { ...pricing, priceQuote: '' },
      { ...pricing, priceProvider: '' },
      { ...pricing, priceAsOf: '2026-02-30' },
      { ...pricing, pricePerMTokInputUSD: -1 },
      { ...pricing, pricePerMTokOutputUSD: NaN },
    ]) {
      expect(estimateCost([artifact()], p, asOf)).toEqual({
        status: 'unknown',
        reason: 'unpriced',
      });
    }
    expect(estimateCost([artifact()], pricing, '2026-11-02')).toMatchObject({
      reason: 'invalid-data',
    });
    expect(estimateCost([artifact()], pricing, 'not-a-date')).toMatchObject({
      reason: 'invalid-data',
    });
  });

  it('encerra promoção após o dia publicado e valida datas', () => {
    const p = { ...pricing, priceValidThrough: asOf };
    expect(estimateCost([artifact()], p, asOf).status).toBe('available');
    expect(estimateCost([artifact()], p, '2026-11-04')).toMatchObject({ reason: 'expired-price' });
    expect(
      estimateCost([artifact()], { ...p, priceValidThrough: '2026-13-01' }, asOf),
    ).toMatchObject({ reason: 'invalid-data' });
  });

  it('confirma faixa por limite suficiente, nunca pela média por chamada', () => {
    const p = { ...pricing, priceMaxInputTokens: 1_000_000 };
    expect(estimateCost([artifact()], p, asOf).status).toBe('available');
    expect(estimateCost([artifact(), artifact()], p, asOf).status).toBe('available');
    expect(estimateCost([artifact()], { ...p, priceMaxInputTokens: 999_999 }, asOf)).toMatchObject({
      reason: 'context-unknown',
    });
    expect(estimateCost([artifact()], { ...p, priceMaxInputTokens: 0 }, asOf)).toMatchObject({
      reason: 'invalid-data',
    });
  });

  it('usa máximo observado mesmo quando a soma ultrapassa a faixa', () => {
    const a = artifact();
    a.usage = { ...a.usage!, maxInputTokensPerCall: 200_000 };
    expect(estimateCost([a], { ...pricing, priceMaxInputTokens: 200_000 }, asOf)).toMatchObject({
      status: 'available',
      totalUSD: 12,
    });
    // Mesmo com média abaixo da faixa, uma chamada longa não cabe nela.
    a.usage.maxInputTokensPerCall = 200_001;
    expect(estimateCost([a], { ...pricing, priceMaxInputTokens: 200_000 }, asOf)).toMatchObject({
      reason: 'context-unknown',
    });
  });

  it.each([-1, NaN, Infinity, 1.5, 1_000_001, 100_000])(
    'rejeita máximo impossível: %s',
    (maximum) => {
      const a = artifact();
      a.usage = { ...a.usage!, maxInputTokensPerCall: maximum };
      expect(estimateCost([a], pricing, asOf)).toMatchObject({ reason: 'invalid-data' });
    },
  );

  it('permite máximo zero observado, mas mantém lacunas de cobertura', () => {
    const a = artifact();
    a.usage = { ...a.usage!, inputTokens: 0, outputTokens: 0, maxInputTokensPerCall: 0 };
    expect(estimateCost([a], { ...pricing, priceMaxInputTokens: 10 }, asOf)).toMatchObject({
      status: 'available',
      totalUSD: 0,
    });
    a.usage.callsWithUsage = 0;
    expect(estimateCost([a], pricing, asOf)).toMatchObject({ reason: 'partial-usage' });
    a.usage.inputTokens = 1;
    expect(estimateCost([a], pricing, asOf)).toMatchObject({ reason: 'invalid-data' });
  });

  it('overflow não produz número publicável', () => {
    expect(
      estimateCost([artifact()], { ...pricing, pricePerMTokInputUSD: Number.MAX_VALUE }, asOf),
    ).toMatchObject({ reason: 'invalid-data' });
  });
});

describe('escopo de consumo', () => {
  it('não pareia precisão limpa com custo de edições contaminadas ou desconhecidas', () => {
    const clean = artifact();
    const contaminated = artifact({
      accuracyByEdition: { 'enamed-2025': { accuracy: 0.8, n: 6 } },
      contaminationSplit: { clean: null, contaminated: { accuracy: 0.8, n: 6 } },
      usage: undefined,
    });
    const unknown = artifact({
      contaminationSplit: { clean: null, contaminated: null },
      usage: undefined,
    });
    expect(
      estimateScopedCost([clean, contaminated, unknown], pricing, 'clean', asOf),
    ).toMatchObject({ status: 'available', totalUSD: 12, totalCalls: 6 });
    expect(estimateScopedCost([clean, contaminated], pricing, 'contaminated', asOf)).toMatchObject({
      reason: 'no-usage',
    });
    expect(estimateScopedCost([clean, contaminated], pricing, 'all', asOf)).toMatchObject({
      reason: 'no-usage',
    });
    const result = deriveCosts([clean, contaminated], pricing, asOf);
    expect(result.costByEdition['enamed-2026']!.clean.status).toBe('available');
    expect(result.costByEdition['enamed-2025']!.clean).toMatchObject({ reason: 'no-results' });
    expect(result.costByScope.clean).toMatchObject({ totalUSD: 12 });
  });

  it('artefato misto não permite dividir consumo agregado por bucket', () => {
    const a = artifact({
      contaminationSplit: { clean: { n: 3, accuracy: 1 }, contaminated: { n: 3, accuracy: 0 } },
    });
    expect(estimateScopedCost([a], pricing, 'clean', asOf)).toMatchObject({
      reason: 'scope-unavailable',
    });
    a.accuracyByEdition!['enamed-2025'] = { accuracy: 0, n: 3 };
    expect(deriveCosts([a], pricing, asOf).costByEdition['enamed-2026']!.all).toMatchObject({
      reason: 'scope-unavailable',
    });
    expect(
      deriveCosts([artifact({ accuracyByEdition: undefined })], pricing, asOf).costByEdition,
    ).toEqual({});
    const inconsistent = artifact({
      accuracyByEdition: { 'enamed-2026': { accuracy: 0.5, n: 3 } },
    });
    expect(
      deriveCosts([inconsistent], pricing, asOf).costByEdition['enamed-2026']!.all,
    ).toMatchObject({ reason: 'scope-unavailable' });
  });
});

describe('formatação e ordenação', () => {
  it('mantém lacunas no fim nas duas direções e mostra valores pequenos', () => {
    const a = estimateCost([artifact()], pricing, asOf);
    const b = estimateCost(
      [artifact(), artifact()],
      { ...pricing, pricePerMTokOutputUSD: 20 },
      asOf,
    );
    const gap = estimateCost([], pricing, asOf);
    expect(compareCosts(a, b, 'asc')).toBeLessThan(0);
    expect(compareCosts(a, b, 'desc')).toBeGreaterThan(0);
    expect(compareCosts(gap, a, 'asc')).toBe(1);
    expect(compareCosts(gap, a, 'desc')).toBe(1);
    expect(compareCosts(a, gap, 'desc')).toBe(-1);
    expect(compareCosts(gap, gap, 'asc')).toBe(0);
    expect(formatCostUSD(0.000001)).toContain('0,000001');
    expect(formatCostUSD(0)).toContain('0,0000');
    expect(Object.values(COST_GAP_LABEL).every((label) => label.length > 10)).toBe(true);
  });
});
