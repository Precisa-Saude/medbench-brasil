import type { PublishedPricing } from '../pricing-types';

const source = 'https://ai.google.dev/gemini-api/docs/pricing';
export const GOOGLE_PRICING: Record<string, PublishedPricing> = {
  // Standard: "$1.25, prompts <= 200k tokens", "$10.00, prompts <= 200k tokens".
  // Em 01/12/2026, o alias passará a Gemini 3.8 Flash. Não herdar seu preço.
  'gemini-2.5-pro': {
    priceAsOf: '2026-11-03',
    priceMaxInputTokens: 200_000,
    pricePerMTokInputUSD: 1.25,
    pricePerMTokOutputUSD: 10,
    priceProvider: 'Google (Gemini Developer API)',
    priceQuote: '$1.25, prompts <= 200k tokens; $10.00, prompts <= 200k tokens',
    priceSource: source,
    priceValidThrough: '2026-11-30',
  },
  // Standard: "$0.75 through December 31, 2026.", "$3.75 through December 31, 2026.".
  'gemini-3.6-flash': {
    priceAsOf: '2026-11-03',
    pricePerMTokInputUSD: 0.75,
    pricePerMTokOutputUSD: 3.75,
    priceProvider: 'Google (Gemini Developer API)',
    priceQuote: '$0.75 through December 31, 2026.; $3.75 through December 31, 2026.',
    priceSource: source,
    priceValidThrough: '2026-12-31',
  },
};
