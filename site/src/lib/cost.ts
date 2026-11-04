import type { UsageSummary } from '@precisa-saude/medbench-harness';

import type { ContaminationScope } from '../components/ContaminationToggle';
import type { PricingFields, PublishedPricing } from '../data/model-registry/pricing-types';
import type { RawEvaluationArtifact } from '../data/results';

export type CostGap =
  | 'no-results'
  | 'no-usage'
  | 'partial-usage'
  | 'partial-score'
  | 'unpriced'
  | 'expired-price'
  | 'context-unknown'
  | 'scope-unavailable'
  | 'invalid-data';

export type CostResult =
  | { reason: CostGap; status: 'unknown' }
  | {
      perQuestionUSD: number;
      perResponseUSD: number;
      pricing: PublishedPricing;
      questions: number;
      status: 'available';
      totalCalls: number;
      totalUSD: number;
    };

export type ScopedCosts = Record<ContaminationScope, CostResult>;
const scopes: ContaminationScope[] = ['all', 'clean', 'contaminated'];
const unknown = (reason: CostGap): CostResult => ({ reason, status: 'unknown' });
const nonnegative = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;
const count = (n: unknown): n is number => nonnegative(n) && Number.isSafeInteger(n);
function day(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

function published(p: PricingFields): p is PublishedPricing {
  return (
    nonnegative(p.pricePerMTokInputUSD) &&
    nonnegative(p.pricePerMTokOutputUSD) &&
    typeof p.priceSource === 'string' &&
    /^https:\/\//.test(p.priceSource) &&
    typeof p.priceQuote === 'string' &&
    p.priceQuote.length > 0 &&
    typeof p.priceProvider === 'string' &&
    p.priceProvider.length > 0 &&
    typeof p.priceAsOf === 'string' &&
    day(p.priceAsOf)
  );
}

function validUsage(u: UsageSummary, total: number): boolean {
  return (
    count(u.inputTokens) &&
    count(u.outputTokens) &&
    count(u.callsWithUsage) &&
    count(u.totalCalls) &&
    u.callsWithUsage <= u.totalCalls &&
    u.totalCalls === total &&
    (u.maxInputTokensPerCall === undefined ||
      (count(u.maxInputTokensPerCall) &&
        u.maxInputTokensPerCall <= u.inputTokens &&
        (u.callsWithUsage > 0
          ? u.maxInputTokensPerCall >= Math.ceil(u.inputTokens / u.callsWithUsage)
          : u.maxInputTokensPerCall === 0 && u.inputTokens === 0)))
  );
}

/** Estimativa à tarifa de referência, não fatura da rota que executou a prova. */
export function estimateCost(
  artifacts: RawEvaluationArtifact[],
  pricing: PricingFields,
  asOf = new Date().toISOString().slice(0, 10),
): CostResult {
  if (artifacts.length === 0) return unknown('no-results');
  if (artifacts.some((a) => !a.usage)) return unknown('no-usage');
  if (!published(pricing)) return unknown('unpriced');
  if (!day(asOf) || pricing.priceAsOf > asOf) return unknown('invalid-data');
  if (pricing.priceValidThrough !== undefined) {
    if (!day(pricing.priceValidThrough)) return unknown('invalid-data');
    if (asOf > pricing.priceValidThrough) return unknown('expired-price');
  }
  let totalUSD = 0;
  let questions = 0;
  let totalCalls = 0;
  for (const artifact of artifacts) {
    const usage = artifact.usage!;
    if (
      !count(artifact.total) ||
      artifact.total === 0 ||
      !count(artifact.runsPerQuestion) ||
      artifact.runsPerQuestion !== 3 ||
      artifact.total % artifact.runsPerQuestion !== 0 ||
      !validUsage(usage, artifact.total)
    )
      return unknown('invalid-data');
    if (artifact.rawCoverage) return unknown('partial-score');
    if (usage.callsWithUsage !== usage.totalCalls) return unknown('partial-usage');
    if (pricing.priceMaxInputTokens !== undefined) {
      if (!count(pricing.priceMaxInputTokens) || pricing.priceMaxInputTokens === 0)
        return unknown('invalid-data');
      const maxInput = usage.maxInputTokensPerCall ?? usage.inputTokens;
      if (maxInput > pricing.priceMaxInputTokens) return unknown('context-unknown');
    }
    // Reasoning já pertence à saída. Cache já pertence à entrada. Tarifa
    // de referência não aplica descontos nem soma breakdowns novamente.
    totalUSD +=
      (usage.inputTokens * pricing.pricePerMTokInputUSD +
        usage.outputTokens * pricing.pricePerMTokOutputUSD) /
      1_000_000;
    totalCalls += artifact.total;
    questions += artifact.total / artifact.runsPerQuestion;
  }
  if (!Number.isFinite(totalUSD)) return unknown('invalid-data');
  return {
    perQuestionUSD: totalUSD / questions,
    perResponseUSD: totalUSD / totalCalls,
    pricing,
    questions,
    status: 'available',
    totalCalls,
    totalUSD,
  };
}

export function estimateScopedCost(
  artifacts: RawEvaluationArtifact[],
  pricing: PricingFields,
  scope: ContaminationScope,
  asOf?: string,
): CostResult {
  if (scope === 'all') return estimateCost(artifacts, pricing, asOf);
  const selected: RawEvaluationArtifact[] = [];
  for (const artifact of artifacts) {
    const n = artifact.contaminationSplit[scope === 'clean' ? 'clean' : 'contaminated']?.n ?? 0;
    if (n === 0) continue;
    if (n !== artifact.total) return unknown('scope-unavailable');
    selected.push(artifact);
  }
  return estimateCost(selected, pricing, asOf);
}

/** Mantém consumo e acurácia no mesmo conjunto de edições/chamadas. */
export function deriveCosts(
  artifacts: RawEvaluationArtifact[],
  pricing: PricingFields,
  asOf?: string,
) {
  const costByScope = Object.fromEntries(
    scopes.map((scope) => [scope, estimateScopedCost(artifacts, pricing, scope, asOf)]),
  ) as ScopedCosts;
  const costByEdition: Record<string, ScopedCosts> = {};
  for (const artifact of artifacts) {
    const ids = Object.keys(artifact.accuracyByEdition ?? {});
    for (const id of ids) {
      costByEdition[id] = Object.fromEntries(
        scopes.map((scope) => [
          scope,
          ids.length === 1 && artifact.accuracyByEdition![id]!.n === artifact.total
            ? estimateScopedCost([artifact], pricing, scope, asOf)
            : unknown('scope-unavailable'),
        ]),
      ) as ScopedCosts;
    }
  }
  return { costByEdition, costByScope };
}

export const COST_GAP_LABEL: Record<CostGap, string> = {
  'context-unknown': 'O agregado não permite confirmar a faixa de tamanho de cada prompt.',
  'expired-price':
    'A validade da tarifa registrada terminou; é preciso verificar a fonte novamente.',
  'invalid-data': 'Consumo, número de execuções ou dados de preço inválidos para esta estimativa.',
  'no-results': 'Sem resultados no escopo selecionado.',
  'no-usage': 'Há avaliações anteriores à captura de tokens ou sem usage informado pela API.',
  'partial-score': 'O score tem cobertura parcial; custo completo por questão indisponível.',
  'partial-usage': 'Nem todas as chamadas do score têm consumo registrado.',
  'scope-unavailable': 'O consumo agregado não permite separar este escopo de avaliação.',
  unpriced: 'Não há tarifa de referência em USD com fonte verificada para este modelo.',
};

export function formatCostUSD(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'USD',
    maximumFractionDigits: 8,
    minimumFractionDigits: 4,
    style: 'currency',
  }).format(value);
}

/** Lacunas ficam no fim em ambos os sentidos da ordenação. */
export function compareCosts(a: CostResult, b: CostResult, direction: 'asc' | 'desc'): number {
  if (a.status === 'unknown') return b.status === 'unknown' ? 0 : 1;
  if (b.status === 'unknown') return -1;
  return (a.perQuestionUSD - b.perQuestionUSD) * (direction === 'asc' ? 1 : -1);
}
