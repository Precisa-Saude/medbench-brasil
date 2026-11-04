/** Consumo declarado pela API, sem estimativas por texto ou valores monetários. */
export interface TokenUsage {
  cacheReadInputTokens?: number;
  cacheWrite1hInputTokens?: number;
  cacheWrite5mInputTokens?: number;
  cacheWriteInputTokens?: number;
  /** Inclui cache lido e escrito. */
  inputTokens: number;
  /** Inclui raciocínio; não somar `reasoningTokens` novamente. */
  outputTokens: number;
  reasoningTokens?: number;
  /** Total declarado pelo fornecedor, não calculado pelo harness. */
  totalTokens?: number;
}

export interface UsageSummary extends TokenUsage {
  callsWithUsage: number;
  /** Máximo observado, incluindo cache; ausente se houver chamadas sem usage válido. */
  maxInputTokensPerCall?: number;
  totalCalls: number;
}

/** Valida também os contadores opcionais lidos de raws antigos. */
export function isTokenUsage(value: unknown): value is TokenUsage {
  if (!value || typeof value !== 'object') return false;
  const u = value as Record<string, unknown>;
  const valid = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  if (!valid(u.inputTokens) || !valid(u.outputTokens)) return false;
  const optional = [
    'cacheReadInputTokens',
    'cacheWriteInputTokens',
    'cacheWrite5mInputTokens',
    'cacheWrite1hInputTokens',
    'reasoningTokens',
    'totalTokens',
  ];
  if (optional.some((key) => u[key] !== undefined && !valid(u[key]))) return false;
  const usage = value as TokenUsage;
  return (
    (usage.reasoningTokens ?? 0) <= usage.outputTokens &&
    (usage.cacheReadInputTokens ?? 0) + (usage.cacheWriteInputTokens ?? 0) <= usage.inputTokens
  );
}

/** Campos parciais não aparecem como totais completos. */
export function summarizeUsage(records: Array<{ usage?: TokenUsage }>): UsageSummary | undefined {
  const known = records.flatMap((r) => (isTokenUsage(r.usage) ? [r.usage] : []));
  if (known.length === 0) return undefined;
  const summary: UsageSummary = {
    callsWithUsage: known.length,
    inputTokens: known.reduce((sum, u) => sum + u.inputTokens, 0),
    outputTokens: known.reduce((sum, u) => sum + u.outputTokens, 0),
    totalCalls: records.length,
  };
  if (known.length === records.length) {
    summary.maxInputTokensPerCall = known.reduce((max, u) => Math.max(max, u.inputTokens), 0);
  }
  const details = [
    'cacheReadInputTokens',
    'cacheWriteInputTokens',
    'cacheWrite5mInputTokens',
    'cacheWrite1hInputTokens',
    'reasoningTokens',
    'totalTokens',
  ] as const;
  for (const key of details) {
    if (known.every((u) => u[key] !== undefined)) {
      summary[key] = known.reduce((sum, u) => sum + u[key]!, 0);
    }
  }
  return summary;
}
