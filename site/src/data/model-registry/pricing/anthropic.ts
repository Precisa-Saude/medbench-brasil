import type { PublishedPricing } from '../pricing-types';

const source = 'https://platform.claude.com/docs/en/about-claude/pricing';
function price(input: number, output: number, quote: string): PublishedPricing {
  return {
    priceAsOf: '2026-11-03',
    pricePerMTokInputUSD: input,
    pricePerMTokOutputUSD: output,
    priceProvider: 'Anthropic (API direta)',
    priceQuote: quote,
    priceSource: source,
  };
}

/** Base input/output da tabela oficial, sem cache, batch ou fast mode. */
export const ANTHROPIC_PRICING: Record<string, PublishedPricing> = {
  // "Claude Fable 5", "$10 / MTok", "$50 / MTok".
  'claude-fable-5': price(10, 50, 'Claude Fable 5; $10 / MTok; $50 / MTok'),
  // "Claude Fable 5.1", "$10 / MTok", "$50 / MTok".
  'claude-fable-5-1': price(10, 50, 'Claude Fable 5.1; $10 / MTok; $50 / MTok'),
  // "Input | $0.10 / MTok for prompts up to 100,000 tokens";
  // "Output | $0.50 / MTok for prompts up to 100,000 tokens".
  'claude-haiku-5-5': {
    priceAsOf: '2026-11-04',
    priceMaxInputTokens: 100_000,
    pricePerMTokInputUSD: 0.1,
    pricePerMTokOutputUSD: 0.5,
    priceProvider: 'Anthropic (API direta)',
    priceQuote:
      '$0.10 / MTok for prompts up to 100,000 tokens; $0.50 / MTok for prompts up to 100,000 tokens',
    priceSource: 'https://platform.claude.com/docs/en/models/haiku-5-5/overview',
  },
  // "Claude Opus 4.5", "$5 / MTok", "$25 / MTok". Sem garantir faixa longa.
  'claude-opus-4-5': {
    ...price(5, 25, 'Claude Opus 4.5; $5 / MTok; $25 / MTok'),
    priceMaxInputTokens: 200_000,
  },
  // "Claude Opus 4.6", "$5 / MTok", "$25 / MTok".
  'claude-opus-4-6': price(5, 25, 'Claude Opus 4.6; $5 / MTok; $25 / MTok'),
  // "Claude Opus 4.7", "$5 / MTok", "$25 / MTok".
  'claude-opus-4-7': price(5, 25, 'Claude Opus 4.7; $5 / MTok; $25 / MTok'),
  // "Claude Opus 4.8", "$5 / MTok", "$25 / MTok".
  'claude-opus-4-8': price(5, 25, 'Claude Opus 4.8; $5 / MTok; $25 / MTok'),
  // "Claude Opus 5", "$5 / MTok", "$25 / MTok".
  'claude-opus-5': price(5, 25, 'Claude Opus 5; $5 / MTok; $25 / MTok'),
  // "Claude Opus 5.5", "$4 / MTok", "$20 / MTok".
  'claude-opus-5-5': price(4, 20, 'Claude Opus 5.5; $4 / MTok; $20 / MTok'),
  // "Claude Sonnet 5", "$2 / MTok", "$10 / MTok". A nota 3 tornou o preço padrão.
  'claude-sonnet-5': price(2, 10, 'Claude Sonnet 5; $2 / MTok; $10 / MTok'),
};
