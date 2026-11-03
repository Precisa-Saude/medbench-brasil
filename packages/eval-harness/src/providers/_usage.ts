import type { ResponseMetadata } from '../types.js';
import { isTokenUsage, type TokenUsage } from '../usage.js';

export type UsageFormat = 'anthropic' | 'google' | 'openai';
type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function details(values: Record<string, unknown>): Partial<TokenUsage> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => count(value) !== undefined),
  );
}

/** Normalização baseada nos contratos oficiais citados no ADR 0005. */
function parseUsage(format: UsageFormat, value: unknown): TokenUsage | undefined {
  const u = object(value);
  if (format === 'anthropic') {
    if (
      [u.cache_read_input_tokens, u.cache_creation_input_tokens].some(
        (v) => v !== undefined && v !== null && count(v) === undefined,
      )
    )
      return undefined;
    const input = count(u.input_tokens);
    const output = count(u.output_tokens);
    if (input === undefined || output === undefined) return undefined;
    const read = count(u.cache_read_input_tokens);
    const write = count(u.cache_creation_input_tokens);
    const cache = object(u.cache_creation);
    return {
      inputTokens: input + (read ?? 0) + (write ?? 0),
      outputTokens: output,
      ...details({
        cacheReadInputTokens: read,
        cacheWrite1hInputTokens: cache.ephemeral_1h_input_tokens,
        cacheWrite5mInputTokens: cache.ephemeral_5m_input_tokens,
        cacheWriteInputTokens: write,
      }),
    };
  }
  if (format === 'google') {
    const input = count(u.promptTokenCount);
    const candidates = count(u.candidatesTokenCount);
    const thoughts = count(u.thoughtsTokenCount);
    const total = count(u.totalTokenCount);
    // Não há ferramentas no protocolo. O total permite recuperar a saída
    // inclusive quando uma resposta filtrada omite candidatesTokenCount.
    const output =
      total !== undefined && input !== undefined
        ? count(total - input)
        : candidates === undefined
          ? undefined
          : candidates + (thoughts ?? 0);
    if (input === undefined || output === undefined) return undefined;
    return {
      inputTokens: input,
      outputTokens: output,
      ...details({
        cacheReadInputTokens: u.cachedContentTokenCount,
        reasoningTokens: thoughts,
        totalTokens: total,
      }),
    };
  }
  const input = count(u.prompt_tokens);
  const output = count(u.completion_tokens);
  if (input === undefined || output === undefined) return undefined;
  const prompt = object(u.prompt_tokens_details);
  return {
    inputTokens: input,
    outputTokens: output,
    ...details({
      cacheReadInputTokens: prompt.cached_tokens,
      cacheWriteInputTokens: prompt.cache_write_tokens,
      reasoningTokens: object(u.completion_tokens_details).reasoning_tokens,
      totalTokens: u.total_tokens,
    }),
  };
}

export function normalizeUsage(format: UsageFormat, value: unknown): TokenUsage | undefined {
  const usage = parseUsage(format, value);
  return isTokenUsage(usage) ? usage : undefined;
}

export function responseAccounting(
  response: Response,
  value: unknown,
  format: UsageFormat,
  endpoint: string,
): { responseMetadata: ResponseMetadata; usage?: TokenUsage } {
  const body = object(value);
  const url = new URL(endpoint);
  const usage = normalizeUsage(format, format === 'google' ? body.usageMetadata : body.usage);
  const metadata = {
    endpoint: `${url.origin}${url.pathname}`,
    provider: text(body.provider),
    requestId:
      text(response.headers?.get('request-id')) ?? text(response.headers?.get('x-request-id')),
    resolvedModel: text(body.modelVersion) ?? text(body.model),
    responseId: text(body.responseId) ?? text(body.id),
    serviceTier:
      text(body.service_tier) ??
      text(object(body.usage).service_tier) ??
      text(object(body.usageMetadata).serviceTier),
  };
  return { responseMetadata: metadata, ...(usage ? { usage } : {}) };
}

export class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly accounting: ReturnType<typeof responseAccounting>,
  ) {
    super(message);
    this.name = 'ProviderHttpError';
  }
}

/** Retém apenas contadores conhecidos e metadata; nunca headers de autenticação. */
export async function providerHttpError(
  provider: string,
  response: Response,
  format: UsageFormat,
  endpoint: string,
): Promise<ProviderHttpError> {
  const body = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = undefined;
  }
  return new ProviderHttpError(
    `${provider} API erro ${response.status}: ${body}`,
    responseAccounting(response, parsed, format, endpoint),
  );
}
